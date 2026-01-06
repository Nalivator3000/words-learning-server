/**
 * Final summary of thematic word sets creation across all processed languages
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function generateSummary() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 THEMATIC WORD SETS - FINAL SUMMARY');
    console.log('═'.repeat(80) + '\n');

    const languages = ['spanish', 'english', 'french', 'italian', 'portuguese', 'russian'];

    for (const lang of languages) {
      console.log(`\n🌍 ${lang.toUpperCase()}`);
      console.log('─'.repeat(80));

      // Get word sets statistics
      const setsStats = await pool.query(`
        SELECT
          COUNT(*) as total_sets,
          SUM(word_count) as total_words,
          COUNT(DISTINCT theme) as unique_themes,
          COUNT(*) FILTER (WHERE theme != 'general') as themed_sets,
          COUNT(*) FILTER (WHERE theme = 'general') as general_sets
        FROM word_sets
        WHERE source_language = $1
      `, [lang]);

      const stats = setsStats.rows[0];

      console.log(`📚 Total word sets: ${stats.total_sets}`);
      console.log(`📝 Total words coverage: ${stats.total_words}`);
      console.log(`🎨 Thematic sets: ${stats.themed_sets}`);
      console.log(`📦 General sets: ${stats.general_sets}`);
      console.log(`🏷️  Unique themes: ${stats.unique_themes}`);

      // Get themed words statistics
      const themedWords = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE theme IS NOT NULL AND theme != 'general') as themed,
          COUNT(*) FILTER (WHERE theme = 'general') as general,
          COUNT(*) as total
        FROM source_words_${lang}
      `, []);

      const wordStats = themedWords.rows[0];

      console.log(`\n💡 Word categorization:`);
      console.log(`   Themed words: ${wordStats.themed} (${((wordStats.themed / wordStats.total) * 100).toFixed(1)}%)`);
      console.log(`   General words: ${wordStats.general} (${((wordStats.general / wordStats.total) * 100).toFixed(1)}%)`);

      // Get distribution by level
      const byLevel = await pool.query(`
        SELECT level, COUNT(*) as sets
        FROM word_sets
        WHERE source_language = $1
        GROUP BY level
        ORDER BY level
      `, [lang]);

      console.log(`\n📈 Distribution by level:`);
      byLevel.rows.forEach(r => {
        console.log(`   ${r.level}: ${r.sets} sets`);
      });

      // Get top themes
      const topThemes = await pool.query(`
        SELECT theme, COUNT(*) as sets, SUM(word_count) as words
        FROM word_sets
        WHERE source_language = $1 AND theme != 'general'
        GROUP BY theme
        ORDER BY sets DESC
        LIMIT 5
      `, [lang]);

      if (topThemes.rows.length > 0) {
        console.log(`\n🏆 Top themes:`);
        topThemes.rows.forEach((t, i) => {
          console.log(`   ${i + 1}. ${t.theme}: ${t.sets} sets, ${t.words} words`);
        });
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Summary complete!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

generateSummary();
