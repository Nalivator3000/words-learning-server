const https = require('https');

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

// Test different language pairs
const testCases = [
  { name: 'German→Russian (de→ru)', setId: 305, nativeLang: 'ru', expected: 'Cyrillic' },
  { name: 'English→Russian (en→ru)', setId: 350, nativeLang: 'ru', expected: 'Cyrillic' },
  { name: 'German→English (de→en)', setId: 300, nativeLang: 'en', expected: 'Latin' },
  { name: 'English→German (en→de)', setId: 351, nativeLang: 'de', expected: 'Latin' },
  { name: 'German→French (de→fr)', setId: 302, nativeLang: 'fr', expected: 'Latin' },
  { name: 'English→French (en→fr)', setId: 352, nativeLang: 'fr', expected: 'Latin' },
  { name: 'German→Italian (de→it)', setId: 303, nativeLang: 'it', expected: 'Latin' },
  { name: 'English→Arabic (en→ar)', setId: 353, nativeLang: 'ar', expected: 'Arabic' },
];

async function testLanguagePair(testCase) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api/word-sets/${testCase.setId}?native_lang=${testCase.nativeLang}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          if (!json.words || json.words.length === 0) {
            resolve({
              ...testCase,
              status: '⚠️ NO WORDS',
              translationCount: 0,
              totalWords: 0,
              percentage: 0
            });
            return;
          }

          const wordsWithTranslations = json.words.filter(w => w.translation && w.translation.trim() !== '');
          const percentage = (wordsWithTranslations.length / json.words.length * 100).toFixed(1);

          // Check if translations match expected script
          let scriptMatch = 'Unknown';
          if (wordsWithTranslations.length > 0) {
            const firstTranslation = wordsWithTranslations[0].translation;
            if (testCase.expected === 'Cyrillic' && /[\u0400-\u04FF]/.test(firstTranslation)) {
              scriptMatch = '✅ Cyrillic';
            } else if (testCase.expected === 'Arabic' && /[\u0600-\u06FF]/.test(firstTranslation)) {
              scriptMatch = '✅ Arabic';
            } else if (testCase.expected === 'Latin' && /[a-zA-Z]/.test(firstTranslation)) {
              scriptMatch = '✅ Latin';
            } else {
              scriptMatch = '❌ Wrong Script';
            }
          }

          resolve({
            ...testCase,
            status: percentage >= 90 ? '✅ GOOD' : percentage >= 50 ? '⚠️ PARTIAL' : '❌ BAD',
            translationCount: wordsWithTranslations.length,
            totalWords: json.words.length,
            percentage: percentage,
            scriptMatch: scriptMatch,
            sampleTranslation: wordsWithTranslations[0]?.translation || 'N/A'
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== TESTING MULTIPLE LANGUAGE PAIRS ===\n');
  console.log('Waiting 30 seconds for Railway deployment to complete...\n');

  // Wait for Railway deployment
  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log('Starting tests...\n');

  for (const testCase of testCases) {
    try {
      const result = await testLanguagePair(testCase);

      console.log(`${result.status} ${result.name}`);
      console.log(`   Set ID: ${result.setId}`);
      console.log(`   Translations: ${result.translationCount}/${result.totalWords} (${result.percentage}%)`);
      console.log(`   Script: ${result.scriptMatch}`);
      console.log(`   Sample: ${result.sampleTranslation}`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR - ${error.message}\n`);
    }
  }

  console.log('=== TESTING COMPLETE ===');
}

runTests();
