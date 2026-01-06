/**
 * Analyze themes in source words for all 6 languages
 */

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function analyzeThemes() {
  const languages = ['italian', 'portuguese', 'turkish', 'russian', 'arabic', 'ukrainian'];

  console.log('\n' + '═'.repeat(100));
  console.log('🎨 АНАЛИЗ ТЕМАТИЗАЦИИ СЛОВ В СЛОВАРЯХ');
  console.log('═'.repeat(100) + '\n');

  for (const lang of languages) {
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`🔹 ${lang.toUpperCase()}`);
    console.log('─'.repeat(100));

    // Total words
    const total = await pool.query(`SELECT COUNT(*) as count FROM source_words_${lang}`);
    const totalCount = parseInt(total.rows[0].count);

    // Words with themes
    const themed = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_${lang}
      WHERE theme IS NOT NULL AND theme != ''
    `);
    const themedCount = parseInt(themed.rows[0].count);

    // Words without themes
    const unthemed = totalCount - themedCount;

    // Theme distribution
    const themeDistribution = await pool.query(`
      SELECT theme, COUNT(*) as count
      FROM source_words_${lang}
      WHERE theme IS NOT NULL AND theme != ''
      GROUP BY theme
      ORDER BY count DESC
    `);

    const percentage = ((themedCount / totalCount) * 100).toFixed(1);

    console.log(`  📊 Всего слов: ${totalCount}`);
    console.log(`  🎨 С темами: ${themedCount} (${percentage}%)`);
    console.log(`  ⚪ Без тем: ${unthemed} (${(100 - percentage).toFixed(1)}%)`);
    console.log(`  📝 Уникальных тем: ${themeDistribution.rows.length}`);

    if (themeDistribution.rows.length > 0) {
      console.log('\n  Распределение по темам:');
      themeDistribution.rows.slice(0, 15).forEach(row => {
        const pct = ((parseInt(row.count) / totalCount) * 100).toFixed(1);
        console.log(`    • ${row.theme.padEnd(20)} - ${row.count.toString().padStart(4)} слов (${pct}%)`);
      });

      if (themeDistribution.rows.length > 15) {
        console.log(`    ... и ещё ${themeDistribution.rows.length - 15} тем`);
      }
    }
  }

  console.log('\n' + '═'.repeat(100) + '\n');

  await pool.end();
}

analyzeThemes().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
