const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

(async () => {
  try {
    const userId = 61;

    // Check all records for user 61
    const allRecords = await pool.query(`
      SELECT language_pair_id, source_language, status, COUNT(*) as count
      FROM user_word_progress
      WHERE user_id = $1
      GROUP BY language_pair_id, source_language, status
      ORDER BY language_pair_id, source_language, status
    `, [userId]);

    console.log('All records for user 61:');
    console.log('═══════════════════════════════════════════════════════════');

    let total = 0;
    allRecords.rows.forEach(row => {
      console.log(`Pair ${row.language_pair_id} | Lang: ${row.source_language} | Status: ${row.status} | Count: ${row.count}`);
      total += parseInt(row.count);
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`TOTAL WORDS: ${total}`);

    // Check language pairs for user 61
    console.log('\nLanguage pairs for user 61:');
    const pairs = await pool.query('SELECT id, name, from_lang, to_lang, is_active FROM language_pairs WHERE user_id = $1', [userId]);
    pairs.rows.forEach(p => {
      console.log(`  ID ${p.id}: ${p.name} (${p.from_lang} → ${p.to_lang}) Active: ${p.is_active}`);
    });

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
