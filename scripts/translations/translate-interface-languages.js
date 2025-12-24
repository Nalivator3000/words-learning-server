const fs = require('fs');
const https = require('https');

const LANGUAGES = {
  'pl': 'polish',
  'ar': 'arabic',
  'tr': 'turkish',
  'ro': 'romanian',
  'sr': 'serbian',
  'uk': 'ukrainian',
  'it': 'italian',
  'es': 'spanish',
  'pt': 'portuguese',
  'sw': 'swahili'
};

const SOURCE_FILE = 'public/translations/source-texts.json';

// Translate using Google Translate API
async function translateWithGoogle(text, targetLang) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodedText}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            resolve(parsed[0][0][0]);
          } else {
            resolve(text); // Return original if translation fails
          }
        } catch (error) {
          console.error(`Translation error for "${text}": ${error.message}`);
          resolve(text);
        }
      });
    }).on('error', (error) => {
      console.error(`HTTP error: ${error.message}`);
      resolve(text);
    });
  });
}

async function translateAllLanguages() {
  console.log('🌍 Starting interface translation for 10 new languages...\n');

  // Load existing translations
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

  // Count total keys
  const keys = Object.keys(sourceData);
  const totalKeys = keys.length;
  const totalTranslations = totalKeys * Object.keys(LANGUAGES).length;

  console.log(`📊 Total keys to translate: ${totalKeys}`);
  console.log(`🌐 Total translations to generate: ${totalTranslations}\n`);

  let completed = 0;
  const startTime = Date.now();

  // Process each language
  for (const [langCode, langName] of Object.entries(LANGUAGES)) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 Translating to ${langName.toUpperCase()} (${langCode})...`);
    console.log(`${'='.repeat(70)}\n`);

    let translatedCount = 0;
    let skippedCount = 0;

    // Process each key
    for (const [key, translations] of Object.entries(sourceData)) {
      // Skip if translation already exists
      if (translations[langCode]) {
        skippedCount++;
        completed++;
        continue;
      }

      // Get English text as source
      const englishText = translations.en;
      if (!englishText) {
        console.warn(`⚠️  No English text for key: ${key}`);
        skippedCount++;
        completed++;
        continue;
      }

      // Translate
      try {
        const translation = await translateWithGoogle(englishText, langCode);
        sourceData[key][langCode] = translation;
        translatedCount++;
        completed++;

        // Progress indicator
        const progress = ((completed / totalTranslations) * 100).toFixed(1);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const rate = completed / elapsed;
        const remaining = Math.floor((totalTranslations - completed) / rate);

        if (translatedCount % 50 === 0) {
          console.log(`  ✅ ${translatedCount}/${totalKeys} | Progress: ${progress}% | ETA: ${remaining}s`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error translating "${key}": ${error.message}`);
        skippedCount++;
        completed++;
      }
    }

    console.log(`\n✅ ${langName.toUpperCase()} complete: ${translatedCount} translated, ${skippedCount} skipped`);

    // Save after each language to avoid data loss
    fs.writeFileSync(SOURCE_FILE, JSON.stringify(sourceData, null, 2), 'utf8');
    console.log(`💾 Saved progress to ${SOURCE_FILE}`);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('🎉 ALL TRANSLATIONS COMPLETE!');
  console.log(`${'='.repeat(70)}`);
  console.log(`📊 Total: ${totalTranslations} translations`);
  console.log(`⏱️  Time: ${Math.floor((Date.now() - startTime) / 1000)}s`);
  console.log(`💾 Saved to: ${SOURCE_FILE}\n`);
}

translateAllLanguages().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
