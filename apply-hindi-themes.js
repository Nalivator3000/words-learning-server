const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway",
  connectionTimeoutMillis: 10000
});

async function applyHindiThemes() {
  const client = await pool.connect();

  try {
    console.log('\n🇮🇳 === ПРИМЕНЕНИЕ ТЕМ ДЛЯ HINDI ===\n');

    // Читаем файл с темами
    const themesData = JSON.parse(fs.readFileSync('themes-hindi-all.json', 'utf8'));
    console.log(`📖 Загружено ${themesData.length} назначений тем из JSON`);

    // Группируем по темам
    const themeGroups = {};
    themesData.forEach(item => {
      if (!themeGroups[item.theme]) {
        themeGroups[item.theme] = [];
      }
      themeGroups[item.theme].push(item.word);
    });

    console.log(`\n🎨 Найдено ${Object.keys(themeGroups).length} уникальных тем:\n`);
    Object.entries(themeGroups).forEach(([theme, words]) => {
      console.log(`   ${theme}: ${words.length} слов`);
    });

    await client.query('BEGIN');

    let totalUpdated = 0;
    let totalMatched = 0;

    // Применяем темы
    for (const [theme, words] of Object.entries(themeGroups)) {
      console.log(`\n📝 Обрабатываю тему: ${theme} (${words.length} слов)`);

      // Применяем темы батчами
      for (let i = 0; i < words.length; i += 100) {
        const batch = words.slice(i, i + 100);

        const result = await client.query(`
          UPDATE source_words_hindi
          SET theme = $1
          WHERE word = ANY($2::text[])
        `, [theme, batch]);

        totalUpdated += result.rowCount;
        totalMatched += batch.length;
      }

      console.log(`   ✅ Обновлено записей: ${totalUpdated} (из ${totalMatched} в JSON)`);
    }

    await client.query('COMMIT');

    // Проверяем результаты
    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГОВАЯ СТАТИСТИКА:\n');

    const statsResult = await client.query(`
      SELECT theme, COUNT(*) as count
      FROM source_words_hindi
      WHERE theme IS NOT NULL
      GROUP BY theme
      ORDER BY count DESC
    `);

    console.log('Распределение по темам в базе данных:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.theme}: ${row.count} слов`);
    });

    const withoutTheme = await client.query(`
      SELECT COUNT(*) as count
      FROM source_words_hindi
      WHERE theme IS NULL
    `);

    console.log(`\n   Без темы: ${withoutTheme.rows[0].count} слов`);

    console.log(`\n✅ Всего обновлено: ${totalUpdated} слов`);
    console.log(`📋 Уникальных тем: ${statsResult.rows.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

applyHindiThemes();
