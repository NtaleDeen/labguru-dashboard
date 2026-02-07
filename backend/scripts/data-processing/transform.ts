import { query } from '../../src/config/database';
import { calculateTAT } from '../../src/utils/dateUtils';
import moment from 'moment';
import fs from 'fs/promises';
import path from 'path';
import csv from 'csv-parse/sync';

interface TimeOutRecord {
  FileName: string;
  CreationTime: string;
}

const PUBLIC_DIR = process.env.PUBLIC_DIR || '../../frontend/public';

async function transformData() {
  console.log('🔄 Starting data transformation...');

  try {
    // Read TimeOut.csv
    const timeoutCsvPath = path.join(__dirname, PUBLIC_DIR, 'TimeOut.csv');
    const timeoutCsvContent = await fs.readFile(timeoutCsvPath, 'utf-8');
    
    const timeoutRecords: TimeOutRecord[] = csv.parse(timeoutCsvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📄 Found ${timeoutRecords.length} timeout records`);

    // Insert timeout records into database
    for (const record of timeoutRecords) {
      try {
        const creationTime = moment(record.CreationTime, 'MM/DD/YYYY hh:mm A').toDate();

        await query(
          `INSERT INTO timeout_records (file_name, creation_time)
           VALUES ($1, $2)
           ON CONFLICT (file_name) 
           DO UPDATE SET creation_time = EXCLUDED.creation_time`,
          [record.FileName, creationTime]
        );
      } catch (error) {
        console.error(`Error inserting timeout record:`, record, error);
      }
    }

    console.log('✅ Timeout records inserted');

    // Match timeout records with test records and calculate TAT
    const testRecordsResult = await query(
      `SELECT id, lab_no, time_in 
       FROM test_records 
       WHERE time_out IS NULL`
    );

    let matchedCount = 0;

    for (const testRecord of testRecordsResult.rows) {
      // Extract the base lab number (without time part)
      const labNoBase = testRecord.lab_no;

      // Find matching timeout record
      const timeoutResult = await query(
        'SELECT creation_time FROM timeout_records WHERE file_name = $1',
        [labNoBase]
      );

      if (timeoutResult.rows.length > 0) {
        const timeOut = timeoutResult.rows[0].creation_time;
        const timeIn = testRecord.time_in;

        const actualTAT = calculateTAT(new Date(timeIn), new Date(timeOut));

        await query(
          `UPDATE test_records 
           SET time_out = $1, actual_tat = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [timeOut, actualTAT, testRecord.id]
        );

        matchedCount++;
      }
    }

    console.log(`✅ Matched ${matchedCount} timeout records with test records`);

    console.log('✅ Data transformation completed');

  } catch (error) {
    console.error('❌ Data transformation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  transformData()
    .then(() => {
      console.log('✅ Transformation complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Transformation failed:', error);
      process.exit(1);
    });
}

export default transformData;