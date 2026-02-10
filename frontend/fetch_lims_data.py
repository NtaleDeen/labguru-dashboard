import os
import sys
import re
import json
import logging
import time
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pathlib import Path
import boto3

# --- Base Paths ---
def get_application_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

APPLICATION_BASE_DIR = get_application_base_dir()
PUBLIC_DIR = Path(APPLICATION_BASE_DIR) / 'public'
LOGS_DIR = Path(APPLICATION_BASE_DIR) / 'debug'
DATA_JSON_PATH = PUBLIC_DIR / 'data.json'

os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# --- Load ENV ---
load_dotenv(os.path.join(APPLICATION_BASE_DIR, '.env'))
LIMS_URL = os.getenv('LIMS_URL', 'http://192.168.10.84:8080')
LOGIN_URL = f"{LIMS_URL}/index.php?m=login"
HOME_URL = f"{LIMS_URL}/home.php"
SEARCH_URL = f"{LIMS_URL}/search.php"

LIMS_USER = os.getenv('LIMS_USERNAME')
LIMS_PASSWORD = os.getenv('LIMS_PASSWORD')
R2_ENDPOINT_URL = os.getenv('R2_ENDPOINT_URL')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_LOG_BUCKET_NAME = os.getenv('R2_LOG_BUCKET_NAME')
R2_CLIENT_FOLDER = os.getenv('R2_CLIENT_FOLDER')

# File Paths
DATA_FILE = os.path.join(APPLICATION_BASE_DIR, 'public', 'data.json')
LAST_RUN_FILE = os.path.join(APPLICATION_BASE_DIR, '.last_run')
COMPREHENSIVE_RUN_FILE = os.path.join(APPLICATION_BASE_DIR, '.last_comprehensive_run')
LOCK_FILE = os.path.join(APPLICATION_BASE_DIR, '.lims_fetch.lock')

# --- Logging ---
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

file_handler = logging.FileHandler(LOGS_DIR / 'lims_fetcher_debug.log', mode='w', encoding='utf-8')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

logging.basicConfig(
    level=logging.DEBUG,
    handlers=[console_handler, file_handler]
)
logger = logging.getLogger('fetch_lims_data')

