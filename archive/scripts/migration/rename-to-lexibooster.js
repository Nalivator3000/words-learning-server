import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

let updated = 0;

// Replace all occurrences of "German Words Learning" with "LexiBooster"
Object.entries(data).forEach(([key, translations]) => {
  let changed = false;

  Object.keys(translations).forEach(lang => {
    if (translations[lang] && typeof translations[lang] === 'string') {
      const original = translations[lang];
      const updated_text = original.replace(/German Words Learning/gi, 'LexiBooster');

      if (original !== updated_text) {
        translations[lang] = updated_text;
        changed = true;
        console.log(`✅ ${key}.${lang}: "${original}" → "${updated_text}"`);
      }
    }
  });

  if (changed) {
    updated++;
  }
});

fs.writeFileSync(SOURCE, JSON.stringify(data, null, 2), 'utf-8');

console.log(`\n✅ Updated ${updated} translation keys`);
console.log(`📊 Total keys: ${Object.keys(data).length}`);
