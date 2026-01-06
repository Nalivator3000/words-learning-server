const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkSpanishWordSets() {
  try {
    console.log('\n🇪🇸 === ИСПАНСКИЕ НАБОРЫ СЛОВ ===\n');

    // Получаем все наборы для испанского языка
    const wordSets = await pool.query(`
      SELECT
        id,
        title,
        description,
        source_language,
        target_language,
        level,
        theme,
        word_count,
        is_public,
        created_at
      FROM word_sets
      WHERE source_language = 'spanish'
      ORDER BY level ASC, theme ASC, word_count DESC, title ASC
    `);

    if (wordSets.rows.length === 0) {
      console.log('❌ Наборы слов для испанского языка НЕ НАЙДЕНЫ!\n');

      // Проверим, какие языки вообще есть
      const allLanguages = await pool.query(`
        SELECT DISTINCT source_language, COUNT(*) as count
        FROM word_sets
        GROUP BY source_language
        ORDER BY source_language
      `);

      console.log('Доступные языки в базе:');
      allLanguages.rows.forEach(row => {
        console.log(`  - ${row.source_language}: ${row.count} набор(ов)`);
      });

    } else {
      console.log(`✅ Найдено наборов: ${wordSets.rows.length}\n`);
      console.log('═══════════════════════════════════════════════════════════════════════════════\n');

      let totalWords = 0;
      const byLevel = {};
      const byTheme = {};
      const byTarget = {};

      wordSets.rows.forEach((set, index) => {
        console.log(`${index + 1}. 📚 ${set.title || 'Без названия'}`);
        console.log(`   ID: ${set.id}`);
        console.log(`   📊 Количество слов: ${set.word_count || 0}`);
        console.log(`   📈 Уровень: ${set.level || 'не указан'}`);
        console.log(`   🏷️  Тема: ${set.theme || 'не указана'}`);
        console.log(`   🌍 Язык перевода: ${set.target_language || 'не указан'}`);
        console.log(`   🔓 Публичный: ${set.is_public ? 'Да ✅' : 'Нет ❌'}`);
        if (set.description) {
          console.log(`   📝 Описание: ${set.description}`);
        }
        console.log(`   📅 Создан: ${set.created_at ? new Date(set.created_at).toLocaleDateString('ru-RU') : 'не указано'}`);
        console.log('   ───────────────────────────────────────────────────────────────────────────\n');

        // Собираем статистику
        totalWords += set.word_count || 0;

        const level = set.level || 'без уровня';
        byLevel[level] = (byLevel[level] || 0) + 1;

        const theme = set.theme || 'без темы';
        byTheme[theme] = (byTheme[theme] || 0) + 1;

        const target = set.target_language || 'без языка перевода';
        byTarget[target] = (byTarget[target] || 0) + 1;
      });

      console.log('═══════════════════════════════════════════════════════════════════════════════');
      console.log(`\n📊 === ОБЩАЯ СТАТИСТИКА ===\n`);
      console.log(`   Всего наборов: ${wordSets.rows.length}`);
      console.log(`   Всего слов: ${totalWords}`);
      console.log(`   Средний размер набора: ${Math.round(totalWords / wordSets.rows.length)} слов\n`);

      // Статистика по уровням
      console.log('📈 Распределение по уровням:');
      Object.entries(byLevel)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([level, count]) => {
          console.log(`   ${level}: ${count} набор(ов)`);
        });

      // Статистика по темам
      console.log('\n🏷️  Распределение по темам:');
      Object.entries(byTheme)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([theme, count]) => {
          console.log(`   ${theme}: ${count} набор(ов)`);
        });

      // Статистика по целевым языкам
      console.log('\n🌍 Распределение по языкам перевода:');
      Object.entries(byTarget)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([target, count]) => {
          console.log(`   ${target}: ${count} набор(ов)`);
        });

      // Проверка наличия публичных наборов
      const publicSets = wordSets.rows.filter(s => s.is_public);
      const privateSets = wordSets.rows.filter(s => !s.is_public);
      console.log('\n🔓 Видимость наборов:');
      console.log(`   Публичные: ${publicSets.length}`);
      console.log(`   Приватные: ${privateSets.length}`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkSpanishWordSets();
