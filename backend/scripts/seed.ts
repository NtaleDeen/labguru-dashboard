import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create default admin user
    console.log('Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(
      `INSERT INTO users (username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', hashedPassword, 'manager', true]
    );

    // Create a technician user
    const techPassword = await bcrypt.hash('tech123', 10);
    await client.query(
      `INSERT INTO users (username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['technician', techPassword, 'technician', true]
    );

    // Create a viewer user
    const viewerPassword = await bcrypt.hash('viewer123', 10);
    await client.query(
      `INSERT INTO users (username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['viewer', viewerPassword, 'viewer', true]
    );

    console.log('✅ Default users created');
    console.log('   - Username: admin, Password: admin123 (Manager)');
    console.log('   - Username: technician, Password: tech123 (Technician)');
    console.log('   - Username: viewer, Password: viewer123 (Viewer)\n');

    // Seed sample tests
    console.log('Seeding sample tests...');
    
    const sampleTests = [
      { id: 'complete_blood_count', test_name: 'Complete Blood Count (CBC)', lab_section: 'Hematology', tat: 4, price: 25000 },
      { id: 'blood_glucose', test_name: 'Blood Glucose', lab_section: 'Biochemistry', tat: 2, price: 15000 },
      { id: 'lipid_profile', test_name: 'Lipid Profile', lab_section: 'Biochemistry', tat: 4, price: 35000 },
      { id: 'liver_function_test', test_name: 'Liver Function Test', lab_section: 'Biochemistry', tat: 6, price: 40000 },
      { id: 'kidney_function_test', test_name: 'Kidney Function Test', lab_section: 'Biochemistry', tat: 6, price: 38000 },
      { id: 'thyroid_profile', test_name: 'Thyroid Profile', lab_section: 'Immunology', tat: 24, price: 45000 },
      { id: 'urinalysis', test_name: 'Urinalysis', lab_section: 'Microbiology', tat: 2, price: 12000 },
      { id: 'malaria_test', test_name: 'Malaria Test (RDT)', lab_section: 'Parasitology', tat: 1, price: 10000 },
      { id: 'hiv_test', test_name: 'HIV Test', lab_section: 'Serology', tat: 1, price: 15000 },
      { id: 'hepatitis_b', test_name: 'Hepatitis B Surface Antigen', lab_section: 'Serology', tat: 24, price: 30000 },
      { id: 'blood_group', test_name: 'Blood Group & Rh Type', lab_section: 'Hematology', tat: 2, price: 18000 },
      { id: 'esr', test_name: 'Erythrocyte Sedimentation Rate (ESR)', lab_section: 'Hematology', tat: 2, price: 12000 },
      { id: 'hba1c', test_name: 'HbA1c (Glycated Hemoglobin)', lab_section: 'Biochemistry', tat: 24, price: 50000 },
      { id: 'uric_acid', test_name: 'Uric Acid', lab_section: 'Biochemistry', tat: 4, price: 20000 },
      { id: 'crp', test_name: 'C-Reactive Protein (CRP)', lab_section: 'Immunology', tat: 6, price: 28000 },
    ];

    for (const test of sampleTests) {
      await client.query(
        `INSERT INTO tests (id, test_name, lab_section, tat, price)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE 
         SET test_name = $2, lab_section = $3, tat = $4, price = $5`,
        [test.id, test.test_name, test.lab_section, test.tat, test.price]
      );
    }

    console.log(`✅ ${sampleTests.length} sample tests created\n`);

    // Seed sample test records for revenue analytics
    console.log('Seeding sample test records...');
    
    const today = new Date();
    const recordsToCreate = 100;
    
    for (let i = 0; i < recordsToCreate; i++) {
      // Random date within last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const encounterDate = new Date(today);
      encounterDate.setDate(encounterDate.getDate() - daysAgo);
      
      // Pick random test
      const randomTest = sampleTests[Math.floor(Math.random() * sampleTests.length)];
      
      await client.query(
        `INSERT INTO test_records (encounter_date, test_name, lab_section, price, tat)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          encounterDate.toISOString().split('T')[0],
          randomTest.test_name,
          randomTest.lab_section,
          randomTest.price,
          randomTest.tat
        ]
      );
    }

    console.log(`✅ ${recordsToCreate} sample test records created\n`);

    console.log('✅ All seeding completed successfully!\n');
    console.log('✨ Database is ready!\n');
    console.log('🔑 You can now login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding error:', error);
    process.exit(1);
  });