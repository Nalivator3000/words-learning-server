require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugWordSets() {
  const client = await pool.connect();

  try {
    console.log('=== WORD_SETS TABLE STRUCTURE ===');
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'word_sets'
      ORDER BY ordinal_position
    `);
    console.table(columnsResult.rows);

    console.log('\n=== SAMPLE WORD SETS ===');
    const sampleResult = await client.query(`
      SELECT id, title, source_language, target_language, level, theme, is_public, word_count
      FROM word_sets
      LIMIT 10
    `);
    console.table(sampleResult.rows);

    console.log('\n=== WORD SETS BY LANGUAGE PAIR ===');
    const countResult = await client.query(`
      SELECT
        source_language,
        target_language,
        COUNT(*) as count,
        SUM(word_count) as total_words
      FROM word_sets
      WHERE is_public = true
      GROUP BY source_language, target_language
      ORDER BY count DESC
    `);
    console.table(countResult.rows);

    console.log('\n=== GERMAN WORD SETS ===');
    const germanResult = await client.query(`
      SELECT
        source_language,
        target_language,
        COUNT(*) as count,
        SUM(word_count) as total_words
      FROM word_sets
      WHERE source_language = 'german' AND is_public = true
      GROUP BY source_language, target_language
      ORDER BY count DESC
    `);
    console.table(germanResult.rows);

    console.log('\n=== DE-RU WORD SETS ===');
    const deRuResult = await client.query(`
      SELECT id, title, level, theme, word_count, is_public
      FROM word_sets
      WHERE source_language = 'german' AND target_language = 'russian' AND is_public = true
      ORDER BY level, theme
      LIMIT 20
    `);
    console.table(deRuResult.rows);

    console.log('\n=== CHECKING LANGUAGE PAIRS TABLE ===');
    const langPairsResult = await client.query(`
      SELECT *
      FROM language_pairs
      ORDER BY from_language, to_language
    `);
    console.table(langPairsResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugWordSets();
