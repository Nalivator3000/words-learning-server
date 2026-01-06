const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: false
});

async function debug() {
  console.log('🔍 Отладка для test.de.es@lexibooster.test (user_id = 52)\n');

  // 1. Получить language_pairs для user_id=52
  const lpResult = await pool.query(`
    SELECT * FROM language_pairs WHERE user_id = 52 AND is_active = true
  `);

  console.log('1️⃣ Данные из language_pairs:');
  console.log(JSON.stringify(lpResult.rows[0], null, 2));

  const pair = lpResult.rows[0];
  console.log(`\nfrom_lang: ${pair.from_lang}`);
  console.log(`to_lang: ${pair.to_lang}`);

  // 2. Симулируем что делает клиент
  console.log('\n2️⃣ Что формирует клиент (word-lists-ui.js:160):');
  const langPairCode = `${pair.from_lang}-${pair.to_lang}`;
  console.log(`  languagePairCode = "${langPairCode}"`);

  // 3. Симулируем что делает сервер с этим параметром
  console.log('\n3️⃣ Что делает сервер (server-postgresql.js:2849-2874):');
  const parts = langPairCode.split('-');
  console.log(`  parts[0] = "${parts[0]}" (from_lang)`);
  console.log(`  parts[1] = "${parts[1]}" (to_lang)`);

  const learningLanguage = parts[1]; // Вот здесь ошибка!
  console.log(`  learningLanguage = parts[1] = "${learningLanguage}"`);

  const langMap = {
    'de': 'german',
    'en': 'english',
    'hi': 'hindi',
    'es': 'spanish',
    'fr': 'french',
    'it': 'italian',
    'pt': 'portuguese',
    'ru': 'russian',
    'uk': 'ukrainian',
    'ja': 'japanese',
    'sw': 'swahili'
  };

  const fullLanguageName = langMap[learningLanguage] || learningLanguage;
  console.log(`  fullLanguageName = "${fullLanguageName}"`);

  console.log(`\n❌ ОШИБКА: Сервер будет искать word_sets с source_language = "${fullLanguageName}"`);
  console.log(`✅ ПРАВИЛЬНО должно быть: source_language = "${langMap[parts[0]]}"`);

  // 4. Проверяем сколько word_sets существует для каждого языка
  console.log('\n4️⃣ Количество word_sets в базе:');
  const counts = await pool.query(`
    SELECT source_language, COUNT(*) as count
    FROM word_sets
    WHERE source_language IN ('german', 'spanish')
    GROUP BY source_language
    ORDER BY source_language
  `);
  counts.rows.forEach(row => {
    console.log(`  ${row.source_language}: ${row.count} наборов`);
  });

  // 5. Показываем примеры word_sets для spanish (неправильно)
  console.log('\n5️⃣ Примеры word_sets для Spanish (НЕПРАВИЛЬНО - показывается сейчас):');
  const wrongSets = await pool.query(`
    SELECT id, title, level, theme, word_count
    FROM word_sets
    WHERE source_language = 'spanish'
    ORDER BY level, id
    LIMIT 5
  `);
  wrongSets.rows.forEach(set => {
    console.log(`  [${set.id}] ${set.title} (${set.word_count} words)`);
  });

  // 6. Показываем примеры word_sets для german (правильно)
  console.log('\n6️⃣ Примеры word_sets для German (ПРАВИЛЬНО - должно показываться):');
  const correctSets = await pool.query(`
    SELECT id, title, level, theme, word_count
    FROM word_sets
    WHERE source_language = 'german'
    ORDER BY level, id
    LIMIT 5
  `);
  correctSets.rows.forEach(set => {
    console.log(`  [${set.id}] ${set.title} (${set.word_count} words)`);
  });

  console.log('\n\n📋 РЕЗЮМЕ:');
  console.log(`User ID 52 учит: ${pair.from_lang} (${langMap[pair.from_lang]})`);
  console.log(`Родной язык: ${pair.to_lang} (${langMap[pair.to_lang]})`);
  console.log(`\nОшибка в server-postgresql.js строка 2855:`);
  console.log(`  const learningLanguage = parts[1]; // НЕПРАВИЛЬНО!`);
  console.log(`\nДолжно быть:`);
  console.log(`  const learningLanguage = parts[0]; // Первая часть - это язык который учат`);

  await pool.end();
}

debug().catch(err => {
  console.error('❌ Ошибка:', err);
  pool.end();
});
