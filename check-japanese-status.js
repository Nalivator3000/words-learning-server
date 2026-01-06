/**
 * Check Japanese vocabulary status
 * Shows detailed statistics about current state
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkStatus() {
  console.log('\n' + '='.repeat(80));
  console.log('JAPANESE VOCABULARY STATUS');
  console.log('='.repeat(80) + '\n');

  try {
    // Overall statistics
    const totalQuery = await pool.query('SELECT COUNT(*) as count FROM source_words_japanese');
    const total = parseInt(totalQuery.rows[0].count);

    const syntheticQuery = await pool.query(`SELECT COUNT(*) as count FROM source_words_japanese WHERE word LIKE '%_%'`);
    const synthetic = parseInt(syntheticQuery.rows[0].count);

    const realQuery = await pool.query(`SELECT COUNT(*) as count FROM source_words_japanese WHERE word NOT LIKE '%_%'`);
    const real = parseInt(realQuery.rows[0].count);

    const themedQuery = await pool.query(`SELECT COUNT(*) as count FROM source_words_japanese WHERE theme IS NOT NULL`);
    const themed = parseInt(themedQuery.rows[0].count);

    console.log('Overall Statistics:');
    console.log(`  Total words:        ${total.toLocaleString()}`);
    console.log(`  Real words:         ${real.toLocaleString()} (${((real/total)*100).toFixed(1)}%)`);
    console.log(`  Synthetic words:    ${synthetic.toLocaleString()} (${((synthetic/total)*100).toFixed(1)}%)`);
    console.log(`  Themed words:       ${themed.toLocaleString()} (${real > 0 ? ((themed/real)*100).toFixed(1) : '0'}%)`);

    // Words by level
    console.log('\nWords by Level:');
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
          ELSE 999
        END
    `);

    byLevel.rows.forEach(row => {
      const count = parseInt(row.count);
      const target = {
        'A1': 1000,
        'A2': 1000,
        'B1': 1500,
        'B2': 2000,
        'C1': 2500,
        'C2': 2000
      }[row.level] || 0;

      const percentage = target > 0 ? ((count/target)*100).toFixed(1) : '0';
      console.log(`  ${row.level}: ${count.toLocaleString().padStart(6)} / ${target.toLocaleString().padStart(5)} (${percentage.padStart(5)}%)`);
    });

    // Words by theme
    if (themed > 0) {
      console.log('\nWords by Theme:');
      const byTheme = await pool.query(`
        SELECT theme, COUNT(*) as count
        FROM source_words_japanese
        WHERE theme IS NOT NULL
        GROUP BY theme
        ORDER BY count DESC
      `);

      byTheme.rows.forEach(row => {
        const count = parseInt(row.count);
        const percentage = ((count/themed)*100).toFixed(1);
        console.log(`  ${row.theme.padEnd(15)}: ${count.toLocaleString().padStart(5)} (${percentage.padStart(5)}%)`);
      });
    }

    // Word sets
    const setsQuery = await pool.query(`SELECT COUNT(*) as count FROM word_sets WHERE source_language = 'japanese'`);
    const setsCount = parseInt(setsQuery.rows[0].count);

    console.log('\nWord Sets:');
    console.log(`  Total sets: ${setsCount.toLocaleString()}`);

    if (setsCount > 0) {
      const setsByLevel = await pool.query(`
        SELECT level, COUNT(*) as count, SUM(word_count) as total_words
        FROM word_sets
        WHERE source_language = 'japanese'
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

      console.log('\nSets by Level:');
      setsByLevel.rows.forEach(row => {
        console.log(`  ${row.level}: ${parseInt(row.count).toString().padStart(3)} sets (${parseInt(row.total_words).toLocaleString().padStart(5)} words)`);
      });
    }

    // Sample words
    if (real > 0) {
      console.log('\nSample Real Words:');
      const sample = await pool.query(`
        SELECT word, translation, level, theme
        FROM source_words_japanese
        WHERE word NOT LIKE '%_%'
        ORDER BY RANDOM()
        LIMIT 10
      `);

      sample.rows.forEach((row, i) => {
        const theme = row.theme || 'no theme';
        console.log(`  ${(i+1).toString().padStart(2)}. ${row.word.padEnd(12)} - ${row.translation.padEnd(20)} [${row.level}] (${theme})`);
      });
    }

    // Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(80) + '\n');

    if (synthetic > real) {
      console.log('⚠️  High synthetic data detected!');
      console.log('   Run: node cleanup-japanese-synthetic.js\n');
    }

    if (real === 0) {
      console.log('❌ No real words found!');
      console.log('   Run: node generate-japanese-vocabulary.js\n');
    } else if (real < 10000) {
      console.log(`⚠️  Only ${real.toLocaleString()} real words (target: 10,000)`);
      console.log('   Run: node generate-japanese-vocabulary.js\n');
    }

    if (real > 0 && themed === 0) {
      console.log('❌ No themes assigned!');
      console.log('   Run: node assign-japanese-themes-llm.js\n');
    } else if (real > 0 && themed < real) {
      console.log(`⚠️  Only ${themed.toLocaleString()}/${real.toLocaleString()} words have themes`);
      console.log('   Run: node assign-japanese-themes-llm.js\n');
    }

    if (themed > 0 && setsCount === 0) {
      console.log('❌ No word sets created!');
      console.log('   Run: node create-japanese-word-sets.js\n');
    }

    if (real >= 10000 && themed >= real && setsCount > 0) {
      console.log('✅ Japanese vocabulary is complete!');
      console.log(`   ${total.toLocaleString()} words, ${themed.toLocaleString()} themed, ${setsCount.toLocaleString()} sets\n`);
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkStatus();
