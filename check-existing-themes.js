const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkExistingThemes() {
  try {
    console.log('\n📚 === ТЕМАТИЧЕСКИЕ НАБОРЫ (НЕМЕЦКИЙ И АНГЛИЙСКИЙ) ===\n');

    // Получаем наборы для немецкого
    const germanSets = await pool.query(`
      SELECT title, theme, level, word_count, description
      FROM word_sets
      WHERE source_language = 'german' AND theme IS NOT NULL
      ORDER BY level ASC, theme ASC
    `);

    console.log(`🇩🇪 НЕМЕЦКИЙ ЯЗЫК (${germanSets.rows.length} тематических наборов):\n`);

    if (germanSets.rows.length > 0) {
      const byTheme = {};
      germanSets.rows.forEach(set => {
        const theme = set.theme || 'no theme';
        if (!byTheme[theme]) {
          byTheme[theme] = [];
        }
        byTheme[theme].push(set);
      });

      Object.entries(byTheme).sort(([a], [b]) => a.localeCompare(b)).forEach(([theme, sets]) => {
        console.log(`\n🏷️  ${theme.toUpperCase()} (${sets.length} наборов):`);
        sets.forEach(set => {
          console.log(`   - ${set.title} [${set.level}] - ${set.word_count} слов`);
          if (set.description) {
            console.log(`     ${set.description}`);
          }
        });
      });
    }

    // Получаем наборы для английского
    const englishSets = await pool.query(`
      SELECT title, theme, level, word_count, description
      FROM word_sets
      WHERE source_language = 'english' AND theme IS NOT NULL
      ORDER BY level ASC, theme ASC
    `);

    console.log(`\n\n🇬🇧 АНГЛИЙСКИЙ ЯЗЫК (${englishSets.rows.length} тематических наборов):\n`);

    if (englishSets.rows.length > 0) {
      const byTheme = {};
      englishSets.rows.forEach(set => {
        const theme = set.theme || 'no theme';
        if (!byTheme[theme]) {
          byTheme[theme] = [];
        }
        byTheme[theme].push(set);
      });

      Object.entries(byTheme).sort(([a], [b]) => a.localeCompare(b)).forEach(([theme, sets]) => {
        console.log(`\n🏷️  ${theme.toUpperCase()} (${sets.length} наборов):`);
        sets.forEach(set => {
          console.log(`   - ${set.title} [${set.level}] - ${set.word_count} слов`);
          if (set.description) {
            console.log(`     ${set.description}`);
          }
        });
      });
    }

    // Статистика по темам
    console.log('\n\n📊 === СВОДНАЯ СТАТИСТИКА ПО ТЕМАМ ===\n');

    const allThemes = await pool.query(`
      SELECT
        theme,
        COUNT(*) as count,
        STRING_AGG(DISTINCT level, ', ' ORDER BY level) as levels
      FROM word_sets
      WHERE theme IS NOT NULL AND source_language IN ('german', 'english')
      GROUP BY theme
      ORDER BY theme
    `);

    console.log('Уникальные темы:');
    allThemes.rows.forEach(row => {
      console.log(`  - ${row.theme}: ${row.count} набор(ов), уровни: ${row.levels}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkExistingThemes();
