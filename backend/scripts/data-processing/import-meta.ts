import fs from 'fs/promises';
import path from 'path';
import { query } from '../../src/config/database';
import csv from 'csv-parse/sync';

const PUBLIC_DIR = process.env.PUBLIC_DIR || '../../../frontend/public';

async function importMetaCSV() {
  console.log('📥 Importing meta.csv - Updating existing tests only...');

  try {
    // Read meta.csv
    const metaCsvPath = path.join(__dirname, PUBLIC_DIR, 'meta.csv');
    console.log(`📂 Reading meta.csv from: ${metaCsvPath}`);
    
    const metaCsvContent = await fs.readFile(metaCsvPath, 'utf-8');
    
    const metaRecords = csv.parse(metaCsvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📊 Found ${metaRecords.length} tests in meta.csv`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each test from meta.csv
    for (const record of metaRecords) {
      try {
        const testName = record.TestName?.trim();
        const tat = parseInt(record.TAT) || 1440;
        const labSection = record.LabSection?.trim() || 'PENDING';
        const price = parseFloat(record.Price) || 0;

        if (!testName) {
          console.warn('⚠️  Skipping record with empty TestName');
          errorCount++;
          continue;
        }

        // Check if test exists in database
        const existingResult = await query(
          'SELECT id, is_default, current_price, current_tat, current_lab_section FROM test_metadata WHERE test_name = $1',
          [testName]
        );

        if (existingResult.rows.length > 0) {
          // Test exists - UPDATE it
          const existing = existingResult.rows[0];
          
          await query(
            `UPDATE test_metadata 
             SET current_price = $1, 
                 current_tat = $2, 
                 current_lab_section = $3,
                 is_default = false,
                 updated_at = CURRENT_TIMESTAMP
             WHERE test_name = $4`,
            [price, tat, labSection, testName]
          );
          
          updatedCount++;
          
          if (updatedCount % 50 === 0) {
            console.log(`⏳ Updated ${updatedCount} tests...`);
          }
          
          // Show what changed
          if (existing.current_price !== price || 
              existing.current_tat !== tat || 
              existing.current_lab_section !== labSection) {
            console.log(`✏️  Updated: ${testName}`);
            console.log(`   Price: ${existing.current_price} → ${price}`);
            console.log(`   TAT: ${existing.current_tat} → ${tat}`);
            console.log(`   Section: ${existing.current_lab_section} → ${labSection}`);
          }
        } else {
          // Test does NOT exist in database - SKIP it
          skippedCount++;
          
          if (skippedCount <= 10) {
            console.log(`⏭️  Skipped (not in database): ${testName}`);
          } else if (skippedCount === 11) {
            console.log(`⏭️  ... (suppressing further skip messages)`);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing test: ${record.TestName}`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Meta.csv import completed:
      - ✅ Updated: ${updatedCount} existing tests
      - ⏭️  Skipped: ${skippedCount} tests (not in database)
      - ❌ Errors: ${errorCount}
    `);

    if (updatedCount === 0) {
      console.log(`\n⚠️  WARNING: No tests were updated!`);
      console.log(`   This means either:`);
      console.log(`   1. meta.csv test names don't match database test names exactly`);
      console.log(`   2. You haven't run 'npm run ingest' yet to create test records`);
      console.log(`\n💡 TIP: Run 'npm run ingest' first, then run 'npm run import-meta'`);
    }

  } catch (error: any) {
    console.error('❌ Meta.csv import failed:', error.message);
    
    if (error.code === 'ENOENT') {
      console.error(`\n📁 File not found: meta.csv`);
      console.error(`   Expected location: frontend/public/meta.csv`);
      console.error(`   Please ensure the file exists before running this script.`);
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importMetaCSV()
    .then(() => {
      console.log('\n✅ Import complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export default importMetaCSV;