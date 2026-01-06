/**
 * Check current status of Hindi vocabulary in database
 * Usage: node check-hindi-status.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkStatus() {
  console.log('\n' + '═'.repeat(80));
  console.log('HINDI VOCABULARY STATUS CHECK');
  console.log('═'.repeat(80) + '\n');

  try {
    // Total words
    const total = await pool.query('SELECT COUNT(*) FROM source_words_hindi');
    console.log(`📊 Total words: ${total.rows[0].count}\n`);

    // Synthetic vs Real
    const synthetic = await pool.query(`
      SELECT COUNT(*) FROM source_words_hindi WHERE word LIKE '%_%'
    `);
    const real = await pool.query(`
      SELECT COUNT(*) FROM source_words_hindi WHERE word NOT LIKE '%_%'
    `);

    console.log('🔍 Data Quality:');
    console.log(`   Synthetic (test) words: ${synthetic.rows[0].count}`);
    console.log(`   Real words: ${real.rows[0].count}`);

    const syntheticPercent = (synthetic.rows[0].count / total.rows[0].count * 100).toFixed(1);
    const realPercent = (real.rows[0].count / total.rows[0].count * 100).toFixed(1);
    console.log(`   Synthetic: ${syntheticPercent}%`);
    console.log(`   Real: ${realPercent}%\n`);

    // Distribution by level
    console.log('📈 Distribution by CEFR Level:');
    const byLevel = await pool.query(`
      SELECT level, COUNT(*) as count
      FROM source_words_hindi
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

    const targetDistribution = {
      'A1': 1000,
      'A2': 1000,
      'B1': 1500,
      'B2': 2000,
      'C1': 2500,
      'C2': 2000
    };

    for (const row of byLevel.rows) {
      const current = parseInt(row.count);
      const target = targetDistribution[row.level] || 0;
      const percent = target > 0 ? ((current / target) * 100).toFixed(1) : 0;
      const status = current >= target ? '✅' : '⚠️';
      console.log(`   ${status} ${row.level}: ${row.count.padStart(5)} / ${target} (${percent}%)`);
    }
    console.log();

    // Distribution by theme
    console.log('🎨 Distribution by Theme:');
    const byTheme = await pool.query(`
      SELECT
        COALESCE(theme, 'NULL') as theme,
        COUNT(*) as count
      FROM source_words_hindi
      GROUP BY theme
      ORDER BY count DESC
      LIMIT 20
    `);

    for (const row of byTheme.rows) {
      const themeName = row.theme === 'NULL' ? '(no theme)' : row.theme;
      console.log(`   ${themeName.padEnd(20)}: ${row.count} words`);
    }
    console.log();

    // Word sets
    console.log('📚 Word Sets:');
    const wordSets = await pool.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = 'hindi'
    `);
    console.log(`   Total word sets: ${wordSets.rows[0].count}\n`);

    if (wordSets.rows[0].count > 0) {
      const setsByLevel = await pool.query(`
        SELECT level, COUNT(*) as count
        FROM word_sets
        WHERE source_language = 'hindi'
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

      console.log('   Word sets by level:');
      for (const row of setsByLevel.rows) {
        console.log(`      ${row.level}: ${row.count} sets`);
      }
      console.log();
    }

    // Sample words
    console.log('📝 Sample Real Words (first 10):');
    const samples = await pool.query(`
      SELECT word, level, theme
      FROM source_words_hindi
      WHERE word NOT LIKE '%_%'
      ORDER BY id
      LIMIT 10
    `);

    if (samples.rows.length > 0) {
      for (const row of samples.rows) {
        const theme = row.theme || '(no theme)';
        console.log(`   ${row.word.padEnd(20)} [${row.level}] - ${theme}`);
      }
    } else {
      console.log('   (No real words found)');
    }
    console.log();

    // Recommendations
    console.log('💡 Recommendations:');
    const totalWords = parseInt(total.rows[0].count);
    const syntheticWords = parseInt(synthetic.rows[0].count);
    const realWords = parseInt(real.rows[0].count);

    if (syntheticWords > totalWords * 0.5) {
      console.log('   ⚠️  High percentage of synthetic data detected!');
      console.log('   → Run: node rebuild-hindi-vocabulary-complete.js');
    } else if (totalWords < 10000) {
      console.log('   ℹ️  Less than 10,000 words in vocabulary');
      console.log(`   → Need ${10000 - totalWords} more words`);
      console.log('   → Run: node rebuild-hindi-vocabulary-complete.js');
    } else {
      console.log('   ✅ Vocabulary looks good!');

      const noTheme = await pool.query(`
        SELECT COUNT(*) FROM source_words_hindi WHERE theme IS NULL
      `);

      if (parseInt(noTheme.rows[0].count) > 0) {
        console.log('   ℹ️  Some words still need theme assignment');
        console.log('   → Themes will be assigned to "general" automatically');
      }
    }

    console.log('\n' + '═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkStatus();
