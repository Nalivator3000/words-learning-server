import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

// Find keys with missing Russian translations (most critical)
const missingRu = [];
Object.entries(data).forEach(([key, translations]) => {
  if (!translations.ru || translations.ru === null || translations.ru.trim() === '') {
    missingRu.push({ key, source: translations.source || translations.en });
  }
});

console.log('🔍 Keys with missing Russian translations:\n');
missingRu.slice(0, 30).forEach(({ key, source }) => {
  console.log(`   ${key}`);
  console.log(`      Source: "${source}"\n`);
});
console.log(`\n📊 Total missing RU: ${missingRu.length}/${Object.keys(data).length}`);
