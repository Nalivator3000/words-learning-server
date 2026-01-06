const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function finalSpanishCheck() {
  try {
    console.log('\n🇪🇸 === ФИНАЛЬНАЯ ПРОВЕРКА ИСПАНСКИХ НАБОРОВ ===\n');

    // Получаем все наборы для испанского языка
    const wordSets = await pool.query(`
      SELECT
        level,
        theme,
        COUNT(*) as sets_count,
        SUM(word_count) as total_words,
        MIN(word_count) as min_words,
        MAX(word_count) as max_words,
        ROUND(AVG(word_count)) as avg_words
      FROM word_sets
      WHERE source_language = 'spanish'
      GROUP BY level, theme
      ORDER BY level, theme
    `);

    console.log('📊 Статистика по уровням и темам:\n');
    console.log('═'.repeat(80));

    let grandTotal = 0;
    let totalSets = 0;

    wordSets.rows.forEach(row => {
      console.log(`\n${row.level} - ${row.theme || 'без темы'}:`);
      console.log(`   Наборов: ${row.sets_count}`);
      console.log(`   Всего слов: ${row.total_words}`);
      console.log(`   Размер наборов: ${row.min_words} - ${row.max_words} слов (среднее: ${row.avg_words})`);

      grandTotal += parseInt(row.total_words);
      totalSets += parseInt(row.sets_count);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n🎯 ОБЩАЯ СТАТИСТИКА:\n');
    console.log(`   Всего наборов: ${totalSets}`);
    console.log(`   Всего уникальных слов: ${grandTotal}`);

    // Проверяем по уровням
    console.log('\n\n📈 РАСПРЕДЕЛЕНИЕ ПО УРОВНЯМ:\n');

    const byLevel = await pool.query(`
      SELECT
        level,
        COUNT(*) as sets_count,
        SUM(word_count) as total_words
      FROM word_sets
      WHERE source_language = 'spanish'
      GROUP BY level
      ORDER BY level
    `);

    byLevel.rows.forEach(row => {
      console.log(`   ${row.level}: ${row.sets_count} наборов, ${row.total_words} слов`);
    });

    // Проверяем статус is_public
    console.log('\n\n🔓 СТАТУС ПУБЛИЧНОСТИ:\n');

    const publicStatus = await pool.query(`
      SELECT
        is_public,
        COUNT(*) as count
      FROM word_sets
      WHERE source_language = 'spanish'
      GROUP BY is_public
    `);

    publicStatus.rows.forEach(row => {
      console.log(`   ${row.is_public ? 'Публичные ✅' : 'Приватные ❌'}: ${row.count} наборов`);
    });

    // Примеры наборов
    console.log('\n\n📚 ПРИМЕРЫ НАБОРОВ (первые 5 из каждого уровня):\n');

    const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    for (const level of LEVELS) {
      const examples = await pool.query(`
        SELECT title, word_count, is_public
        FROM word_sets
        WHERE source_language = 'spanish' AND level = $1
        ORDER BY title
        LIMIT 5
      `, [level]);

      if (examples.rows.length > 0) {
        console.log(`\n${level}:`);
        examples.rows.forEach((set, i) => {
          const status = set.is_public ? '✅' : '❌';
          console.log(`   ${i + 1}. ${set.title} (${set.word_count} слов) ${status}`);
        });
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

finalSpanishCheck();
