const https = require('https');

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

async function testNativeLangFix() {
  console.log('=== TESTING NATIVE_LANG PARAMETER FIX ===\n');

  try {
    // Step 1: Get word sets
    console.log('Step 1: Fetching German A2 health word set WITH native_lang=ru parameter...');
    const url = `${BASE_URL}/api/word-sets/305?native_lang=ru`;

    console.log(`URL: ${url}\n`);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`Response received:`);
    console.log(`- Title: ${data.title}`);
    console.log(`- Level: ${data.level}`);
    console.log(`- Theme: ${data.theme}`);
    console.log(`- Words: ${data.words?.length || 0}`);

    if (data.words && data.words.length > 0) {
      console.log(`\n=== SAMPLE WORDS (first 15) ===`);
      data.words.slice(0, 15).forEach((word, index) => {
        const translation = word.translation || '❌ NO TRANSLATION';
        const isCyrillic = /[\u0400-\u04FF]/.test(translation);
        const indicator = isCyrillic ? '✅' : '❌';
        console.log(`${indicator} ${index + 1}. ${word.word} → ${translation}`);
      });

      // Check if translations are in Russian (Cyrillic)
      const cyrillicRegex = /[\u0400-\u04FF]/;
      const wordsWithRussian = data.words.filter(w =>
        w.translation && cyrillicRegex.test(w.translation)
      );

      console.log(`\n=== RESULTS ===`);
      console.log(`Russian translations: ${wordsWithRussian.length}/${data.words.length}`);

      const percentage = (wordsWithRussian.length / data.words.length * 100).toFixed(1);
      console.log(`Coverage: ${percentage}%`);

      if (wordsWithRussian.length === 0) {
        console.log('\n❌ FAILED: No Russian translations found!');
        console.log('The native_lang parameter is not working correctly.');
      } else if (wordsWithRussian.length < data.words.length * 0.9) {
        console.log(`\n⚠️  WARNING: Only ${percentage}% have Russian translations`);
      } else {
        console.log(`\n✅ SUCCESS: ${percentage}% of words have Russian translations!`);
        console.log('The native_lang parameter is working correctly.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Polyfill fetch for Node.js
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

testNativeLangFix();
