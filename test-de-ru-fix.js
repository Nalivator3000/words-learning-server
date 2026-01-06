const https = require('https');

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

async function testDeRuFix() {
  console.log('=== TESTING DE→RU WORD SETS FIX ===\n');

  try {
    // Step 1: Get word sets for de-ru language pair
    console.log('Step 1: Fetching word sets for German→Russian...');
    const wordSetsUrl = `${BASE_URL}/api/word-sets?languagePair=de-ru&level=A2`;

    const wordSets = await fetch(wordSetsUrl);
    const wordSetsData = await wordSets.json();

    console.log(`Found ${wordSetsData.length} word sets for de-ru`);

    if (wordSetsData.length === 0) {
      console.log('❌ No word sets found for de-ru!');
      return;
    }

    // Step 2: Get first word set with languagePair parameter
    const firstSet = wordSetsData[0];
    console.log(`\nStep 2: Fetching word set "${firstSet.title}" (ID: ${firstSet.id}) WITH languagePair parameter...`);

    const setWithLangPairUrl = `${BASE_URL}/api/word-sets/${firstSet.id}?languagePair=de-ru`;
    const setWithLangPair = await fetch(setWithLangPairUrl);
    const setWithLangPairData = await setWithLangPair.json();

    console.log(`\nWord set details:`);
    console.log(`- Title: ${setWithLangPairData.title}`);
    console.log(`- Level: ${setWithLangPairData.level}`);
    console.log(`- Theme: ${setWithLangPairData.theme}`);
    console.log(`- Words count: ${setWithLangPairData.words.length}`);

    if (setWithLangPairData.words.length > 0) {
      console.log(`\n=== SAMPLE WORDS (first 10) ===`);
      setWithLangPairData.words.slice(0, 10).forEach((word, index) => {
        console.log(`${index + 1}. ${word.word} → ${word.translation || '❌ NO TRANSLATION'}`);
      });

      // Check if translations are in Russian (Cyrillic)
      const cyrillicRegex = /[\u0400-\u04FF]/;
      const wordsWithRussian = setWithLangPairData.words.filter(w =>
        w.translation && cyrillicRegex.test(w.translation)
      );

      console.log(`\n=== RESULTS ===`);
      console.log(`✅ Words with Russian translations: ${wordsWithRussian.length}/${setWithLangPairData.words.length}`);

      if (wordsWithRussian.length === 0) {
        console.log('❌ PROBLEM: No Russian translations found!');
        console.log('Translations are likely in English instead of Russian.');
      } else if (wordsWithRussian.length < setWithLangPairData.words.length * 0.5) {
        console.log('⚠️  WARNING: Less than 50% of words have Russian translations');
      } else {
        console.log('✅ SUCCESS: Most words have Russian translations!');
      }
    }

    // Step 3: Test WITHOUT languagePair parameter (should default to English)
    console.log(`\n\nStep 3: Fetching same word set WITHOUT languagePair parameter...`);
    const setWithoutLangPairUrl = `${BASE_URL}/api/word-sets/${firstSet.id}`;
    const setWithoutLangPair = await fetch(setWithoutLangPairUrl);
    const setWithoutLangPairData = await setWithoutLangPair.json();

    if (setWithoutLangPairData.words.length > 0) {
      console.log(`\nFirst 5 words (without languagePair):`);
      setWithoutLangPairData.words.slice(0, 5).forEach((word, index) => {
        console.log(`${index + 1}. ${word.word} → ${word.translation || '❌ NO TRANSLATION'}`);
      });

      const cyrillicRegex = /[\u0400-\u04FF]/;
      const wordsWithRussian = setWithoutLangPairData.words.filter(w =>
        w.translation && cyrillicRegex.test(w.translation)
      );

      console.log(`\nRussian translations: ${wordsWithRussian.length}/${setWithoutLangPairData.words.length}`);
      console.log('(Should default to English, so should be 0)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = async function(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              json: async () => JSON.parse(data),
              ok: res.statusCode >= 200 && res.statusCode < 300
            });
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
  };
}

testDeRuFix();
