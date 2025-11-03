import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

const langs = ['ru', 'de', 'es', 'fr', 'it'];
let filled = { ru: 0, de: 0, es: 0, fr: 0, it: 0 };

Object.entries(data).forEach(([key, translations]) => {
  const english = translations.en || translations.source || '';

  langs.forEach(lang => {
    if ((!translations[lang] || translations[lang] === null || translations[lang].trim() === '') && english) {
      // For non-English languages, use English as fallback
      // This ensures the app works even if translations are incomplete
      translations[lang] = english;
      filled[lang]++;
    }
  });
});

fs.writeFileSync(SOURCE, JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ Filled missing translations with English fallback:\n');
langs.forEach(lang => {
  console.log(`   ${lang.toUpperCase()}: ${filled[lang]} filled`);
});
console.log(`\n💡 Note: These are temporary English fallbacks.`);
console.log(`   The app will work, but translations can be improved later.`);
console.log(`\n📊 Total keys: ${Object.keys(data).length}`);
