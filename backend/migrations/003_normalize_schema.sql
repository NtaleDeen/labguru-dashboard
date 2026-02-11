-- ============================================================================
-- Migration 003: Normalize Schema - Use Encounters Table
-- ============================================================================
-- Purpose: Eliminate data duplication by properly using the encounters table.
-- Current problem: test_records stores encounter data (lab_no, invoice_no,
-- encounter_date, source, time_in, shift, laboratory) for EVERY test, causing
-- massive duplication when one patient has multiple tests.
--
-- Solution: Store encounter data once in encounters table, reference via FK.
-- ============================================================================

-- ============================================================================
-- STEP 1: Enhance encounters table structure
-- ============================================================================

-- Update encounters to use lab_no as primary key (it's unique per visit)
-- Remove the auto-increment id, use lab_no directly
ALTER TABLE encounters DROP CONSTRAINT IF EXISTS encounters_pkey;
ALTER TABLE encounters DROP CONSTRAINT IF EXISTS encounters_encounter_no_key;

-- Add missing columns to encounters
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS time_in TIMESTAMP;
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS laboratory VARCHAR(50);

-- Use lab_no as the natural primary key
-- Note: encounter_no will be removed as it's redundant
ALTER TABLE encounters
  DROP COLUMN IF EXISTS encounter_no,
  DROP COLUMN IF EXISTS id;

-- Add lab_no as primary key
ALTER TABLE encounters ADD PRIMARY KEY (lab_no);

-- Recreate indexes
DROP INDEX IF EXISTS idx_encounters_encounter_no;
DROP INDEX IF EXISTS idx_encounters_patient_id;
DROP INDEX IF EXISTS idx_encounters_encounter_date;
DROP INDEX IF EXISTS idx_encounters_invoice_no;

CREATE INDEX IF NOT EXISTS idx_encounters_invoice_no ON encounters(invoice_no);
CREATE INDEX IF NOT EXISTS idx_encounters_encounter_date ON encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_source ON encounters(source);

-- ============================================================================
-- STEP 2: Migrate existing data from test_records to encounters
-- ============================================================================

-- Insert unique encounters from test_records (if any exist)
INSERT INTO encounters (lab_no, invoice_no, encounter_date, source, time_in, shift, laboratory, patient_id)
SELECT DISTINCT
  lab_no,
  invoice_no,
  encounter_date,
  source,
  time_in,
  shift,
  laboratory,
  patient_id
FROM test_records
WHERE lab_no IS NOT NULL
ON CONFLICT (lab_no) DO UPDATE SET
  invoice_no = EXCLUDED.invoice_no,
  encounter_date = EXCLUDED.encounter_date,
  source = EXCLUDED.source,
  time_in = EXCLUDED.time_in,
  shift = EXCLUDED.shift,
  laboratory = EXCLUDED.laboratory,
  patient_id = COALESCE(encounters.patient_id, EXCLUDED.patient_id);

-- ============================================================================
-- STEP 3: Add encounter_id FK to test_records
-- ============================================================================

-- Add the FK column (nullable initially for migration)
ALTER TABLE test_records
  ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(50);

-- Populate encounter_id from existing lab_no
UPDATE test_records
SET encounter_id = lab_no
WHERE encounter_id IS NULL AND lab_no IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE test_records
  ADD CONSTRAINT fk_test_records_encounter
  FOREIGN KEY (encounter_id) REFERENCES encounters(lab_no) ON DELETE CASCADE;

-- Create index on FK
CREATE INDEX IF NOT EXISTS idx_test_records_encounter_id ON test_records(encounter_id);

-- ============================================================================
-- STEP 4: Remove duplicated columns from test_records
-- ============================================================================

-- These columns now live in encounters table only
-- Keep them temporarily for data verification, will drop later if needed
-- ALTER TABLE test_records DROP COLUMN IF EXISTS encounter_date;
-- ALTER TABLE test_records DROP COLUMN IF EXISTS invoice_no;
-- ALTER TABLE test_records DROP COLUMN IF EXISTS lab_no;
-- ALTER TABLE test_records DROP COLUMN IF EXISTS source;
-- ALTER TABLE test_records DROP COLUMN IF EXISTS time_in;
-- ALTER TABLE test_records DROP COLUMN IF EXISTS shift;
-- ALTER TABLE test_records DROP COLUMN IF EXISTS laboratory;

-- For now, mark these as deprecated by adding a comment
COMMENT ON COLUMN test_records.encounter_date IS 'DEPRECATED: Use encounters.encounter_date via encounter_id FK';
COMMENT ON COLUMN test_records.invoice_no IS 'DEPRECATED: Use encounters.invoice_no via encounter_id FK';
COMMENT ON COLUMN test_records.lab_no IS 'DEPRECATED: Use encounters.lab_no (same as encounter_id)';
COMMENT ON COLUMN test_records.source IS 'DEPRECATED: Use encounters.source via encounter_id FK';
COMMENT ON COLUMN test_records.time_in IS 'DEPRECATED: Use encounters.time_in via encounter_id FK';
COMMENT ON COLUMN test_records.shift IS 'DEPRECATED: Use encounters.shift via encounter_id FK';
COMMENT ON COLUMN test_records.laboratory IS 'DEPRECATED: Use encounters.laboratory via encounter_id FK';

-- ============================================================================
-- STEP 5: Update UNIQUE constraint
-- ============================================================================

-- Drop old unique constraint
ALTER TABLE test_records DROP CONSTRAINT IF EXISTS test_records_invoice_no_test_name_key;

-- Add new unique constraint using encounter_id
ALTER TABLE test_records
  ADD CONSTRAINT test_records_encounter_id_test_name_key
  UNIQUE (encounter_id, test_name);

-- ============================================================================
-- STEP 6: Create useful views for backward compatibility
-- ============================================================================

-- Create a view that joins test_records with encounters for easy querying
CREATE OR REPLACE VIEW test_records_full AS
SELECT
  tr.id,
  tr.encounter_id,
  e.invoice_no,
  e.encounter_date,
  e.source,
  e.time_in,
  e.shift,
  e.laboratory,
  e.patient_id,
  tr.test_name,
  tr.test_metadata_id,
  tr.price_at_test,
  tr.tat_at_test,
  tr.lab_section_at_test,
  tr.is_urgent,
  tr.is_received,
  tr.is_resulted,
  tr.is_cancelled,
  tr.cancellation_reason,
  tr.cancelled_at,
  tr.cancelled_by,
  tr.time_out,
  tr.actual_tat,
  tr.created_at,
  tr.updated_at
FROM test_records tr
JOIN encounters e ON tr.encounter_id = e.lab_no;

-- Grant permissions
GRANT SELECT ON test_records_full TO PUBLIC;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that encounters were created properly
DO $$
DECLARE
  encounter_count INTEGER;
  test_count INTEGER;
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO encounter_count FROM encounters;
  SELECT COUNT(*) INTO test_count FROM test_records;
  SELECT COUNT(*) INTO orphan_count FROM test_records WHERE encounter_id IS NULL;

  RAISE NOTICE '✅ Migration 003 completed';
  RAISE NOTICE '   Encounters: %', encounter_count;
  RAISE NOTICE '   Test records: %', test_count;
  RAISE NOTICE '   Orphaned test records: %', orphan_count;

  IF orphan_count > 0 THEN
    RAISE WARNING '⚠️  Found % test records without encounter_id - these need investigation', orphan_count;
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration:
-- 1. DROP VIEW test_records_full;
-- 2. ALTER TABLE test_records DROP CONSTRAINT fk_test_records_encounter;
-- 3. ALTER TABLE test_records DROP COLUMN encounter_id;
-- 4. Restore encounters table to original structure
