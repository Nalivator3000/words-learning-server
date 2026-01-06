// Test word sets endpoint on production for different language pairs

const TEST_CASES = [
  {
    email: 'test.de.en@lexibooster.test',
    langPair: 'de-en',
    expectedLang: 'German',
    expectedCount: 134 // German word sets (public only)
  },
  {
    email: 'test.de.es@lexibooster.test',
    langPair: 'de-es',
    expectedLang: 'German',
    expectedCount: 134 // Should show German, not Spanish (public only)
  },
  {
    email: 'test.en.de@lexibooster.test',
    langPair: 'en-de',
    expectedLang: 'English',
    expectedCount: 237 // Should show English, not German
  },
  {
    email: 'test.en.es@lexibooster.test',
    langPair: 'en-es',
    expectedLang: 'English',
    expectedCount: 237
  },
  {
    email: 'test.es.en@lexibooster.test',
    langPair: 'es-en',
    expectedLang: 'Spanish',
    expectedCount: 236
  },
];

async function testProduction() {
  console.log('🧪 Тестирование word sets на продакшене\n');
  console.log('URL: https://lexybooster.com/api/word-sets\n');

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    try {
      const url = `https://lexybooster.com/api/word-sets?languagePair=${test.langPair}`;
      console.log(`📋 Тестирую: ${test.email} (${test.langPair})`);
      console.log(`   URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}\n`);
        failed++;
        continue;
      }

      const wordSets = await response.json();
      const count = wordSets.length;

      // Проверяем что это правильный язык (по названию первого сета)
      const firstSet = wordSets[0];
      const setTitle = firstSet?.title || '';
      const containsExpected = setTitle.includes(test.expectedLang);

      // Проверяем количество (приблизительно)
      const countMatches = Math.abs(count - test.expectedCount) < 10;

      if (containsExpected && countMatches) {
        console.log(`   ✅ Правильно: ${count} наборов для ${test.expectedLang}`);
        console.log(`      Пример: ${setTitle}`);
        passed++;
      } else {
        console.log(`   ❌ Неправильно: ${count} наборов`);
        console.log(`      Ожидалось: ~${test.expectedCount} наборов для ${test.expectedLang}`);
        console.log(`      Пример названия: ${setTitle}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      failed++;
    }

    console.log('');
  }

  console.log(`\n📊 РЕЗУЛЬТАТЫ:`);
  console.log(`✅ Прошло: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Провалилось: ${failed}/${TEST_CASES.length}`);

  if (failed === 0) {
    console.log('\n🎉 Все тесты прошли! Исправление работает на продакшене.');
  } else {
    console.log('\n⚠️  Некоторые тесты провалились. Возможно деплой еще не завершен.');
    console.log('   Подождите 1-2 минуты и попробуйте снова.');
  }
}

testProduction().catch(err => {
  console.error('❌ Ошибка:', err);
});
