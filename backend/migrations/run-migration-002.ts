import db from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function runMigration002() {
  console.log('🔄 Running Migration 002: Add Targets and Patients Tables...');

  const client = await db.pool.connect();

  try {
    // Check if migration has already been run
    const migrationName = '002_add_targets_and_patients';
    const checkResult = await client.query(
      'SELECT id FROM migration_history WHERE migration_name = $1',
      [migrationName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Migration ${migrationName} already applied, skipping`);
      return; // client released in finally
    }

    // Read and execute the migration
    const migrationPath = path.join(__dirname, '002_add_targets_and_patients.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    await client.query('BEGIN');
    await client.query(migrationSQL);

    // Record that we ran this migration
    await client.query(
      'INSERT INTO migration_history (migration_name) VALUES ($1)',
      [migrationName]
    );

    await client.query('COMMIT');

    console.log('✅ Migration 002 completed successfully');

    // Verification
    const testsTargets = await client.query('SELECT COUNT(*) FROM monthly_tests_targets');
    const numbersTargets = await client.query('SELECT COUNT(*) FROM monthly_numbers_targets');

    console.log(`📊 Verification:`);
    console.log(`   - Tests Targets: ${testsTargets.rows[0].count} records`);
    console.log(`   - Numbers Targets: ${numbersTargets.rows[0].count} records`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 002 failed:', error);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

runMigration002().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});