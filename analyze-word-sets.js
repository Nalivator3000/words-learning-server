/**
 * Analyze current word sets for all 6 improved languages
 */

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function analyzeWordSets() {
  const languages = ['italian', 'portuguese', 'turkish', 'russian', 'arabic', 'ukrainian'];

  console.log('\n' + '═'.repeat(100));
  console.log('📚 АНАЛИЗ НАБОРОВ СЛОВ ДЛЯ 6 ЯЗЫКОВ');
  console.log('═'.repeat(100) + '\n');

  for (const lang of languages) {
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`🔹 ${lang.toUpperCase()}`);
    console.log('─'.repeat(100));

    // Total sets
    const totalSets = await pool.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = $1
    `, [lang]);

    // Thematic sets
    const thematicSets = await pool.query(`
      SELECT theme, COUNT(*) as count
      FROM word_sets
      WHERE source_language = $1 AND theme IS NOT NULL AND theme != ''
      GROUP BY theme
      ORDER BY count DESC
    `, [lang]);

    // General sets (no theme)
    const generalSets = await pool.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = $1 AND (theme IS NULL OR theme = '')
    `, [lang]);

    // Public vs private
    const publicSets = await pool.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = $1 AND is_public = true
    `, [lang]);

    console.log(`  📊 Всего наборов: ${totalSets.rows[0].count}`);
    console.log(`  🌍 Публичных: ${publicSets.rows[0].count}`);
    console.log(`  📝 Общих (без темы): ${generalSets.rows[0].count}`);
    console.log(`  🎨 Тематических: ${thematicSets.rows.length} тем, ${thematicSets.rows.reduce((sum, r) => sum + parseInt(r.count), 0)} наборов`);

    if (thematicSets.rows.length > 0) {
      console.log('\n  Темы:');
      thematicSets.rows.forEach(row => {
        console.log(`    • ${row.theme.padEnd(20)} - ${row.count} набор(ов)`);
      });
    }
  }

  console.log('\n' + '═'.repeat(100) + '\n');

  await pool.end();
}

analyzeWordSets().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
