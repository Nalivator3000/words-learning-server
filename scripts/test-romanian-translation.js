const https = require('https');

/**
 * Test translation function
 */
function translateToRomanian(text) {
  return new Promise((resolve) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=ro&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            resolve(parsed[0][0][0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(`Parse error: ${e.message}`);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`HTTP error: ${err.message}`);
      resolve(null);
    });
  });
}

async function testTranslations() {
  console.log('🧪 Testing German → Romanian translations...\n');

  const testWords = [
    'Hallo',
    'Guten Tag',
    'Auf Wiedersehen',
    'der Mann',
    'die Frau',
    'das Kind',
    'ich liebe dich',
    'Wie geht es dir?',
    'Danke schön',
    'Bitte'
  ];

  for (const word of testWords) {
    const translation = await translateToRomanian(word);
    console.log(`"${word}" → "${translation}"`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ Test complete!');
}

testTranslations().catch(console.error);
