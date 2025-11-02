import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCE_FILE = path.join(__dirname, '../translations/source-texts.json');
const JS_FILE = path.join(__dirname, '../translations/js-strings.json');
const sourceTranslations = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
const jsStrings = JSON.parse(fs.readFileSync(JS_FILE, 'utf-8'));
let added = 0;
for (const [key, translations] of Object.entries(jsStrings)) {
    if (!sourceTranslations[key]) {
        sourceTranslations[key] = translations;
        added++;
    }
}
fs.writeFileSync(SOURCE_FILE, JSON.stringify(sourceTranslations, null, 2), 'utf-8');
console.log('✅ Added ' + added + ' JS string keys');