# --- Login ---
def lims_login(session: requests.Session) -> bool:
    logger.info("Attempting LIMS login...")
    if not LIMS_USER or not LIMS_PASSWORD:
        logger.error("LIMS credentials missing in .env")
        return False
    try:
        login_page_url = f"{LIMS_URL}/index.php?m="
        r1 = session.get(login_page_url)
        logger.debug(f"GET {login_page_url} Status: {r1.status_code}")
        
        pattern = r'<input\s+name=["\']rdm["\']\s+type=["\']hidden["\']\s+value=["\']([^"\']+)["\']\s*/?>'
        match = re.search(pattern, r1.text, re.IGNORECASE)
        if not match:
            logger.error("rdm token not found on login page")
            return False
        rdm_token = match.group(1)
        logger.debug(f"Found rdm token: {rdm_token}")

        login_post_url = f"{LIMS_URL}/auth.php"
        payload = {
            "username": LIMS_USER,
            "password": LIMS_PASSWORD,
            "action": "auth",
            "rdm": rdm_token,
        }
        headers = {
            "Referer": login_page_url,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        r2 = session.post(login_post_url, data=payload, headers=headers, allow_redirects=True)
        
        final_url = r2.url
        if final_url.endswith("home.php"):
            logger.info("LIMS login successful.")
            return True
        else:
            logger.error("Login failed: Did not reach home.php after login")
            return False

    except Exception:
        logger.exception("Login sequence failed.")
        return False

# --- Get Start Date ---
def get_start_date() -> datetime.date:
    logger.info("Determining start date for data fetch...")
    
    # Check if we need a comprehensive run (once per day)
    need_comprehensive = should_run_comprehensive()
    
    # For normal runs, only go back 1 day to maximize speed
    if not need_comprehensive and os.path.exists(LAST_RUN_FILE):
        try:
            with open(LAST_RUN_FILE, 'r') as f:
                last_run_timestamp = f.read().strip()
            # Handle both ISO format and custom format
            try:
                last_run_date = datetime.fromisoformat(last_run_timestamp).date()
            except ValueError:
                # Fallback to your original format
                last_run_date = datetime.strptime(last_run_timestamp, '%Y-%m-%d %H:%M:%S.%f').date()
            
            # For normal runs, only fetch from the last run date (not older)
            logger.info(f"Incremental run: fetching from last run date {last_run_date}")
            return last_run_date
            
        except Exception as e:
            logger.warning(f"Failed reading {LAST_RUN_FILE}: {e}. Falling back to 1 day ago.")
    
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                records = json.load(f)
            if records:
                # Get the latest EncounterDate from existing records
                latest_date = None
                for record in records:
                    try:
                        record_date = datetime.fromisoformat(record['EncounterDate']).date()
                        if latest_date is None or record_date > latest_date:
                            latest_date = record_date
                    except (KeyError, ValueError):
                        continue
                
                if latest_date:
                    logger.info(f"Latest date in existing records: {latest_date}. Fetching new data from {latest_date}.")
                    return latest_date
        except Exception as e:
            logger.warning(f"Failed reading {DATA_FILE}: {e}. Falling back to default start date.")
    
    # Fallback
    default_start = datetime(2025, 4, 1).date()
    logger.info(f"Using fallback start date: {default_start}")
    return default_start

def should_run_comprehensive():
    """Check if we should run comprehensive search (once per day)"""
    if not os.path.exists(COMPREHENSIVE_RUN_FILE):
        return True
    
    try:
        with open(COMPREHENSIVE_RUN_FILE, 'r') as f:
            last_comprehensive = datetime.fromisoformat(f.read().strip()).date()
        today = datetime.now().date()
        return last_comprehensive < today
    except:
        return True

def save_comprehensive_run_timestamp():
    """Save timestamp of last comprehensive run"""
    try:
        with open(COMPREHENSIVE_RUN_FILE, 'w') as f:
            f.write(datetime.now().isoformat())
    except Exception as e:
        logger.error(f"Failed to save comprehensive run timestamp: {e}")

def acquire_lock():
    """Acquire a lock to prevent multiple instances from running simultaneously.
    Returns True if lock was acquired, False if another instance is running."""
    if os.path.exists(LOCK_FILE):
        try:
            # Check if lock file is stale (older than 2 hours - safety mechanism)
            lock_age = time.time() - os.path.getmtime(LOCK_FILE)
            if lock_age > 7200:  # 2 hours
                logger.warning(f"Found stale lock file ({lock_age/60:.1f} minutes old). Removing it.")
                os.remove(LOCK_FILE)
            else:
                logger.info("Another instance is already running. Exiting.")
                return False
        except Exception as e:
            logger.warning(f"Error checking lock file: {e}")
            
    try:
        with open(LOCK_FILE, 'w') as f:
            f.write(f"{os.getpid()}\n{datetime.now().isoformat()}")
        logger.debug("Lock acquired successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to acquire lock: {e}")
        return False

def release_lock():
    """Release the lock file."""
    try:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
            logger.debug("Lock released")
    except Exception as e:
        logger.error(f"Failed to release lock: {e}")

# --- Parse Patient Table ---
def parse_patient_table(html_content, search_method=""):
    """Parse the patient table from HTML content and return list of patient dicts with ONLY required fields."""
    patients = []
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        table = soup.find('table', id='list')

        if not table:
            logger.warning(f"No patient table found using {search_method} search.")
            return patients

        rows = table.find_all('tr')[1:]  # Skip header row
        logger.info(f"Found {len(rows)} patients using {search_method} search.")

        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 8:
                logger.warning(f"Skipping malformed patient row with {len(cells)} cells.")
                continue
            
            try:
                # Parse encounter date (from DD-MM-YYYY to YYYY-MM-DD)
                date_str = cells[0].text.strip()
                encounter_date = datetime.strptime(date_str, '%d-%m-%Y').date().isoformat()
            except ValueError:
                logger.warning(f"Skipping patient with bad date format: {cells[0].text.strip()}")
                continue
            
            # Extract ONLY the 5 required fields
            patient = {
                "EncounterDate": encounter_date,
                "LabNo": cells[1].text.strip(),
                "InvoiceNo": cells[3].text.strip(),
                "Src": cells[7].text.strip(),
                # TestName will be added later when fetching details
                "TestName": ""  # Placeholder, will be filled later
            }
            patients.append(patient)

    except Exception as e:
        logger.exception(f"Error parsing patient table from {search_method} search")
    
    return patients

# --- Search Methods ---
def search_by_date_range(session, start_date, end_date):
    """Search using date range method."""
    logger.info(f"Searching by date range: {start_date} to {end_date}")
    
    search_params = {
        'searchtype': 'daterange',
        'daterange': f"{start_date.strftime('%m/%d/%Y')} - {end_date.strftime('%m/%d/%Y')}",
        'Get': 'Get'
    }
    
    try:
        r = session.get(SEARCH_URL, params=search_params, timeout=300)
        r.raise_for_status()
        return parse_patient_table(r.text, "daterange")
    except Exception as e:
        logger.error(f"Date range search failed: {e}")
        return []

def search_by_specific_date(session, date):
    """Search using specific date method."""
    logger.info(f"Searching by specific date: {date}")
    
    search_params = {
        'searchtype': 'date',
        'datepicker': date.strftime('%Y-%m-%d'),
        'Get': 'Get'
    }
    
    try:
        r = session.get(SEARCH_URL, params=search_params, timeout=300)
        r.raise_for_status()
        return parse_patient_table(r.text, "date")
    except Exception as e:
        logger.error(f"Specific date search failed for {date}: {e}")
        return []

def search_by_period(session, period):
    """Search using period method (Last X Days)."""
    logger.info(f"Searching by period: {period}")
    
    search_params = {
        'searchtype': 'period',
        'criteria': period,
        'Get': 'Get'
    }
    
    try:
        r = session.get(SEARCH_URL, params=search_params, timeout=300)
        r.raise_for_status()
        return parse_patient_table(r.text, f"period_{period}")
    except Exception as e:
        logger.error(f"Period search failed for {period}: {e}")
        return []

# --- Optimized Data Fetch ---
def fetch_lims_data_optimized(session, start_date, is_comprehensive=False):
    """
    Fetch LIMS patient data with optimized strategy based on run type.
    """
    end_date = datetime.now().date()
    all_patients = {}  # Use LabNo as key to avoid duplicates
    
    logger.info(f"Starting {'COMPREHENSIVE' if is_comprehensive else 'OPTIMIZED'} data fetch from {start_date} to {end_date}")
    
    if is_comprehensive:
        # COMPREHENSIVE MODE - Use daily searches for entire range
        # The LIMS date range search has a limit (~6,000 results) so we MUST use daily searches
        days_to_fetch = (end_date - start_date).days + 1
        
        logger.info(f"=== COMPREHENSIVE MODE: Daily searches for all {days_to_fetch} days ===")
        logger.info(f"Searching from {start_date} to {end_date}")
        
        # Use daily searches for the ENTIRE date range
        # This is slower but ensures we get ALL records, avoiding LIMS search limits
        for single_date in date_range(start_date, end_date):
            patients = search_by_specific_date(session, single_date)
            logger.info(f"Date {single_date}: Found {len(patients)} patients (Total unique so far: {len(all_patients)})")
            for patient in patients:
                all_patients[patient['LabNo']] = patient
        
        # Add period search as final backup for very recent data
        logger.info("Adding period search as backup for recent data...")
        patients_period = search_by_period(session, 'Last 3 Days')
        logger.info(f"Period search found: {len(patients_period)} patients")
        for patient in patients_period:
            all_patients[patient['LabNo']] = patient
    
    else:
        # OPTIMIZED MODE (existing logic) - Fast incremental update
        logger.info("=== OPTIMIZED MODE: Fast incremental update ===")
        patients_daterange = search_by_date_range(session, start_date, end_date)
        for patient in patients_daterange:
            all_patients[patient['LabNo']] = patient
        
        # Always include today's data with specific date search for accuracy
        if end_date >= start_date:
            patients_today = search_by_specific_date(session, end_date)
            for patient in patients_today:
                all_patients[patient['LabNo']] = patient
    
    logger.info(f"Total unique patients found: {len(all_patients)}")
    
    # Fetch test details for all patients
    logger.info("Fetching test details for all patients...")
    final_records = []
    
    for idx, (lab_no, patient_data) in enumerate(all_patients.items(), 1):
        if idx % 20 == 0:
            logger.info(f"Processing details for patient {idx} of {len(all_patients)}...")
            
        test_details = fetch_patient_details(session, patient_data)
        
        for test in test_details:
            # Create a clean record with ONLY the 5 required fields
            record = {
                "EncounterDate": patient_data["EncounterDate"],
                "InvoiceNo": patient_data["InvoiceNo"],
                "LabNo": patient_data["LabNo"],
                "Src": patient_data["Src"],
                "TestName": test["TestName"]
            }
            final_records.append(record)

    logger.info(f"Fetched {len(final_records)} test records.")
    return final_records

def date_range(start_date, end_date):
    """Generator for date range"""
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + timedelta(n)

# --- Fetch Patient Details ---
def fetch_patient_details(session, patient):
    """Fetch and parse test details for a given patient. Returns list of test dicts with ONLY TestName."""
    url = f"{LIMS_URL}/hoverrequest_b.php?iid={patient['InvoiceNo']}&encounterno={patient['LabNo']}"
    details = []
    try:
        r = session.get(url, timeout=30)
        if r.status_code != 200:
            logger.warning(f"Failed to fetch details for patient {patient['LabNo']}: HTTP {r.status_code}")
            return details

        soup = BeautifulSoup(r.text, 'html.parser')
        table = soup.find('table', class_='table-bordered')
        if not table:
            return details

        rows = table.find_all('tr')
        if len(rows) <= 1:
            return details

        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) < 3:
                continue

            # Extract ONLY the TestName
            test_name = cells[2].text.strip()
            if test_name:  # Only add non-empty test names
                details.append({"TestName": test_name})

    except Exception as e:
        logger.error(f"Error fetching details for {patient['LabNo']}: {e}")

    return details

