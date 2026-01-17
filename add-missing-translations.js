const fs = require('fs');

// Load source texts
const sourceTexts = JSON.parse(fs.readFileSync('public/translations/source-texts.json', 'utf8'));

// Load missing translations
const missingTranslations = JSON.parse(fs.readFileSync('missing-translations.json', 'utf8'));

// Merge translations
const merged = { ...sourceTexts, ...missingTranslations };

// Write back to source-texts.json
fs.writeFileSync(
    'public/translations/source-texts.json',
    JSON.stringify(merged, null, 2),
    'utf8'
);

console.log('✅ Added', Object.keys(missingTranslations).length, 'missing translations');
console.log('📊 Total translations now:', Object.keys(merged).length);
