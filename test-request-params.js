const https = require('https');

async function testRequestParams() {
  console.log('=== CHECKING WHAT PARAMETERS FRONTEND SENDS ===\n');

  // Simulate fetching a word set like frontend does
  const url = 'https://words-learning-server-production.up.railway.app/api/word-sets/305';

  console.log(`Fetching: ${url}`);
  console.log('(This is how frontend likely calls it - without any query parameters)\n');

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log(`Response received:`);
    console.log(`- Title: ${data.title}`);
    console.log(`- Words: ${data.words?.length || 0}`);

    if (data.words && data.words.length > 0) {
      const firstWord = data.words[0];
      console.log(`\nFirst word:`);
      console.log(`- German: ${firstWord.word}`);
      console.log(`- Translation: ${firstWord.translation || '❌ MISSING'}`);

      const isCyrillic = /[\u0400-\u04FF]/.test(firstWord.translation || '');
      console.log(`- Is Russian (Cyrillic): ${isCyrillic ? '✅ Yes' : '❌ No'}`);
    }

    console.log(`\n=== SOLUTION ===`);
    console.log(`Frontend needs to pass either:`);
    console.log(`1. ?languagePair=de-ru`);
    console.log(`2. ?userId=51 (and backend will lookup user's active language pair)`);
    console.log(`\nBut BEST solution: frontend should ALWAYS pass languagePair parameter!`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Polyfill fetch
if (typeof fetch === 'undefined') {
  global.fetch = async function(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            json: async () => JSON.parse(data)
          });
        });
      }).on('error', reject);
    });
  };
}

testRequestParams();
