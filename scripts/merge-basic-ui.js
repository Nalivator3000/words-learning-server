import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const BASIC = path.join(__dirname, '../translations/basic-ui-keys.json');

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));
const basic = JSON.parse(fs.readFileSync(BASIC, 'utf-8'));

let added = 0;

Object.entries(basic).forEach(([key, translations]) => {
  if (!source[key]) {
    source[key] = translations;
    added++;
  }
});

fs.writeFileSync(SOURCE, JSON.stringify(source, null, 2), 'utf-8');
console.log(`✅ Added ${added} basic UI keys`);
console.log(`📊 Total keys now: ${Object.keys(source).length}`);
