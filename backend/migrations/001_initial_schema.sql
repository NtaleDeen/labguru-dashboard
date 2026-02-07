-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  year INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  UNIQUE(key, month, year)
);

-- Test metadata table
CREATE TABLE IF NOT EXISTS test_metadata (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(255) UNIQUE NOT NULL,
  current_price DECIMAL(10,2),
  current_tat INTEGER, -- in minutes
  current_lab_section VARCHAR(100),
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test metadata history table
CREATE TABLE IF NOT EXISTS test_metadata_history (
  id SERIAL PRIMARY KEY,
  test_metadata_id INTEGER REFERENCES test_metadata(id) ON DELETE CASCADE,
  price DECIMAL(10,2),
  tat INTEGER,
  lab_section VARCHAR(100),
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  changed_by INTEGER REFERENCES users(id),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test name changes tracking
CREATE TABLE IF NOT EXISTS test_name_changes (
  id SERIAL PRIMARY KEY,
  old_name VARCHAR(255) NOT NULL,
  new_name VARCHAR(255) NOT NULL,
  test_metadata_id INTEGER REFERENCES test_metadata(id) ON DELETE CASCADE,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER REFERENCES users(id)
);

-- Test records table
CREATE TABLE IF NOT EXISTS test_records (
  id SERIAL PRIMARY KEY,
  encounter_date DATE NOT NULL,
  invoice_no VARCHAR(50) NOT NULL,
  lab_no VARCHAR(50) NOT NULL,
  source VARCHAR(100),
  test_name VARCHAR(255) NOT NULL,
  test_metadata_id INTEGER REFERENCES test_metadata(id),
  
  -- Snapshot values at time of test
  price_at_test DECIMAL(10,2),
  tat_at_test INTEGER,
  lab_section_at_test VARCHAR(100),
  
  -- Status tracking
  is_urgent BOOLEAN DEFAULT false,
  is_received BOOLEAN DEFAULT false,
  is_resulted BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by INTEGER REFERENCES users(id),
  
  -- Calculated fields
  time_in TIMESTAMP,
  time_out TIMESTAMP,
  actual_tat INTEGER, -- in minutes
  
  shift VARCHAR(20),
  laboratory VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(invoice_no, test_name)
);

-- TimeOut records
CREATE TABLE IF NOT EXISTS timeout_records (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(100) UNIQUE NOT NULL,
  creation_time TIMESTAMP NOT NULL,
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unmatched tests log
CREATE TABLE IF NOT EXISTS unmatched_tests (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  source VARCHAR(50),
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  occurrence_count INTEGER DEFAULT 1,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  UNIQUE(test_name, source)
);

-- Test cancellations tracking
CREATE TABLE IF NOT EXISTS test_cancellations (
  id SERIAL PRIMARY KEY,
  test_record_id INTEGER REFERENCES test_records(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  refund_amount DECIMAL(10,2),
  cancelled_by INTEGER REFERENCES users(id),
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_test_records_encounter_date ON test_records(encounter_date);
CREATE INDEX idx_test_records_lab_no ON test_records(lab_no);
CREATE INDEX idx_test_records_invoice_no ON test_records(invoice_no);
CREATE INDEX idx_test_records_test_name ON test_records(test_name);
CREATE INDEX idx_test_records_lab_section ON test_records(lab_section_at_test);
CREATE INDEX idx_test_metadata_test_name ON test_metadata(test_name);
CREATE INDEX idx_timeout_records_file_name ON timeout_records(file_name);
CREATE INDEX idx_unmatched_tests_resolved ON unmatched_tests(is_resolved);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@zyntel.com', '$2a$10$XQnLVxPNmWlmKzV7k8YwO.AZJZfhqQXKZJVqCvQzQqGqjX7X8Rl0m', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default monthly target (1.5 Billion UGX)
INSERT INTO settings (key, value, month, year) 
VALUES ('monthly_revenue_target', '1500000000', EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
ON CONFLICT (key, month, year) DO NOTHING;