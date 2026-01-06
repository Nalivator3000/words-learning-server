const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkAllLanguagesStatus() {
  try {
    console.log('\n🌍 === СТАТУС ВСЕХ ЯЗЫКОВ В БАЗЕ ===\n');

    // Проверяем какие таблицы source_words_* существуют
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'source_words_%'
      ORDER BY table_name
    `);

    console.log('📚 Таблицы с исходными словами:\n');

    const languageStats = [];

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      const language = tableName.replace('source_words_', '');

      // Получаем количество слов
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const totalWords = parseInt(countResult.rows[0].count);

      // Проверяем наличие колонки level
      const hasLevel = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'level'
        )
      `, [tableName]);

      // Проверяем наличие колонки theme
      const hasTheme = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'theme'
        )
      `, [tableName]);

      // Если есть level, получаем распределение по уровням
      let levelDistribution = null;
      if (hasLevel.rows[0].exists) {
        const levelsResult = await pool.query(`
          SELECT level, COUNT(*) as count
          FROM ${tableName}
          WHERE level IS NOT NULL
          GROUP BY level
          ORDER BY level
        `);
        levelDistribution = levelsResult.rows;
      }

      // Если есть theme, получаем количество тем
      let themeCount = 0;
      let themesWithWords = 0;
      if (hasTheme.rows[0].exists) {
        const themesResult = await pool.query(`
          SELECT COUNT(DISTINCT theme) as count
          FROM ${tableName}
          WHERE theme IS NOT NULL
        `);
        themeCount = parseInt(themesResult.rows[0].count);

        const themesStatsResult = await pool.query(`
          SELECT theme, COUNT(*) as count
          FROM ${tableName}
          WHERE theme IS NOT NULL
          GROUP BY theme
          HAVING COUNT(*) >= 10
        `);
        themesWithWords = themesStatsResult.rows.length;
      }

      // Проверяем наличие word sets
      const wordSetsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM word_sets
        WHERE source_language = $1
      `, [language]);
      const wordSetsCount = parseInt(wordSetsResult.rows[0].count);

      // Получаем количество тематических наборов (не general)
      const thematicSetsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM word_sets
        WHERE source_language = $1 AND theme IS NOT NULL AND theme != 'general'
      `, [language]);
      const thematicSetsCount = parseInt(thematicSetsResult.rows[0].count);

      languageStats.push({
        language,
        totalWords,
        hasLevel: hasLevel.rows[0].exists,
        hasTheme: hasTheme.rows[0].exists,
        levelDistribution,
        themeCount,
        themesWithWords,
        wordSetsCount,
        thematicSetsCount
      });
    }

    // Выводим статистику
    console.log('═'.repeat(90) + '\n');

    for (const stat of languageStats) {
      const langName = stat.language.toUpperCase();
      console.log(`🌐 ${langName}`);
      console.log(`   Всего слов: ${stat.totalWords}`);
      console.log(`   Колонка level: ${stat.hasLevel ? '✅' : '❌'}`);
      console.log(`   Колонка theme: ${stat.hasTheme ? '✅' : '❌'}`);

      if (stat.levelDistribution && stat.levelDistribution.length > 0) {
        console.log(`   Распределение по уровням:`);
        stat.levelDistribution.forEach(level => {
          console.log(`      ${level.level}: ${level.count} слов`);
        });
      }

      if (stat.hasTheme) {
        console.log(`   Уникальных тем: ${stat.themeCount}`);
        console.log(`   Тем с 10+ словами: ${stat.themesWithWords}`);
      }

      console.log(`   Word Sets: ${stat.wordSetsCount} (из них тематических: ${stat.thematicSetsCount})`);

      // Статус
      let status = '';
      if (stat.wordSetsCount > 0 && stat.thematicSetsCount > 0) {
        status = '✅ Полностью готов с тематическими наборами';
      } else if (stat.wordSetsCount > 0) {
        status = '⚠️  Есть наборы, но без тем';
      } else if (stat.hasLevel) {
        status = '🔧 Есть уровни, нужно создать наборы';
      } else {
        status = '❌ Нет структурированных данных';
      }
      console.log(`   Статус: ${status}`);
      console.log('\n' + '─'.repeat(90) + '\n');
    }

    // Итоговая статистика
    console.log('═'.repeat(90));
    console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:\n');

    const withSets = languageStats.filter(s => s.wordSetsCount > 0);
    const withThematic = languageStats.filter(s => s.thematicSetsCount > 0);
    const needsSets = languageStats.filter(s => s.wordSetsCount === 0 && s.hasLevel);
    const needsStructure = languageStats.filter(s => !s.hasLevel);

    console.log(`   Языков с наборами: ${withSets.length}/${languageStats.length}`);
    console.log(`   Языков с тематическими наборами: ${withThematic.length}/${languageStats.length}`);
    console.log(`   Языков, готовых к созданию наборов: ${needsSets.length}`);
    console.log(`   Языков без структуры: ${needsStructure.length}`);

    if (needsSets.length > 0) {
      console.log('\n🔧 ЯЗЫКИ, ГОТОВЫЕ К СОЗДАНИЮ НАБОРОВ:');
      needsSets.forEach(s => console.log(`   - ${s.language}`));
    }

    if (needsStructure.length > 0) {
      console.log('\n❌ ЯЗЫКИ БЕЗ СТРУКТУРЫ (нужны level/theme):');
      needsStructure.forEach(s => console.log(`   - ${s.language}`));
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkAllLanguagesStatus();
