import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

// Simple translation using Google Translate (free, no API key)
async function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translated = parsed[0][0][0];
          resolve(translated);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function fillMissingTranslations() {
  const langs = ['ru', 'de', 'es', 'fr', 'it'];
  const keys = Object.keys(data);
  let filled = { ru: 0, de: 0, es: 0, fr: 0, it: 0 };

  console.log(`🌍 Starting mass translation for ${keys.length} keys...`);
  console.log(`Languages: ${langs.join(', ')}\n`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const translations = data[key];
    const source = translations.en || translations.source || '';

    if (!source) continue;

    process.stdout.write(`\r[${i + 1}/${keys.length}] ${key.substring(0, 30).padEnd(30)} `);

    for (const lang of langs) {
      if (!translations[lang] || translations[lang] === null || translations[lang].trim() === '') {
        const translated = await translateText(source, lang);
        if (translated) {
          translations[lang] = translated;
          filled[lang]++;
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  console.log('\n\n✅ Translation complete!\n');
  console.log('📊 Filled translations:');
  langs.forEach(lang => {
    console.log(`   ${lang.toUpperCase()}: ${filled[lang]} translations`);
  });

  fs.writeFileSync(SOURCE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Saved to ${path.basename(SOURCE)}`);
}

fillMissingTranslations().catch(console.error);
