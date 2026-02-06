import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const runMigrations = async () => {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migrations...\n');

    await client.query('BEGIN');

    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'technician', 'viewer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP
      );
    `);

    // Create tests table (meta table)
    console.log('Creating tests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id TEXT PRIMARY KEY,
        test_name TEXT NOT NULL,
        lab_section TEXT NOT NULL,
        tat NUMERIC NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create test_records table (for revenue tracking - WITHOUT LabNo and InvoiceNo)
    console.log('Creating test_records table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_records (
        id SERIAL PRIMARY KEY,
        encounter_date DATE NOT NULL,
        test_name TEXT NOT NULL,
        lab_section TEXT NOT NULL,
        price NUMERIC NOT NULL,
        tat NUMERIC NOT NULL,
        source TEXT,
        time_received TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_records_date 
      ON test_records(encounter_date);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_records_section 
      ON test_records(lab_section);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_records_test_name 
      ON test_records(test_name);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username 
      ON users(username);
    `);

    await client.query('COMMIT');

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✨ Database is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });