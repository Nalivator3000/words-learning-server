// Check user 52 progress via API
// Email: test.de.es@lexibooster.test

async function checkUser52Progress() {
  try {
    console.log('🔍 Проверяем прогресс пользователя 52...\n');

    // Login first
    console.log('📝 Логинимся как test.de.es@lexibooster.test...');

    const loginResponse = await fetch('https://lexybooster.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test.de.es@lexibooster.test',
        password: 'test123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();

    console.log(`✅ Залогинены как: ${loginData.user.name}`);
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}\n`);

    // Get session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    const sessionId = cookies?.match(/connect\.sid=([^;]+)/)?.[1];

    console.log('Cookie:', cookies);
    console.log('Session ID:', sessionId);

    // Get language pairs from login response
    const userId = loginData.user.id;
    const langPairs = loginData.languagePairs || [];

    console.log(`🌐 Языковые пары (${langPairs.length}):`);
    langPairs.forEach(lp => {
      console.log(`  - [${lp.id}] ${lp.fromLanguage} → ${lp.toLanguage} (${lp.name})`);
    });

    // Find de-es pair
    const deEsPair = langPairs.find(lp =>
      lp.fromLanguage === 'de' && lp.toLanguage === 'es'
    );

    if (!deEsPair) {
      throw new Error('de-es language pair not found');
    }

    console.log(`\n✅ Используем пару: ${deEsPair.fromLanguage} → ${deEsPair.toLanguage} (ID: ${deEsPair.id})\n`);

    // Get user words
    console.log('📚 Получаем слова пользователя...');

    const wordsResponse = await fetch(`https://lexybooster.com/api/words?userId=${userId}&languagePairId=${deEsPair.id}`, {
      headers: sessionId ? {
        'Cookie': `connect.sid=${sessionId}`
      } : {}
    });

    if (!wordsResponse.ok) {
      throw new Error(`Words fetch failed: ${wordsResponse.statusText}`);
    }

    const progress = await wordsResponse.json();
    console.log(`\n✅ Найдено ${progress.length} слов в прогрессе\n`);

    // Search for hermano and suspicious words
    const hermanoWords = progress.filter(p =>
      p.word?.toLowerCase().includes('hermano') ||
      p.translation?.toLowerCase().includes('hermano')
    );

    if (hermanoWords.length > 0) {
      console.log(`⚠️ Найдено ${hermanoWords.length} слов с "hermano":\n`);
      for (const word of hermanoWords) {
        console.log(`  ${word.word} → ${word.translation}`);
        console.log(`    word_id: ${word.word_id}`);
        console.log(`    language: ${word.language || 'N/A'}`);
        console.log(`    status: ${word.status}`);
        console.log('');
      }
    } else {
      console.log('✅ Слово "hermano" не найдено в прогрессе\n');
    }

    // Check for words with wrong language
    const learningLang = loginData.user.learning_language;
    console.log(`🔍 Проверяем слова с неправильным языком (ожидается: ${learningLang})...\n`);

    const wrongLangWords = progress.filter(p =>
      p.language && p.language !== learningLang
    );

    if (wrongLangWords.length > 0) {
      console.log(`⚠️ Найдено ${wrongLangWords.length} слов с неправильным языком:\n`);

      // Group by language
      const byLang = {};
      wrongLangWords.forEach(w => {
        if (!byLang[w.language]) byLang[w.language] = [];
        byLang[w.language].push(w);
      });

      for (const [lang, words] of Object.entries(byLang)) {
        console.log(`\n  📖 ${lang} (${words.length} слов):`);
        words.slice(0, 10).forEach(w => {
          console.log(`    - ${w.word} → ${w.translation}`);
        });
        if (words.length > 10) {
          console.log(`    ... и ещё ${words.length - 10} слов`);
        }
      }
    } else {
      console.log('✅ Все слова соответствуют изучаемому языку');
    }

    // Show sample of all words
    console.log(`\n\n📊 Примеры слов из прогресса (первые 20):\n`);
    progress.slice(0, 20).forEach((p, i) => {
      console.log(`${i + 1}. ${p.word} → ${p.translation}`);
      console.log(`   language: ${p.language || 'N/A'}, status: ${p.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkUser52Progress();