# --- Save Data ---
def save_data(new_records):
    """Saves new records by appending to data.json. Ensures only 5 required fields exist."""
    if not new_records:
        logger.info("No new records to save.")
        return

    existing_data = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                existing_data = json.load(f)
            logger.info(f"Loaded {len(existing_data)} existing records.")
            
            # Validate existing records have correct format
            for i, record in enumerate(existing_data):
                if not validate_record_format(record):
                    logger.warning(f"Record {i} has incorrect format, it will be filtered out")
        except (json.JSONDecodeError, FileNotFoundError):
            logger.warning("Existing data.json is empty or corrupted. Starting fresh.")

    # Filter existing data to ensure only valid records with 5 fields
    valid_existing_data = []
    for record in existing_data:
        if validate_record_format(record):
            valid_existing_data.append(record)
        else:
            # Create valid record from existing data if possible
            valid_record = create_valid_record(record)
            if valid_record:
                valid_existing_data.append(valid_record)
    
    # Convert records to a hashable format for comparison (using only the 5 fields)
    existing_set = {tuple(sorted([(k, v) for k, v in rec.items() if k in ["EncounterDate", "InvoiceNo", "LabNo", "Src", "TestName"]])) 
                    for rec in valid_existing_data}
    new_set = {tuple(sorted(rec.items())) for rec in new_records}

    # Find truly new records
    truly_new_records_set = new_set - existing_set
    truly_new_records = [dict(t) for t in truly_new_records_set]

    if truly_new_records:
        final_data = valid_existing_data + truly_new_records
        with open(DATA_FILE, 'w') as f:
            json.dump(final_data, f, indent=4)
        logger.info(f"Saved {len(truly_new_records)} new records. Total: {len(final_data)}")
        
        # Log sample of saved data
        if truly_new_records:
            logger.info(f"Sample new record: {json.dumps(truly_new_records[0], indent=2)}")
    else:
        logger.info("No new unique records found.")

