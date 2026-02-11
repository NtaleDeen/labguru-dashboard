import fs from 'fs/promises';
import path from 'path';
import { query, pool } from '../src/config/database';

const MIGRATION_NAME = '003_normalize_schema';

async function runMigration003() {
  console.log(`🔄 Running migration: ${MIGRATION_NAME}`);

  try {
    // Check if migration already ran
    const checkResult = await query(
      'SELECT * FROM migration_history WHERE migration_name = $1',
      [MIGRATION_NAME]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Migration ${MIGRATION_NAME} already applied, skipping...`);
      return;
    }

    // Read migration SQL file
    const migrationPath = path.join(__dirname, `${MIGRATION_NAME}.sql`);
    let migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // PRE-MIGRATION FIX: Check if encounters table needs lab_no column
    console.log('🔍 Checking encounters table structure...');
    
    const tableCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'encounters' AND column_name = 'lab_no'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('⚠️  encounters table missing lab_no column. Adding it first...');
      
      // Check what primary key column exists
      const pkCheck = await query(`
        SELECT column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'encounters' 
          AND tc.constraint_type = 'PRIMARY KEY'
      `);

      if (pkCheck.rows.length > 0) {
        const pkColumn = pkCheck.rows[0].column_name;
        console.log(`   Found primary key: ${pkColumn}`);
        
        // Add lab_no column and populate it
        await query(`
          ALTER TABLE encounters ADD COLUMN IF NOT EXISTS lab_no VARCHAR(50)
        `);
        
        // If the PK is encounter_no or id, copy it to lab_no
        if (pkColumn === 'encounter_no' || pkColumn === 'id') {
          await query(`
            UPDATE encounters 
            SET lab_no = ${pkColumn}::VARCHAR 
            WHERE lab_no IS NULL
          `);
        } else if (pkColumn === 'invoice_no') {
          // Generate lab_no from invoice_no
          await query(`
            UPDATE encounters 
            SET lab_no = 'LAB-' || invoice_no 
            WHERE lab_no IS NULL
          `);
        }
        
        console.log('   ✅ lab_no column added and populated');
      }
    } else {
      console.log('✅ encounters table already has lab_no column');
    }

    // Execute migration
    console.log('📝 Executing schema normalization...');
    await query(migrationSQL);

    // Record in migration history
    await query(
      'INSERT INTO migration_history (migration_name) VALUES ($1)',
      [MIGRATION_NAME]
    );

    console.log(`✅ Migration ${MIGRATION_NAME} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${MIGRATION_NAME} failed:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration003()
    .then(() => {
      console.log('✅ Migration 003 complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration 003 failed:', error);
      process.exit(1);
    });
}

export default runMigration003;