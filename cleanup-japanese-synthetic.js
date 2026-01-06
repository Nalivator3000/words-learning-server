/**
 * Clean up synthetic data from Japanese source_words table
 * Removes all words containing "_" (synthetic test data like "はい_123_A1")
 * Keeps only real Japanese words
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function cleanupSyntheticData() {
  console.log('\n' + '='.repeat(80));
  console.log('CLEANUP SYNTHETIC DATA FROM JAPANESE');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Check current state
    console.log('Step 1: Analyzing current data...\n');

    const totalQuery = await pool.query(`
      SELECT COUNT(*) as total FROM source_words_japanese
    `);
    const total = parseInt(totalQuery.rows[0].total);

    const syntheticQuery = await pool.query(`
      SELECT COUNT(*) as count FROM source_words_japanese WHERE word LIKE '%_%'
    `);
    const synthetic = parseInt(syntheticQuery.rows[0].count);

    const realQuery = await pool.query(`
      SELECT COUNT(*) as count FROM source_words_japanese WHERE word NOT LIKE '%_%'
    `);
    const real = parseInt(realQuery.rows[0].count);

    console.log(`Total words:      ${total.toLocaleString()}`);
    console.log(`Synthetic (with _): ${synthetic.toLocaleString()} (${((synthetic/total)*100).toFixed(2)}%)`);
    console.log(`Real words:       ${real.toLocaleString()} (${((real/total)*100).toFixed(2)}%)`);

    // Step 2: Show sample of real words (if any)
    if (real > 0) {
      console.log('\nSample of real words to keep:');
      const sampleReal = await pool.query(`
        SELECT word, translation, level
        FROM source_words_japanese
        WHERE word NOT LIKE '%_%'
        LIMIT 10
      `);
      sampleReal.rows.forEach((row, i) => {
        console.log(`  ${i+1}. ${row.word} - ${row.translation} (${row.level})`);
      });
    }

    // Step 3: Show sample of synthetic words to delete
    console.log('\nSample of synthetic words to delete:');
    const sampleSynthetic = await pool.query(`
      SELECT word, translation, level
      FROM source_words_japanese
      WHERE word LIKE '%_%'
      LIMIT 10
    `);
    sampleSynthetic.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.word} - ${row.translation} (${row.level})`);
    });

    // Step 4: Delete synthetic data
    console.log(`\nStep 2: Deleting ${synthetic.toLocaleString()} synthetic records...`);

    const deleteResult = await pool.query(`
      DELETE FROM source_words_japanese WHERE word LIKE '%_%'
    `);

    console.log(`Deleted: ${deleteResult.rowCount.toLocaleString()} records`);

    // Step 5: Verify cleanup
    console.log('\nStep 3: Verifying cleanup...\n');

    const finalTotal = await pool.query(`
      SELECT COUNT(*) as total FROM source_words_japanese
    `);
    const finalCount = parseInt(finalTotal.rows[0].total);

    const finalSynthetic = await pool.query(`
      SELECT COUNT(*) as count FROM source_words_japanese WHERE word LIKE '%_%'
    `);
    const finalSyntheticCount = parseInt(finalSynthetic.rows[0].count);

    console.log(`Remaining words:     ${finalCount.toLocaleString()}`);
    console.log(`Remaining synthetic: ${finalSyntheticCount.toLocaleString()}`);

    if (finalCount > 0) {
      console.log('\nRemaining real words by level:');
      const byLevel = await pool.query(`
        SELECT level, COUNT(*) as count
        FROM source_words_japanese
        GROUP BY level
        ORDER BY
          CASE level
            WHEN 'A1' THEN 1
            WHEN 'A2' THEN 2
            WHEN 'B1' THEN 3
            WHEN 'B2' THEN 4
            WHEN 'C1' THEN 5
            WHEN 'C2' THEN 6
          END
      `);

      byLevel.rows.forEach(row => {
        console.log(`  ${row.level}: ${parseInt(row.count).toLocaleString()} words`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('CLEANUP COMPLETE!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

cleanupSyntheticData();
