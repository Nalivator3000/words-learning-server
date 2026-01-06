const https = require('https');

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

// Test cases with actual word sets that exist
const testCases = [
  {
    name: 'German→Russian (de→ru)',
    setId: 305,
    nativeLang: 'ru',
    expectedScript: 'Cyrillic',
    scriptTest: /[\u0400-\u04FF]/
  },
  {
    name: 'German→English (de→en)',
    setId: 300,
    nativeLang: 'en',
    expectedScript: 'Latin',
    scriptTest: /[a-zA-Z]/
  },
  {
    name: 'German→French (de→fr)',
    setId: 302,
    nativeLang: 'fr',
    expectedScript: 'Latin',
    scriptTest: /[a-zà-ÿ]/i
  },
  {
    name: 'German→Italian (de→it)',
    setId: 303,
    nativeLang: 'it',
    expectedScript: 'Latin',
    scriptTest: /[a-zà-ù]/i
  },
  {
    name: 'German→Spanish (de→es)',
    setId: 301,
    nativeLang: 'es',
    expectedScript: 'Latin',
    scriptTest: /[a-zá-ú]/i
  },
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
              details: 'Word set is empty or not found'
            });
            return;
          }

          const wordsWithTranslations = json.words.filter(w =>
            w.translation && w.translation.trim() !== ''
          );

          const wordsMatchingScript = wordsWithTranslations.filter(w =>
            testCase.scriptTest.test(w.translation)
          );

          const percentage = (wordsMatchingScript.length / json.words.length * 100).toFixed(1);
          const status = percentage >= 90 ? '✅ PASS' : percentage >= 50 ? '⚠️ PARTIAL' : '❌ FAIL';

          resolve({
            ...testCase,
            status,
            totalWords: json.words.length,
            withTranslations: wordsWithTranslations.length,
            correctScript: wordsMatchingScript.length,
            percentage,
            sampleWords: json.words.slice(0, 3).map(w =>
              `${w.word} → ${w.translation || 'N/A'}`
            )
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== TESTING ALL LANGUAGE PAIRS ===\n');
  console.log('Waiting 90 seconds for Railway deployment to complete...\n');

  await new Promise(resolve => setTimeout(resolve, 90000));

  console.log('Starting tests...\n');

  let passed = 0;
  let failed = 0;
  let partial = 0;

  for (const testCase of testCases) {
    try {
      const result = await testLanguagePair(testCase);

      console.log(`${result.status} ${result.name}`);
      console.log(`   Set ID: ${result.setId}, Target: ${result.nativeLang}`);
      console.log(`   Translations: ${result.withTranslations}/${result.totalWords}`);
      console.log(`   Correct script: ${result.correctScript}/${result.totalWords} (${result.percentage}%)`);
      console.log(`   Samples:`);
      result.sampleWords?.forEach(sample => console.log(`      - ${sample}`));
      console.log('');

      if (result.status.includes('PASS')) passed++;
      else if (result.status.includes('PARTIAL')) partial++;
      else failed++;

    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR - ${error.message}\n`);
      failed++;
    }
  }

  console.log('=== RESULTS ===');
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Partial: ${partial}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nTotal: ${passed + partial + failed}/${testCases.length}`);

  if (failed === 0 && partial === 0) {
    console.log('\n🎉 ALL TESTS PASSED! All language pairs are working correctly!');
  } else if (passed > 0) {
    console.log('\n⚠️  Some tests failed. Check the results above.');
  } else {
    console.log('\n❌ ALL TESTS FAILED! There may be a deployment issue.');
  }
}

runTests();
