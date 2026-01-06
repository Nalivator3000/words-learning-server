require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testSqlDirect() {
  const client = await pool.connect();

  try {
    console.log('=== TESTING SQL QUERY DIRECTLY ===\n');

    const level = 'A2';
    const theme = 'health';
    const sourceLangCode = 'de';

    console.log(`Parameters: level=${level}, theme=${theme}, source=${sourceLangCode}\n`);

    // Test with English (should work)
    console.log('1. Testing with target_translations_english:');
    const englishResult = await client.query(`
      SELECT
        sw.id,
        sw.word,
        tt.translation,
        sw.level,
        sw.theme
      FROM source_words_german sw
      LEFT JOIN target_translations_english tt ON sw.id = tt.source_word_id AND tt.source_lang = $3
      WHERE sw.level = $1 AND sw.theme = $2
      ORDER BY sw.word
      LIMIT 5
    `, [level, theme, sourceLangCode]);

    console.table(englishResult.rows);

    // Test with Russian (this is what we need)
    console.log('\n2. Testing with target_translations_russian:');
    const russianResult = await client.query(`
      SELECT
        sw.id,
        sw.word,
        tt.translation,
        sw.level,
        sw.theme
      FROM source_words_german sw
      LEFT JOIN target_translations_russian tt ON sw.id = tt.source_word_id AND tt.source_lang = $3
      WHERE sw.level = $1 AND sw.theme = $2
      ORDER BY sw.word
      LIMIT 5
    `, [level, theme, sourceLangCode]);

    console.table(russianResult.rows);

    // Check if translations exist
    const countResult = await client.query(`
      SELECT COUNT(*) as count
      FROM source_words_german sw
      JOIN target_translations_russian tt ON sw.id = tt.source_word_id AND tt.source_lang = 'de'
      WHERE sw.level = $1 AND sw.theme = $2
    `, [level, theme]);

    console.log(`\nTotal German A2 health words with Russian translations: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSqlDirect();
