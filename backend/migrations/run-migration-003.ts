import fs from 'fs/promises';
import path from 'path';
import db from '../src/config/database';

const MIGRATION_NAME = '003_normalize_schema';

async function runMigration003() {
  console.log(`🔄 Running migration: ${MIGRATION_NAME}`);

  try {
    // Check if migration already ran
    const checkResult = await db.query(
      'SELECT * FROM migration_history WHERE migration_name = $1',
      [MIGRATION_NAME]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Migration ${MIGRATION_NAME} already applied, skipping...`);
      return;
    }

    // Read migration SQL file
    const migrationPath = path.join(__dirname, `${MIGRATION_NAME}.sql`);
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Execute migration
    console.log('📝 Executing schema normalization...');
    await db.query(migrationSQL);

    // Record in migration history
    await db.query(
      'INSERT INTO migration_history (migration_name) VALUES ($1)',
      [MIGRATION_NAME]
    );

    console.log(`✅ Migration ${MIGRATION_NAME} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${MIGRATION_NAME} failed:`, error);
    throw error;
  } finally {
    await db.pool.end();
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