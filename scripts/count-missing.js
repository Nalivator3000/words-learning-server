import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

const langs = ['en', 'ru', 'de', 'es', 'fr', 'it'];
const missing = {};
langs.forEach(lang => missing[lang] = 0);

Object.entries(data).forEach(([key, translations]) => {
  langs.forEach(lang => {
    if (!translations[lang] || translations[lang] === null || translations[lang].trim() === '') {
      missing[lang]++;
    }
  });
});

console.log('📊 Missing translations by language:');
langs.forEach(lang => {
  const total = Object.keys(data).length;
  const percent = ((total - missing[lang]) / total * 100).toFixed(1);
  console.log(`   ${lang.toUpperCase()}: ${missing[lang]} missing (${percent}% complete)`);
});
console.log(`\nTotal keys: ${Object.keys(data).length}`);
