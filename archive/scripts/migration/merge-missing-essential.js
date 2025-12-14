import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const ESSENTIAL = path.join(__dirname, '../translations/essential-ui-keys.json');

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));
const essential = JSON.parse(fs.readFileSync(ESSENTIAL, 'utf-8'));

let added = 0;

Object.entries(essential).forEach(([key, translations]) => {
  if (!source[key]) {
    source[key] = translations;
    added++;
    console.log(`✅ Added: ${key}`);
  }
});

fs.writeFileSync(SOURCE, JSON.stringify(source, null, 2), 'utf-8');
console.log(`\n✅ Added ${added} keys from essential-ui-keys.json`);
console.log(`📊 Total keys now: ${Object.keys(source).length}`);
