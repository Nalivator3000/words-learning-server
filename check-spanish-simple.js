const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkSpanishWordSets() {
  try {
    console.log('\n🇪🇸 === ИСПАНСКИЕ НАБОРЫ СЛОВ ===\n');

    // Сначала проверим структуру таблицы
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'word_sets'
      ORDER BY ordinal_position
    `);

    console.log('Структура таблицы word_sets:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    console.log('\n');

    // Теперь получим все наборы
    const wordSets = await pool.query(`
      SELECT *
      FROM word_sets
      ORDER BY level ASC, theme ASC, word_count DESC
    `);

    console.log(`Всего наборов в базе: ${wordSets.rows.length}\n`);

    // Проверим, есть ли испанские наборы по source_language
    const spanishSets = wordSets.rows.filter(s =>
      s.source_language && s.source_language === 'spanish'
    );

    console.log(`Наборов с испанским (source_language = 'spanish'): ${spanishSets.length}\n`);

    if (spanishSets.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════════════════\n');

      let totalWords = 0;
      const byLevel = {};
      const byTheme = {};

      spanishSets.forEach((set, index) => {
        console.log(`${index + 1}. 📚 ${set.title || set.name || 'Без названия'}`);
        console.log(`   ID: ${set.id}`);
        console.log(`   📊 Количество слов: ${set.word_count || 0}`);
        console.log(`   🌍 Исходный язык: ${set.source_language}`);
        console.log(`   📈 Уровень: ${set.level || 'не указан'}`);
        console.log(`   🏷️  Тема: ${set.theme || 'не указана'}`);
        console.log(`   🔓 Публичный: ${set.is_public ? 'Да ✅' : 'Нет ❌'}`);
        if (set.description) {
          console.log(`   📝 Описание: ${set.description}`);
        }
        console.log('   ───────────────────────────────────────────────────────────────────────────\n');

        totalWords += set.word_count || 0;

        const level = set.level || 'без уровня';
        byLevel[level] = (byLevel[level] || 0) + 1;

        const theme = set.theme || 'без темы';
        byTheme[theme] = (byTheme[theme] || 0) + 1;
      });

      console.log('═══════════════════════════════════════════════════════════════════════════════');
      console.log(`\n📊 === ОБЩАЯ СТАТИСТИКА ===\n`);
      console.log(`   Всего наборов: ${spanishSets.length}`);
      console.log(`   Всего слов: ${totalWords}`);
      console.log(`   Средний размер набора: ${Math.round(totalWords / spanishSets.length)} слов\n`);

      console.log('📈 Распределение по уровням:');
      Object.entries(byLevel)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([level, count]) => {
          console.log(`   ${level}: ${count} набор(ов)`);
        });

      console.log('\n🏷️  Распределение по темам:');
      Object.entries(byTheme)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([theme, count]) => {
          console.log(`   ${theme}: ${count} набор(ов)`);
        });
    } else {
      // Покажем, какие исходные языки есть
      const allLanguages = {};
      wordSets.rows.forEach(s => {
        const lang = s.source_language || 'unknown';
        allLanguages[lang] = (allLanguages[lang] || 0) + 1;
      });

      console.log('Доступные исходные языки:');
      Object.entries(allLanguages)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([lang, count]) => {
          console.log(`  - ${lang}: ${count} набор(ов)`);
        });
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
