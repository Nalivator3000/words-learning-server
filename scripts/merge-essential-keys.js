/**
 * merge-essential-keys.js
 * Merge essential UI keys into source-texts.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, '../translations/source-texts.json');
const ESSENTIAL_FILE = path.join(__dirname, '../translations/essential-ui-keys.json');

console.log('🔀 Merging essential UI keys into source-texts.json...\n');

// Read both files
const sourceTranslations = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
const essentialKeys = JSON.parse(fs.readFileSync(ESSENTIAL_FILE, 'utf-8'));

// Merge
let added = 0;
let updated = 0;

for (const [key, translations] of Object.entries(essentialKeys)) {
    if (sourceTranslations[key]) {
        // Update existing
        sourceTranslations[key] = translations;
        updated++;
        console.log(`✏️  Updated: ${key}`);
    } else {
        // Add new
        sourceTranslations[key] = translations;
        added++;
        console.log(`✅ Added: ${key}`);
    }
}

// Save
fs.writeFileSync(SOURCE_FILE, JSON.stringify(sourceTranslations, null, 2), 'utf-8');

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added} keys`);
console.log(`   Updated: ${updated} keys`);
console.log(`   Total keys in source: ${Object.keys(sourceTranslations).length}`);
console.log(`\n✅ Merged successfully!`);
