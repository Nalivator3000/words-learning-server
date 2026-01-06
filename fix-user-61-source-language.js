const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

(async () => {
  try {
    const userId = 61;
    const languagePairId = 65;

    console.log('🔍 Checking user 61 data...\n');

    // Check current state
    const before = await pool.query(`
      SELECT source_language, status, COUNT(*) as count
      FROM user_word_progress
      WHERE user_id = $1 AND language_pair_id = $2
      GROUP BY source_language, status
      ORDER BY source_language, status
    `, [userId, languagePairId]);

    console.log('BEFORE FIX:');
    console.log('═══════════════════════════════════════');
    before.rows.forEach(row => {
      console.log(`  ${row.source_language}: ${row.status} = ${row.count}`);
    });
    console.log('═══════════════════════════════════════\n');

    // Fix: Update source_language from 'german' to 'english'
    console.log('🔧 Fixing source_language from "german" to "english"...\n');

    const updateResult = await pool.query(`
      UPDATE user_word_progress
      SET source_language = 'english'
      WHERE user_id = $1
        AND language_pair_id = $2
        AND source_language = 'german'
    `, [userId, languagePairId]);

    console.log(`✅ Updated ${updateResult.rowCount} records\n`);

    // Check after fix
    const after = await pool.query(`
      SELECT source_language, status, COUNT(*) as count
      FROM user_word_progress
      WHERE user_id = $1 AND language_pair_id = $2
      GROUP BY source_language, status
      ORDER BY source_language, status
    `, [userId, languagePairId]);

    console.log('AFTER FIX:');
    console.log('═══════════════════════════════════════');
    after.rows.forEach(row => {
      console.log(`  ${row.source_language}: ${row.status} = ${row.count}`);
    });
    console.log('═══════════════════════════════════════\n');

    // Calculate total studying count
    let studyingCount = 0;
    after.rows.forEach(row => {
      if ((row.status === 'new' || row.status === 'studying' || row.status === 'learning') && row.source_language === 'english') {
        studyingCount += parseInt(row.count);
      }
    });

    console.log(`📊 Total "studying" count now: ${studyingCount}`);

    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