def validate_record_format(record):
    """Validate that a record has exactly the 5 required fields."""
    required_fields = {"EncounterDate", "InvoiceNo", "LabNo", "Src", "TestName"}
    record_fields = set(record.keys())
    
    # Check if record has exactly the required fields (no more, no less)
    if record_fields == required_fields:
        # Also check that values are not empty
        for field in required_fields:
            if not record.get(field):
                return False
        return True
    return False

def create_valid_record(record):
    """Create a valid record from potentially malformed record."""
    try:
        valid_record = {}
        # Try to extract the 5 required fields
        for field in ["EncounterDate", "InvoiceNo", "LabNo", "Src", "TestName"]:
            if field in record and record[field]:
                valid_record[field] = record[field]
        
        # Check if we have all 5 fields
        if len(valid_record) == 5:
            return valid_record
    except Exception:
        pass
    return None

def save_last_run_timestamp(timestamp):
    """Saves the current timestamp to mark a successful run."""
    try:
        with open(LAST_RUN_FILE, 'w') as f:
            f.write(timestamp.isoformat())
        logger.info(f"Updated last run timestamp.")
    except Exception as e:
        logger.error(f"Failed to save last run timestamp: {e}")

def upload_to_r2(file_path, bucket):
    """Uploads log files to R2."""
    logger.info(f"Uploading {os.path.basename(file_path)} to R2...")
    if not all([R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, bucket, R2_CLIENT_FOLDER]):
        logger.error("R2 credentials incomplete. Skipping upload.")
        return
    try:
        s3 = boto3.client('s3',
                          endpoint_url=R2_ENDPOINT_URL,
                          aws_access_key_id=R2_ACCESS_KEY_ID,
                          aws_secret_access_key=R2_SECRET_ACCESS_KEY)

        object_key = f"{R2_CLIENT_FOLDER}/{os.path.basename(file_path)}"
        s3.upload_file(file_path, bucket, object_key)
        logger.info(f"Uploaded {os.path.basename(file_path)} to R2.")
    except Exception as e:
        logger.exception(f"Failed to upload to R2: {e}")

