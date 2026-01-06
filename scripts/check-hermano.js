const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'words_app',
  password: process.env.DB_PASSWORD || 'Poiuytrewq1',
  port: process.env.DB_PORT || 5432,
});

async function checkHermano() {
  try {
    console.log('🔍 Searching for "hermano" in database...\n');

    // Search in words table
    const wordsResult = await pool.query(`
      SELECT word_id, word, language, translation, theme
      FROM words
      WHERE word ILIKE '%hermano%' OR translation ILIKE '%hermano%'
      ORDER BY word_id
    `);

    console.log(`📝 Found ${wordsResult.rows.length} entries with "hermano":\n`);

    for (const row of wordsResult.rows) {
      console.log(`ID: ${row.word_id}`);
      console.log(`Word: ${row.word}`);
      console.log(`Language: ${row.language}`);
      console.log(`Translation: ${row.translation}`);
      console.log(`Theme: ${row.theme || 'N/A'}`);
      console.log('---');
    }

    // Check word sets
    if (wordsResult.rows.length > 0) {
      const wordIds = wordsResult.rows.map(r => r.word_id);
      console.log('\n📚 Checking word sets containing these words:\n');

      const setsResult = await pool.query(`
        SELECT DISTINCT ws.set_id, ws.set_name, ws.language, ws.difficulty_level, ws.theme
        FROM word_sets ws
        JOIN word_set_words wsw ON ws.set_id = wsw.set_id
        WHERE wsw.word_id = ANY($1)
        ORDER BY ws.set_id
      `, [wordIds]);

      console.log(`Found in ${setsResult.rows.length} word sets:\n`);
      for (const set of setsResult.rows) {
        console.log(`Set ID: ${set.set_id}`);
        console.log(`Name: ${set.set_name}`);
        console.log(`Language: ${set.language}`);
        console.log(`Difficulty: ${set.difficulty_level}`);
        console.log(`Theme: ${set.theme || 'N/A'}`);
        console.log('---');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkHermano();
