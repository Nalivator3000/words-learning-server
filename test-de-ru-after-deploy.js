const https = require('https');

async function testDeRu() {
  console.log('Waiting 60 seconds for Railway deployment...\n');
  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('Testing de→ru translation (Set 305)...\n');

  return new Promise((resolve, reject) => {
    const url = 'https://words-learning-server-production.up.railway.app/api/word-sets/305?native_lang=ru';

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          console.log(`Set: ${json.title}`);
          console.log(`Words count: ${json.words?.length || 0}\n`);

          if (json.words && json.words.length > 0) {
            console.log('First 10 translations:');
            json.words.slice(0, 10).forEach((w, i) => {
              const isCyrillic = /[\u0400-\u04FF]/.test(w.translation || '');
              const status = isCyrillic ? '✅' : '❌';
              console.log(`  ${i+1}. ${w.word} → ${w.translation || 'N/A'} ${status}`);
            });

            const cyrillicCount = json.words.filter(w => /[\u0400-\u04FF]/.test(w.translation || '')).length;
            const percentage = (cyrillicCount / json.words.length * 100).toFixed(1);

            console.log(`\nRussian (Cyrillic) translations: ${cyrillicCount}/${json.words.length} (${percentage}%)`);

            if (percentage >= 90) {
              console.log('\n✅ SUCCESS: Translations are in Russian!');
            } else {
              console.log('\n❌ FAILED: Translations are not in Russian!');
            }
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

testDeRu();
