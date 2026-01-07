const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    // Get a sample of words for user 53, language pair 57
    const result = await pool.query(`
      SELECT
        w.id,
        w.word,
        w.example,
        w.translation,
        w.example_translation,
        lp.from_lang,
        lp.to_lang
      FROM words w
      JOIN language_pairs lp ON w.language_pair_id = lp.id
      WHERE w.user_id = 53 AND w.language_pair_id = 57
      LIMIT 5
    `);

    console.log('Sample words for user 53 (Language pair: de -> fr):');
    console.log(JSON.stringify(result.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
