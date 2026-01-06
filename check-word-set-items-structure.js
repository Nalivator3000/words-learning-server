const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
  try {
    // Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'word_set_items'
      ORDER BY ordinal_position
    `);

    console.log('word_set_items columns:');
    columns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Check constraints
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'word_set_items'::regclass
    `);

    console.log('\nConstraints:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.conname}:`);
      console.log(`    ${row.definition}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();
