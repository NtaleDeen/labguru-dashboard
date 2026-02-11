import { query, pool } from '../src/config/database';

async function verifyData() {
  console.log('🔍 Verifying database schema and data integrity...\n');

  try {
    // Check table counts
    console.log('📊 Table Counts:');

    const encountersCount = await query('SELECT COUNT(*) as count FROM encounters');
    console.log(`   Encounters: ${encountersCount.rows[0].count}`);

    const testRecordsCount = await query('SELECT COUNT(*) as count FROM test_records');
    console.log(`   Test Records: ${testRecordsCount.rows[0].count}`);

    const testMetadataCount = await query('SELECT COUNT(*) as count FROM test_metadata');
    console.log(`   Test Metadata: ${testMetadataCount.rows[0].count}`);

    const timeoutRecordsCount = await query('SELECT COUNT(*) as count FROM timeout_records');
    console.log(`   Timeout Records: ${timeoutRecordsCount.rows[0].count}`);

    const patientsCount = await query('SELECT COUNT(*) as count FROM patients');
    console.log(`   Patients: ${patientsCount.rows[0].count} (expected to be empty initially)`);

    const unmatchedTestsCount = await query('SELECT COUNT(*) as count FROM unmatched_tests');
    console.log(`   Unmatched Tests: ${unmatchedTestsCount.rows[0].count}`);

    // Check for data integrity
    console.log('\n🔗 Data Integrity Checks:');

    // Check for duplicate lab_no in encounters
    const duplicateLabNo = await query(
      `SELECT lab_no, COUNT(*) as count
       FROM encounters
       GROUP BY lab_no
       HAVING COUNT(*) > 1`
    );
    if (duplicateLabNo.rows.length > 0) {
      console.log(`   ❌ Found ${duplicateLabNo.rows.length} duplicate lab_no in encounters table:`);
      duplicateLabNo.rows.forEach(row => {
        console.log(`      - ${row.lab_no} (${row.count} times)`);
      });
    } else {
      console.log(`   ✅ No duplicate lab_no in encounters table`);
    }

    // Check for orphaned test_records (encounter_id not in encounters)
    const orphanedTests = await query(
      `SELECT COUNT(*) as count
       FROM test_records
       WHERE encounter_id IS NOT NULL
       AND encounter_id NOT IN (SELECT lab_no FROM encounters)`
    );
    if (parseInt(orphanedTests.rows[0].count) > 0) {
      console.log(`   ❌ Found ${orphanedTests.rows[0].count} orphaned test records (encounter_id not in encounters)`);
    } else {
      console.log(`   ✅ All test records have valid encounter_id foreign keys`);
    }

    // Check for tests without metadata
    const testsWithoutMetadata = await query(
      `SELECT COUNT(*) as count
       FROM test_records
       WHERE test_metadata_id IS NULL`
    );
    if (parseInt(testsWithoutMetadata.rows[0].count) > 0) {
      console.log(`   ⚠️  Found ${testsWithoutMetadata.rows[0].count} test records without metadata`);
    } else {
      console.log(`   ✅ All test records have metadata`);
    }

    // Show sample data
    console.log('\n📝 Sample Data:');

    const sampleEncounters = await query('SELECT * FROM encounters LIMIT 3');
    console.log('\n   Sample Encounters:');
    sampleEncounters.rows.forEach(row => {
      console.log(`   - Lab: ${row.lab_no}, Invoice: ${row.invoice_no}, Date: ${row.encounter_date}, Source: ${row.source}`);
    });

    const sampleTests = await query(
      `SELECT tr.*, e.invoice_no, e.encounter_date
       FROM test_records tr
       JOIN encounters e ON tr.encounter_id = e.lab_no
       LIMIT 3`
    );
    console.log('\n   Sample Test Records (with encounter data):');
    sampleTests.rows.forEach(row => {
      console.log(`   - Test: ${row.test_name}, Lab: ${row.encounter_id}, Invoice: ${row.invoice_no}, Date: ${row.encounter_date}`);
    });

    // Check for tests with time_out
    const testsWithTimeout = await query(
      'SELECT COUNT(*) as count FROM test_records WHERE time_out IS NOT NULL'
    );
    const totalTests = parseInt(testRecordsCount.rows[0].count);
    const withTimeout = parseInt(testsWithTimeout.rows[0].count);
    const timeoutPercentage = totalTests > 0 ? ((withTimeout / totalTests) * 100).toFixed(1) : '0';

    console.log(`\n⏱️  Timeout Status:`);
    console.log(`   Tests with time_out: ${withTimeout} / ${totalTests} (${timeoutPercentage}%)`);

    // Summary
    console.log('\n✅ Data verification complete!');
    console.log(`\n📈 Summary:`);
    console.log(`   - Total encounters: ${encountersCount.rows[0].count}`);
    console.log(`   - Total test records: ${testRecordsCount.rows[0].count}`);
    console.log(`   - Tests with results: ${withTimeout} (${timeoutPercentage}%)`);
    console.log(`   - Data integrity: ${duplicateLabNo.rows.length === 0 && parseInt(orphanedTests.rows[0].count) === 0 ? '✅ All checks passed' : '⚠️  Issues found above'}`);

  } catch (error) {
    console.error('❌ Data verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  verifyData()
    .then(() => {
      console.log('\n✅ Verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export default verifyData;
