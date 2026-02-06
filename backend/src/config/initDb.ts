import pool from './database';
import bcrypt from 'bcryptjs';

export const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'viewer')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create test_metadata table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_metadata (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) UNIQUE NOT NULL,
        tat INTEGER NOT NULL,
        section VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create unmatched_tests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unmatched_tests (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) UNIQUE NOT NULL,
        count INTEGER DEFAULT 1,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reception table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reception (
        id SERIAL PRIMARY KEY,
        lab_number VARCHAR(50) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        shift VARCHAR(20),
        unit VARCHAR(100),
        lab_section VARCHAR(100),
        time_received TIMESTAMP,
        test_time_out TIMESTAMP,
        urgency VARCHAR(20) DEFAULT 'normal',
        cancelled BOOLEAN DEFAULT false,
        cancel_reason TEXT,
        UNIQUE(lab_number, test_name)
      )
    `);

    // Create revenue view (will be populated from processed data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revenue_data (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        lab_number VARCHAR(50) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        section VARCHAR(100),
        shift VARCHAR(20),
        unit VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reception_lab_number ON reception(lab_number);
      CREATE INDEX IF NOT EXISTS idx_reception_date ON reception(date);
      CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_data(date);
      CREATE INDEX IF NOT EXISTS idx_revenue_section ON revenue_data(section);
    `);

    // Create default admin user
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [defaultUsername]
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [defaultUsername, hashedPassword, 'admin']
      );
      console.log(`✅ Default admin user created: ${defaultUsername}`);
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};