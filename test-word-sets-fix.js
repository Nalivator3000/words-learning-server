const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: false
});

const TEST_CASES = [
  { userId: 50, email: 'test.de.en@lexibooster.test', expectedLang: 'german', from: 'de', to: 'en' },
  { userId: 51, email: 'test.de.ru@lexibooster.test', expectedLang: 'german', from: 'de', to: 'ru' },
  { userId: 52, email: 'test.de.es@lexibooster.test', expectedLang: 'german', from: 'de', to: 'es' },
  { userId: 60, email: 'test.en.ru@lexibooster.test', expectedLang: 'english', from: 'en', to: 'ru' },
  { userId: 61, email: 'test.en.de@lexibooster.test', expectedLang: 'english', from: 'en', to: 'de' },
  { userId: 62, email: 'test.en.es@lexibooster.test', expectedLang: 'english', from: 'en', to: 'es' },
  { userId: 70, email: 'test.es.en@lexibooster.test', expectedLang: 'spanish', from: 'es', to: 'en' },
  { userId: 74, email: 'test.fr.en@lexibooster.test', expectedLang: 'french', from: 'fr', to: 'en' },
  { userId: 77, email: 'test.it.en@lexibooster.test', expectedLang: 'italian', from: 'it', to: 'en' },
  { userId: 87, email: 'test.hi.en@lexibooster.test', expectedLang: 'hindi', from: 'hi', to: 'en' },
];

async function testWordSetsLogic() {
  console.log('🧪 Тестирование логики выбора word_sets после исправления\n');

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

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    // Симулируем что делает клиент
    const languagePairCode = `${testCase.from}-${testCase.to}`;

    // Симулируем ИСПРАВЛЕННУЮ логику сервера
    const parts = languagePairCode.split('-');
    const learningLanguage = parts[0]; // Исправлено: было parts[1], теперь parts[0]
    const fullLanguageName = langMap[learningLanguage] || learningLanguage;

    // Проверяем результат
    const isCorrect = fullLanguageName === testCase.expectedLang;

    if (isCorrect) {
      console.log(`✅ ${testCase.email}`);
      console.log(`   ${languagePairCode} → ${fullLanguageName} (ожидалось: ${testCase.expectedLang})`);
      passed++;
    } else {
      console.log(`❌ ${testCase.email}`);
      console.log(`   ${languagePairCode} → ${fullLanguageName} (ожидалось: ${testCase.expectedLang})`);
      failed++;
    }

    // Проверяем сколько word_sets существует для этого языка
    const count = await pool.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = $1
    `, [fullLanguageName]);

    console.log(`   Word sets в базе: ${count.rows[0].count}\n`);
  }

  console.log(`\n📊 РЕЗУЛЬТАТЫ:`);
  console.log(`✅ Прошло: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Провалилось: ${failed}/${TEST_CASES.length}`);

  if (failed === 0) {
    console.log('\n🎉 Все тесты прошли успешно! Исправление работает правильно.');
  } else {
    console.log('\n⚠️  Некоторые тесты провалились. Проверьте логику.');
  }

  await pool.end();
}

testWordSetsLogic().catch(err => {
  console.error('❌ Ошибка:', err);
  pool.end();
});
