const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

(async () => {
  try {
    const userId = 61;
    const languagePairId = 65;

    // Get source language
    const langPair = await pool.query('SELECT from_lang FROM language_pairs WHERE id = $1 AND user_id = $2', [languagePairId, userId]);
    console.log('Language pair:', langPair.rows[0]);

    const sourceLanguageCode = langPair.rows[0].from_lang;
    const sourceLanguage = sourceLanguageCode === 'en' ? 'english' : sourceLanguageCode;

    console.log('Source language:', sourceLanguage);

    // Get counts
    const query = `
        SELECT
            status,
            COUNT(*) as count
        FROM user_word_progress
        WHERE user_id = $1
        AND language_pair_id = $2
        AND source_language = $3
        GROUP BY status
    `;

    const result = await pool.query(query, [userId, languagePairId, sourceLanguage]);
    console.log('\nStatus counts from DB:', result.rows);

    // Calculate studying count (like in getWordCountsByStatus)
    let studyingCount = 0;
    result.rows.forEach(row => {
      if (row.status === 'new' || row.status === 'studying' || row.status === 'learning') {
        studyingCount += parseInt(row.count);
        console.log(`  Adding ${row.status}: ${row.count}`);
      }
    });

    console.log('\n✅ Total studying count:', studyingCount);

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
