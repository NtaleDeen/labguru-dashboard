import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdminPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Hash the password 'admin123'
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Generated hash:', hashedPassword);

    // Update the admin user
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE username = 'admin'
       RETURNING username, email, role`,
      [hashedPassword]
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log('User details:', result.rows[0]);
      console.log('\nYou can now log in with:');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('❌ Admin user not found');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();