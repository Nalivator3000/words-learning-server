import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const NEW = path.join(__dirname, '../translations/remaining-html-keys.json');

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));
const newKeys = JSON.parse(fs.readFileSync(NEW, 'utf-8'));

let added = 0;

for (const [key, translations] of Object.entries(newKeys)) {
    if (!source[key]) {
        source[key] = translations;
        added++;
    }
}

fs.writeFileSync(SOURCE, JSON.stringify(source, null, 2), 'utf-8');
console.log(`✅ Added ${added} keys. Total: ${Object.keys(source).length}`);
