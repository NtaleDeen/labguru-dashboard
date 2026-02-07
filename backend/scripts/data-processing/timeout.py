import os
import csv
import datetime
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

load_dotenv()

SOURCE_FOLDER = Path(os.getenv("SOURCE_FOLDER", "Z:/"))
PUBLIC_DIR = Path(os.getenv("PUBLIC_DIR", "../frontend/public"))
OUTPUT_TIMEOUT_CSV_PATH = PUBLIC_DIR / "TimeOut.csv"
DATABASE_URL = os.getenv("DATABASE_URL")

def format_creation_time(time_string):
    """Parse various date formats and return standardized string."""
    date_formats = [
        '%m/%d/%Y %H:%M:%S',
        '%m/%d/%Y %I:%M %p',
        '%#m/%#d/%Y %I:%M %p',
        '%#m/%#d/%Y %H:%M',
        '%Y-%m-%d %H:%M:%S',
    ]
    
    for fmt in date_formats:
        try:
            dt_object = datetime.datetime.strptime(time_string, fmt)
            return dt_object.strftime('%m/%d/%Y %I:%M %p')
        except ValueError:
            continue
    return None

def save_to_database(records):
    """Save timeout records to PostgreSQL."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        execute_values(
            cur,
            """
            INSERT INTO timeout_records (file_name, creation_time)
            VALUES %s
            ON CONFLICT (file_name) 
            DO UPDATE SET creation_time = EXCLUDED.creation_time
            """,
            [(r['FileName'], r['CreationTime']) for r in records]
        )
        
        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ Saved {len(records)} records to database")
    except Exception as e:
        print(f"❌ Database error: {e}")

def export_to_csv(records):
    """Export records to CSV file."""
    try:
        OUTPUT_TIMEOUT_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_TIMEOUT_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['FileName', 'CreationTime'])
            writer.writeheader()
            writer.writerows(records)
        print(f"✅ Exported to {OUTPUT_TIMEOUT_CSV_PATH}")
    except Exception as e:
        print(f"❌ CSV export error: {e}")

def run_timeout_update():
    """Main function to scan Z: drive and update records."""
    print("=" * 70)
    print("Starting Z: Drive Scan...")
    print("=" * 70)

    all_records = []

    if SOURCE_FOLDER.is_dir():
        for root, dirs, files in os.walk(SOURCE_FOLDER):
            for file_name in files:
                base_name = os.path.splitext(os.path.basename(file_name))[0]
                file_path = Path(root) / file_name

                try:
                    creation_time_timestamp = os.path.getctime(file_path)
                    creation_time = datetime.datetime.fromtimestamp(creation_time_timestamp)
                    formatted_time = creation_time.strftime('%m/%d/%Y %I:%M %p')
                    
                    all_records.append({
                        'FileName': base_name,
                        'CreationTime': formatted_time
                    })
                except Exception as e:
                    print(f"⚠️ Could not process {file_path}: {e}")

        print(f"📊 Found {len(all_records)} files")

        # Save to database
        if all_records:
            save_to_database(all_records)
            export_to_csv(all_records)
    else:
        print(f"❌ Source folder '{SOURCE_FOLDER}' does not exist")

    print("=" * 70)
    print("Scan complete")
    print("=" * 70)

if __name__ == "__main__":
    run_timeout_update()