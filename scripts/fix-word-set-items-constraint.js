/**
 * Remove foreign key constraint from word_set_items.word_id
 * This allows us to store IDs from source_words_* tables instead of old words table
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixConstraint() {
  try {
    console.log('🔧 Fixing word_set_items constraints...\n');

    // Drop the foreign key constraint
    await pool.query(`
      ALTER TABLE word_set_items
      DROP CONSTRAINT IF EXISTS word_set_items_word_id_fkey
    `);

    console.log('✅ Removed word_set_items_word_id_fkey constraint');
    console.log('   Now word_id can reference any word from source_words_* tables\n');

    // Verify
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'word_set_items'::regclass
    `);

    console.log('Remaining constraints:');
    constraints.rows.forEach(row => {
      console.log(`  ✅ ${row.conname}`);
    });

    console.log('\n🎉 Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixConstraint();
