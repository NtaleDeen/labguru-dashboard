-- ============================================================================
-- Migration 002: Add Targets Tables and Patients Table
-- ============================================================================

-- ============================================================================
-- 1. PATIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(50) UNIQUE,  -- External patient ID from LabGuru
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add patient reference to test_records
ALTER TABLE test_records 
ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_test_records_patient_id ON test_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);

-- ============================================================================
-- 2. MONTHLY TESTS TARGETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_tests_targets (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  target_count INTEGER NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

-- Insert default targets for current year
INSERT INTO monthly_tests_targets (month, year, target_count)
SELECT 
  generate_series AS month,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS year,
  10000 AS target_count
FROM generate_series(1, 12)
ON CONFLICT (month, year) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_monthly_tests_targets_month_year ON monthly_tests_targets(month, year);

-- ============================================================================
-- 3. MONTHLY NUMBERS (REQUESTS) TARGETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_numbers_targets (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  target_count INTEGER NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

-- Insert default targets for current year
INSERT INTO monthly_numbers_targets (month, year, target_count)
SELECT 
  generate_series AS month,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS year,
  15000 AS target_count
FROM generate_series(1, 12)
ON CONFLICT (month, year) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_monthly_numbers_targets_month_year ON monthly_numbers_targets(month, year);

-- ============================================================================
-- 4. UPDATE SETTINGS TABLE STRUCTURE
-- ============================================================================
-- Ensure settings table can handle multiple target types
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS setting_type VARCHAR(50) DEFAULT 'revenue_target';

UPDATE settings 
SET setting_type = 'revenue_target' 
WHERE key = 'monthly_revenue_target' AND setting_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_settings_type ON settings(setting_type);

-- ============================================================================
-- 5. ADD ENCOUNTER TABLE (for better data normalization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS encounters (
  id SERIAL PRIMARY KEY,
  encounter_no VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER REFERENCES patients(id),
  encounter_date DATE NOT NULL,
  invoice_no VARCHAR(50),
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encounters_encounter_no ON encounters(encounter_no);
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_encounter_date ON encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_encounters_invoice_no ON encounters(invoice_no);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify migration success:
-- SELECT COUNT(*) FROM monthly_tests_targets;
-- SELECT COUNT(*) FROM monthly_numbers_targets;
-- SELECT * FROM patients LIMIT 1;
-- SELECT * FROM encounters LIMIT 1;