const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkSpanishSourceStructure() {
  try {
    console.log('\n🔍 === СТРУКТУРА ТАБЛИЦЫ source_words_spanish ===\n');

    // Проверяем структуру таблицы
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'source_words_spanish'
      ORDER BY ordinal_position
    `);

    console.log('Столбцы таблицы:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Проверяем распределение по уровням
    const levels = await pool.query(`
      SELECT level, COUNT(*) as count
      FROM source_words_spanish
      WHERE level IS NOT NULL
      GROUP BY level
      ORDER BY level
    `);

    console.log('\n📈 Распределение по уровням:');
    levels.rows.forEach(row => {
      console.log(`  ${row.level}: ${row.count} слов`);
    });

    // Проверяем наличие колонки theme
    const hasTheme = columns.rows.find(c => c.column_name === 'theme');

    if (hasTheme) {
      console.log('\n✅ Колонка theme найдена!\n');

      // Получаем распределение по темам
      const themes = await pool.query(`
        SELECT theme, COUNT(*) as count
        FROM source_words_spanish
        WHERE theme IS NOT NULL
        GROUP BY theme
        ORDER BY count DESC
        LIMIT 50
      `);

      console.log('🏷️  Темы (топ 50):');
      themes.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.theme}: ${row.count} слов`);
      });

      // Распределение тем по уровням
      console.log('\n\n📊 Темы по уровням:\n');

      const themesByLevel = await pool.query(`
        SELECT level, theme, COUNT(*) as count
        FROM source_words_spanish
        WHERE level IS NOT NULL AND theme IS NOT NULL
        GROUP BY level, theme
        ORDER BY level, count DESC
      `);

      let currentLevel = null;
      themesByLevel.rows.forEach(row => {
        if (row.level !== currentLevel) {
          currentLevel = row.level;
          console.log(`\n📈 ${currentLevel}:`);
        }
        console.log(`  - ${row.theme}: ${row.count} слов`);
      });

    } else {
      console.log('\n❌ Колонка theme НЕ найдена!');
    }

    // Общее количество слов
    const total = await pool.query(`SELECT COUNT(*) as count FROM source_words_spanish`);
    console.log(`\n\n📊 Всего слов в таблице: ${total.rows[0].count}\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkSpanishSourceStructure();
