import db from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  try {
    const client = await db.pool.connect();

    // Read the migration file
    const migrationPath = path.join(__dirname, '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Migrations completed successfully');

    client.release();
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();