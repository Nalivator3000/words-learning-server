const fs = require('fs');
const path = require('path');

// Read source-texts.json
const translationsPath = path.join(__dirname, '../public/translations/source-texts.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
const existingKeys = Object.keys(translations);

// Read index.html and extract all data-i18n keys
const indexPath = path.join(__dirname, '../public/index.html');
const indexHTML = fs.readFileSync(indexPath, 'utf8');

const i18nRegex = /data-i18n="([^"]+)"/g;
const htmlKeys = [];
let match;

while ((match = i18nRegex.exec(indexHTML)) !== null) {
    if (!htmlKeys.includes(match[1])) {
        htmlKeys.push(match[1]);
    }
}

// Find missing keys
const missingKeys = htmlKeys.filter(key => !existingKeys.includes(key));

console.log(`\n📊 Translation Keys Report:`);
console.log(`==========================`);
console.log(`Total keys in HTML: ${htmlKeys.length}`);
console.log(`Existing translations: ${existingKeys.length}`);
console.log(`Missing translations: ${missingKeys.length}\n`);

if (missingKeys.length > 0) {
    console.log(`❌ Missing translation keys:\n`);
    missingKeys.sort().forEach((key, i) => {
        console.log(`${i + 1}. ${key}`);
    });

    console.log(`\n💡 Suggested translations to add:`);
    console.log(`=====================================\n`);

    missingKeys.forEach(key => {
        // Generate reasonable English translation from key
        const englishText = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        console.log(`  "${key}": {`);
        console.log(`    "en": "${englishText}",`);
        console.log(`    "ru": "${englishText}",`);
        console.log(`    "de": "${englishText}",`);
        console.log(`    "es": "${englishText}",`);
        console.log(`    "fr": "${englishText}",`);
        console.log(`    "it": "${englishText}"`);
        console.log(`  },`);
    });
} else {
    console.log(`✅ All translation keys are present!`);
}