# --- Main ---
def run():
    """Main execution function with optimized strategy and lock mechanism."""
    
    # Check if another instance is already running
    if not acquire_lock():
        return  # Exit silently - another instance is running
    
    try:
        logger.info("Starting LIMS data fetch...")
        
        s = requests.Session()
        
        if not lims_login(s):
            logger.error("Failed to login to LIMS. Exiting.")
            return
        
        current_run_timestamp = datetime.now()
        
        # Determine if this is a comprehensive run AND first run scenario
        need_comprehensive = should_run_comprehensive()
        is_first_run = not os.path.exists(LAST_RUN_FILE) and not os.path.exists(DATA_FILE)
        
        # FIX: For first run, we WANT comprehensive mode to get all historical data
        # Only disable comprehensive if it's NOT needed AND it's a first run
        is_comprehensive = need_comprehensive or is_first_run
        
        # Estimate run time and log warning for comprehensive runs
        if is_comprehensive:
            start_date_for_fetch = get_start_date()
            days_to_fetch = (datetime.now().date() - start_date_for_fetch).days
            estimated_minutes = days_to_fetch * 0.1  # Rough estimate: 0.1 min per day
            logger.warning(f"COMPREHENSIVE RUN: Fetching {days_to_fetch} days of data.")
            logger.warning(f"Estimated time: {estimated_minutes:.1f} minutes. This is normal for daily comprehensive runs.")
        
        start_date_for_fetch = get_start_date()
        
        try:
            new_records = fetch_lims_data_optimized(s, start_date_for_fetch, is_comprehensive)
            
            if new_records:
                save_data(new_records)
            else:
                logger.info("No new records found.")
                
            # Mark comprehensive run as completed (only if it was actually a comprehensive run)
            if is_comprehensive:
                save_comprehensive_run_timestamp()
                logger.info("Comprehensive run completed.")
            elif is_first_run:
                logger.info("First run completed successfully.")
                
        except Exception as e:
            logger.exception("Unexpected error during data fetch")
        finally:
            save_last_run_timestamp(current_run_timestamp)
            # Upload logs only (no data.json)
            upload_to_r2(os.path.join(LOGS_DIR, 'lims_fetcher_debug.log'), R2_LOG_BUCKET_NAME)
            logger.info("LIMS fetch complete.")
            
    finally:
        # Always release the lock, even if there was an error
        release_lock()

if __name__ == '__main__':
    run()