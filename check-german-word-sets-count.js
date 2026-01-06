// Check German word sets count in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkCounts() {
  try {
    const client = await pool.connect();

    // Count word_sets for German
    const wordSets = await client.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = 'german' AND is_public = true
    `);
    console.log('German word_sets (public):', wordSets.rows[0].count);

    // Count universal_collections for German
    const wordLists = await client.query(`
      SELECT COUNT(*) as count
      FROM universal_collections
      WHERE source_lang = 'de' AND is_public = true
    `);
    console.log('German universal_collections (public):', wordLists.rows[0].count);

    // Total
    const total = parseInt(wordSets.rows[0].count) + parseInt(wordLists.rows[0].count);
    console.log('\nTotal German collections:', total);

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCounts();
