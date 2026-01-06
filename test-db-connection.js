// Test database connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');

    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');

    const result = await client.query('SELECT NOW()');
    console.log('✅ Query executed:', result.rows[0]);

    // Test users table
    const usersTest = await client.query('SELECT COUNT(*) FROM users');
    console.log('✅ Users table accessible, count:', usersTest.rows[0].count);

    client.release();
    await pool.end();
    console.log('\n✅ Database connection is healthy!');
  } catch (error) {
    console.error('❌ Database connection error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database server is not running or not accessible');
    }
    process.exit(1);
  }
}

testConnection();
