const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/translations/source-texts.json', 'utf8'));

// Define all languages
const allLanguages = ['en', 'ru', 'de', 'pl', 'ar', 'tr', 'ro', 'sr', 'uk', 'it', 'es', 'pt', 'sw', 'fr'];

// Count translations for each language
const counts = {};
const missingKeys = {};

allLanguages.forEach(lang => {
  counts[lang] = 0;
  missingKeys[lang] = [];
});

const totalKeys = Object.keys(data).length;

Object.keys(data).forEach(key => {
  allLanguages.forEach(lang => {
    if (data[key][lang]) {
      counts[lang]++;
    } else {
      missingKeys[lang].push(key);
    }
  });
});

console.log('=== TRANSLATION COMPLETENESS REPORT ===\n');
console.log(`Total keys in source-texts.json: ${totalKeys}\n`);

console.log('Translation counts by language:');
console.log('--------------------------------');
allLanguages.forEach(lang => {
  const percentage = ((counts[lang] / totalKeys) * 100).toFixed(1);
  const status = counts[lang] === totalKeys ? '✓ COMPLETE' : '✗ INCOMPLETE';
  console.log(`${lang.toUpperCase()}: ${counts[lang]}/${totalKeys} (${percentage}%) ${status}`);
});

console.log('\n=== MISSING TRANSLATIONS ===');
let hasMissing = false;
allLanguages.forEach(lang => {
  if (missingKeys[lang].length > 0) {
    hasMissing = true;
    console.log(`\n${lang.toUpperCase()} (${missingKeys[lang].length} missing):`);
    missingKeys[lang].forEach(key => console.log(`  - ${key}`));
  }
});

if (!hasMissing) {
  console.log('\nNo missing translations! All languages are at 100% completion.');
}

console.log('\n=== SUMMARY ===');
const completedLanguages = allLanguages.filter(lang => counts[lang] === totalKeys);
console.log(`Completed languages (${completedLanguages.length}/${allLanguages.length}): ${completedLanguages.join(', ')}`);

if (completedLanguages.length === allLanguages.length) {
  console.log('\n🎉 SUCCESS! All 14 languages have 100% translation coverage!');
} else {
  const incompleteLanguages = allLanguages.filter(lang => counts[lang] < totalKeys);
  console.log(`\nIncomplete languages (${incompleteLanguages.length}): ${incompleteLanguages.join(', ')}`);
}
