import db from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  const client = await db.pool.connect();

  try {
    // Create migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if migration has already been run
    const migrationName = '001_initial_schema';
    const checkResult = await client.query(
      'SELECT id FROM migration_history WHERE migration_name = $1',
      [migrationName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Migration ${migrationName} already applied, skipping`);
      return; // client released in finally
    }

    // Read and execute the migration
    const migrationPath = path.join(__dirname, '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSQL);

    // Record that we ran this migration
    await client.query(
      'INSERT INTO migration_history (migration_name) VALUES ($1)',
      [migrationName]
    );

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});