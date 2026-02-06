import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();

interface LabGuruRecord {
  EncounterDate: string;
  InvoiceNo: string;
  LabNo: string;
  Src: string;
  TestName: string;
}

const LIMS_URL = process.env.LIMS_URL || 'http://192.168.10.84:8080';
const LIMS_USERNAME = process.env.LIMS_USERNAME;
const LIMS_PASSWORD = process.env.LIMS_PASSWORD;
const DATA_JSON_PATH = process.env.DATA_JSON_PATH || './public/data.json';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class LabGuruScraper {
  private session: any;

  constructor() {
    this.session = axios.create({
      withCredentials: true,
      timeout: 30000,
    });
  }

  async login(): Promise<boolean> {
    try {
      console.log('🔐 Logging into LabGuru...');
      
      // Get login page to extract rdm token
      const loginPage = await this.session.get(`${LIMS_URL}/index.php?m=`);
      const $ = cheerio.load(loginPage.data);
      
      const rdmToken = $('input[name="rdm"]').val();
      
      if (!rdmToken) {
        console.error('❌ Failed to extract rdm token');
        return false;
      }

      // Submit login
      const loginResponse = await this.session.post(
        `${LIMS_URL}/auth.php`,
        new URLSearchParams({
          username: LIMS_USERNAME!,
          password: LIMS_PASSWORD!,
          action: 'auth',
          rdm: rdmToken as string,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${LIMS_URL}/index.php?m=`,
          },
          maxRedirects: 5,
        }
      );

      if (loginResponse.request.path.includes('home.php')) {
        console.log('✅ Login successful');
        return true;
      }

      console.error('❌ Login failed');
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  }

  async scrapeData(startDate: string, endDate: string): Promise<LabGuruRecord[]> {
    try {
      console.log(`📡 Scraping data from ${startDate} to ${endDate}...`);
      
      // TODO: Implement your specific LabGuru scraping logic here
      // This is a template - you need to adapt based on your LabGuru structure
      
      const records: LabGuruRecord[] = [];
      
      // Example structure - replace with your actual scraping logic
      // const searchUrl = `${LIMS_URL}/search.php`;
      // const response = await this.session.post(searchUrl, {
      //   start_date: startDate,
      //   end_date: endDate,
      // });
      
      // const $ = cheerio.load(response.data);
      // Parse the HTML and extract records...
      
      console.log('⚠️  Scraping logic needs to be implemented based on your LabGuru structure');
      console.log('⚠️  This is a template file - add your specific scraping code here');
      
      return records;
    } catch (error) {
      console.error('❌ Scraping error:', error);
      return [];
    }
  }

  async processAndStore(records: LabGuruRecord[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get all tests for price/section/TAT lookup
      const testsResult = await client.query('SELECT * FROM tests');
      const testMap = new Map(testsResult.rows.map(t => [t.test_name.toLowerCase(), t]));

      let processed = 0;
      let skipped = 0;

      for (const record of records) {
        const testInfo = testMap.get(record.TestName.toLowerCase());

        if (!testInfo) {
          console.warn(`⚠️  Test not found in meta table: ${record.TestName}`);
          skipped++;
          continue;
        }

        // NOTE: We are NOT storing LabNo or InvoiceNo as per requirements
        // Only storing aggregated data needed for revenue calculations
        await client.query(`
          INSERT INTO test_records (
            encounter_date, test_name, lab_section, price, tat, source, time_received
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          record.EncounterDate,
          testInfo.test_name,
          testInfo.lab_section,
          testInfo.price,
          testInfo.tat,
          record.Src,
          new Date(),
        ]);

        processed++;
      }

      await client.query('COMMIT');

      console.log(`✅ Processed ${processed} records, skipped ${skipped}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Processing error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

async function runScraper() {
  console.log('\n=================================');
  console.log('🕷️  LabGuru Scraper (MVP Version)');
  console.log('=================================\n');

  if (!LIMS_USERNAME || !LIMS_PASSWORD) {
    console.error('❌ LabGuru credentials not configured in .env');
    console.error('   Please set LIMS_USERNAME and LIMS_PASSWORD');
    process.exit(1);
  }

  const scraper = new LabGuruScraper();

  try {
    const loggedIn = await scraper.login();
    
    if (!loggedIn) {
      throw new Error('Failed to login to LabGuru');
    }

    // For MVP, scrape last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const records = await scraper.scrapeData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (records.length > 0) {
      // Save to JSON for reference (optional)
      const dataDir = path.dirname(DATA_JSON_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(records, null, 2));
      console.log(`📁 Saved ${records.length} records to ${DATA_JSON_PATH}`);

      // Process and store in database
      await scraper.processAndStore(records);
    } else {
      console.log('ℹ️  No new records found');
    }

    console.log('\n✅ Scraper completed successfully\n');
  } catch (error) {
    console.error('\n❌ Scraper failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runScraper();
}

export { runScraper, LabGuruScraper };