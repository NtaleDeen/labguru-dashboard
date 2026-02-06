import pool from '../../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'technician', 'viewer')) NOT NULL,
        client_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create lab_sections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lab_sections (
        id SERIAL PRIMARY KEY,
        section_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create test_metadata table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_metadata (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) UNIQUE NOT NULL,
        tat INTEGER NOT NULL, -- minutes
        lab_section VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lab_section) REFERENCES lab_sections(section_name) ON UPDATE CASCADE
      );
    `);

    // Create monthly_targets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_targets (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER CHECK (month BETWEEN 1 AND 12) NOT NULL,
        target_amount DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(year, month)
      );
    `);

    // Create revenue_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_data (
        id SERIAL PRIMARY KEY,
        lab_number VARCHAR(50) NOT NULL,
        invoice_no VARCHAR(50),
        test_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        lab_section VARCHAR(100) NOT NULL,
        shift VARCHAR(50),
        hospital_unit VARCHAR(100),
        client_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_lab_section (lab_section),
        FOREIGN KEY (test_name) REFERENCES test_metadata(test_name) ON UPDATE CASCADE
      );
    `);

    // Create unmatched_tests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS unmatched_tests (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) UNIQUE NOT NULL,
        occurrences INTEGER DEFAULT 1,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) CHECK (status IN ('pending', 'added', 'ignored')) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create cancelled_tests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cancelled_tests (
        id SERIAL PRIMARY KEY,
        lab_number VARCHAR(50) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        reason TEXT,
        cancelled_by INTEGER,
        cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        refund_amount DECIMAL(10, 2),
        FOREIGN KEY (cancelled_by) REFERENCES users(id)
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Import initial meta data from CSV
async function importMetaData() {
  const csvPath = path.join(__dirname, '../../../frontend/public/meta.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  No meta.csv found, skipping import');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const testNameIndex = headers.indexOf('TestName');
  const tatIndex = headers.indexOf('TAT');
  const labSectionIndex = headers.indexOf('LabSection');
  const priceIndex = headers.indexOf('Price');

  if (testNameIndex === -1 || tatIndex === -1 || labSectionIndex === -1 || priceIndex === -1) {
    console.error('❌ Invalid CSV format');
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM test_metadata');
    
    // Insert lab sections
    const labSections = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      labSections.add(values[labSectionIndex]);
    }

    for (const section of labSections) {
      await client.query(
        'INSERT INTO lab_sections (section_name) VALUES ($1) ON CONFLICT (section_name) DO NOTHING',
        [section]
      );
    }

    // Insert test metadata
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      await client.query(
        `INSERT INTO test_metadata (test_name, tat, lab_section, price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (test_name) DO UPDATE 
         SET tat = EXCLUDED.tat, lab_section = EXCLUDED.lab_section, price = EXCLUDED.price`,
        [
          values[testNameIndex],
          parseInt(values[tatIndex]),
          values[labSectionIndex],
          parseFloat(values[priceIndex])
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Imported ${lines.length - 1} test records from meta.csv`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to import meta data:', error);
  } finally {
    client.release();
  }
}

// Create initial admin user
async function createAdminUser() {
  const bcrypt = require('bcryptjs');
  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
    
    await client.query(
      `INSERT INTO users (username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [process.env.ADMIN_USERNAME || 'admin', passwordHash, 'admin', true]
    );

    console.log('✅ Admin user created/updated');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  } finally {
    client.release();
  }
}

// Run all migrations
async function main() {
  try {
    await runMigrations();
    await importMetaData();
    await createAdminUser();
    console.log('🎉 All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

main();