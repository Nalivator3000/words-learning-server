const fs = require('fs');

// Load source texts
const sourceTexts = JSON.parse(fs.readFileSync('public/translations/source-texts.json', 'utf8'));

// Load used keys
const usedKeys = fs.readFileSync('temp_all_i18n_keys.txt', 'utf8')
    .split('\n')
    .filter(k => k.trim());

const missingKeys = [];
const existingKeys = [];

usedKeys.forEach(key => {
    if (!sourceTexts[key]) {
        missingKeys.push(key);
    } else {
        existingKeys.push(key);
    }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 i18n TRANSLATION KEYS ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('=== SUMMARY ===');
console.log('Total keys used in app:', usedKeys.length);
console.log('✅ Existing keys:', existingKeys.length);
console.log('❌ Missing keys:', missingKeys.length);

if (missingKeys.length > 0) {
    console.log('\n=== MISSING KEYS (' + missingKeys.length + ') ===');
    missingKeys.forEach(k => console.log('  ❌', k));
}

// Check for incomplete translations
console.log('\n=== CHECKING INCOMPLETE TRANSLATIONS ===');
const languages = ['en', 'ru', 'de', 'es', 'fr', 'it'];
const incompleteKeys = [];

existingKeys.forEach(key => {
    const translations = sourceTexts[key];
    if (!translations) return;

    const missing = languages.filter(lang => !translations[lang] || translations[lang].trim() === '');
    if (missing.length > 0) {
        incompleteKeys.push({ key, missing });
    }
});

if (incompleteKeys.length > 0) {
    console.log('⚠️  Keys with incomplete translations:', incompleteKeys.length);
    incompleteKeys.slice(0, 20).forEach(item => {
        console.log('   ', item.key, '→ missing:', item.missing.join(', '));
    });
    if (incompleteKeys.length > 20) {
        console.log('   ... and', incompleteKeys.length - 20, 'more');
    }
} else {
    console.log('✅ All existing keys have complete translations for:', languages.join(', '));
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
