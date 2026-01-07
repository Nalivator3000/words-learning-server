// Check hermano word via API

async function checkHermano() {
  try {
    console.log('🔍 Проверка слова "hermano" через API...\n');

    // First, get all Spanish word sets
    const setsUrl = 'https://lexybooster.com/api/word-sets?languagePair=de-es';
    console.log('Получаем наборы de-es:', setsUrl);

    const setsResponse = await fetch(setsUrl);
    if (!setsResponse.ok) {
      throw new Error(`Failed to fetch word sets: ${setsResponse.statusText}`);
    }

    const sets = await setsResponse.json();
    console.log(`\n✅ Найдено ${sets.length} наборов de-es\n`);

    // Check each set for hermano
    console.log('🔎 Ищем "hermano" в наборах...\n');

    const setsWithHermano = [];

    for (const set of sets) {
      // Get words from this set
      const wordsUrl = `https://lexybooster.com/api/word-sets/${set.id}/words`;

      try {
        const wordsResponse = await fetch(wordsUrl);
        if (!wordsResponse.ok) continue;

        const data = await wordsResponse.json();
        const words = data.words || [];

        // Check if any word contains "hermano"
        const hermanoWords = words.filter(w =>
          w.word?.toLowerCase().includes('hermano') ||
          w.translation?.toLowerCase().includes('hermano')
        );

        if (hermanoWords.length > 0) {
          setsWithHermano.push({
            set: set,
            words: hermanoWords
          });
        }
      } catch (err) {
        // Skip sets that error
        continue;
      }
    }

    if (setsWithHermano.length > 0) {
      console.log(`⚠️ Найдено ${setsWithHermano.length} наборов со словом "hermano":\n`);

      for (const { set, words } of setsWithHermano) {
        console.log(`📚 Набор: [${set.id}] ${set.title}`);
        console.log(`   Language: ${set.source_language}`);
        console.log(`   Level: ${set.level}, Theme: ${set.theme}`);
        console.log(`   Слова с "hermano":`);

        for (const word of words) {
          console.log(`     - ${word.word} → ${word.translation}`);
          console.log(`       (word_id: ${word.word_id}, language: ${word.language || 'N/A'})`);
        }
        console.log('');
      }
    } else {
      console.log('✅ Слово "hermano" не найдено ни в одном наборе');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkHermano();
