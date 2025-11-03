import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

let updated = {
  en: 0,
  ru: 0
};

Object.entries(data).forEach(([key, translations]) => {
  const source = translations.source;

  // If English is missing and source exists, use source as English
  if ((!translations.en || translations.en === null || translations.en.trim() === '') && source) {
    translations.en = source;
    updated.en++;
  }

  // If Russian is missing but English exists, mark it (we'll need manual translation)
  if ((!translations.ru || translations.ru === null || translations.ru.trim() === '')) {
    // Try to auto-detect if source is already Russian
    const hasRussian = /[а-яА-ЯёЁ]/.test(source);
    if (hasRussian) {
      translations.ru = source;
      updated.ru++;
    }
  }
});

fs.writeFileSync(SOURCE, JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ Filled translations from source:');
console.log(`   EN: ${updated.en} filled`);
console.log(`   RU: ${updated.ru} filled (from Russian source)`);
console.log(`\n📊 Total keys: ${Object.keys(data).length}`);
