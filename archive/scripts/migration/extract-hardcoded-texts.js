/**
 * extract-hardcoded-texts.js
 * Find all hardcoded Russian texts in HTML that need migration to data-i18n
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_FILE = path.join(__dirname, '../public/index.html');
const TRANSLATIONS_FILE = path.join(__dirname, '../translations/source-texts.json');

console.log('🔍 Finding hardcoded Russian texts in HTML...\n');

// Read files
const html = fs.readFileSync(HTML_FILE, 'utf-8');
const translations = JSON.parse(fs.readFileSync(TRANSLATIONS_FILE, 'utf-8'));

// Find all Russian text in HTML (excluding comments and already migrated)
const cyrillicPattern = />[^<]*[А-Яа-яЁё][^<]*</g;
const matches = html.match(cyrillicPattern) || [];

// Filter out texts that already have data-i18n
const hardcodedTexts = [];
const lines = html.split('\n');

lines.forEach((line, index) => {
    // Skip if line already has data-i18n
    if (line.includes('data-i18n')) return;

    // Find cyrillic text in this line
    const cyrillicMatch = line.match(/[А-Яа-яЁё][^<>]*/g);
    if (cyrillicMatch) {
        cyrillicMatch.forEach(text => {
            const cleanText = text.trim();
            if (cleanText.length > 1 && !cleanText.match(/^[А-Яа-яЁё]$/)) {
                hardcodedTexts.push({
                    line: index + 1,
                    text: cleanText,
                    context: line.trim().substring(0, 100)
                });
            }
        });
    }
});

console.log(`📊 Found ${hardcodedTexts.length} hardcoded Russian texts:\n`);

// Check if translations exist
hardcodedTexts.forEach((item, i) => {
    const existingKey = Object.entries(translations).find(([key, trans]) =>
        trans.ru === item.text || trans.source === item.text
    );

    const status = existingKey ? '✅' : '❌';
    const key = existingKey ? existingKey[0] : 'NEEDS_KEY';

    console.log(`${i + 1}. [Line ${item.line}] ${status}`);
    console.log(`   Text: "${item.text}"`);
    console.log(`   Key: ${key}`);
    console.log(`   Context: ${item.context}`);
    console.log('');
});

console.log(`\n📈 Summary:`);
console.log(`   Total hardcoded: ${hardcodedTexts.length}`);
console.log(`   With translations: ${hardcodedTexts.filter(item =>
    Object.values(translations).some(t => t.ru === item.text || t.source === item.text)
).length}`);
console.log(`   Need new keys: ${hardcodedTexts.filter(item =>
    !Object.values(translations).some(t => t.ru === item.text || t.source === item.text)
).length}`);
