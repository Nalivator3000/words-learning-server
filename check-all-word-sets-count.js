// Check total word sets across all languages
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkAllCounts() {
  try {
    const client = await pool.connect();

    // Total word_sets (all languages)
    const totalWordSets = await client.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE is_public = true
    `);
    console.log('Total word_sets (all languages, public):', totalWordSets.rows[0].count);

    // Total universal_collections (all languages)
    const totalWordLists = await client.query(`
      SELECT COUNT(*) as count
      FROM universal_collections
      WHERE is_public = true
    `);
    console.log('Total universal_collections (all languages, public):', totalWordLists.rows[0].count);

    // Grand total
    const grandTotal = parseInt(totalWordSets.rows[0].count) + parseInt(totalWordLists.rows[0].count);
    console.log('\nGrand total (all languages):', grandTotal);

    // By language for word_sets
    console.log('\n=== Word Sets by Language ===');
    const byLang = await client.query(`
      SELECT source_language, COUNT(*) as count
      FROM word_sets
      WHERE is_public = true
      GROUP BY source_language
      ORDER BY count DESC
    `);
    byLang.rows.forEach(row => {
      console.log(`${row.source_language}: ${row.count}`);
    });

    // By language for universal_collections
    console.log('\n=== Universal Collections by Language ===');
    const byLangUC = await client.query(`
      SELECT source_lang, COUNT(*) as count
      FROM universal_collections
      WHERE is_public = true
      GROUP BY source_lang
      ORDER BY count DESC
    `);
    byLangUC.rows.forEach(row => {
      console.log(`${row.source_lang}: ${row.count}`);
    });

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllCounts();
