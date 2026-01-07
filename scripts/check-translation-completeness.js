const fs = require('fs');
const path = require('path');

// Languages to check
const languages = [
  'ru', 'en', 'de', 'es', 'fr', 'it', 'pl', 'ar', 'tr', 'ro', 'sr', 'uk', 'pt', 'sw'
];

// Read the source-texts.json file
const filePath = path.join(__dirname, '..', 'public', 'translations', 'source-texts.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Get all translation keys (top-level keys in the JSON)
const allKeys = Object.keys(data);
const totalKeys = allKeys.length;

console.log('='.repeat(80));
console.log('TRANSLATION COMPLETENESS REPORT');
console.log('='.repeat(80));
console.log(`Total number of translation keys: ${totalKeys}`);
console.log('='.repeat(80));
console.log();

// Check each language
const languageStats = {};
const missingTranslations = {};

languages.forEach(lang => {
  const missingKeys = [];

  allKeys.forEach(key => {
    const translations = data[key];
    // Check if the language exists and has a non-empty value
    if (!translations.hasOwnProperty(lang) ||
        translations[lang] === '' ||
        translations[lang] === null ||
        translations[lang] === undefined) {
      missingKeys.push(key);
    }
  });

  languageStats[lang] = {
    total: totalKeys,
    completed: totalKeys - missingKeys.length,
    missing: missingKeys.length,
    percentage: ((totalKeys - missingKeys.length) / totalKeys * 100).toFixed(2)
  };

  if (missingKeys.length > 0) {
    missingTranslations[lang] = missingKeys;
  }
});

// Print summary for each language
console.log('SUMMARY BY LANGUAGE:');
console.log('-'.repeat(80));

languages.forEach(lang => {
  const stats = languageStats[lang];
  const status = stats.missing === 0 ? '✓ COMPLETE' : `✗ INCOMPLETE`;
  const missingText = stats.missing > 0 ? ` (${stats.missing} missing)` : '';
  console.log(`${lang.toUpperCase().padEnd(4)} | ${stats.completed.toString().padStart(4)}/${stats.total} (${stats.percentage.padStart(6)}%) | ${status}${missingText}`);
});

console.log();
console.log('='.repeat(80));

// Print missing keys for each language with issues
if (Object.keys(missingTranslations).length > 0) {
  console.log();
  console.log('MISSING TRANSLATIONS BY LANGUAGE:');
  console.log('='.repeat(80));

  Object.keys(missingTranslations).sort().forEach(lang => {
    console.log();
    console.log(`${lang.toUpperCase()} - Missing ${missingTranslations[lang].length} keys:`);
    console.log('-'.repeat(80));
    missingTranslations[lang].forEach((key, index) => {
      console.log(`  ${(index + 1).toString().padStart(3)}. ${key}`);
    });
  });
  console.log();
  console.log('='.repeat(80));
} else {
  console.log();
  console.log('✓ ALL LANGUAGES ARE COMPLETE!');
  console.log('='.repeat(80));
}

// Create a detailed report file
const report = {
  timestamp: new Date().toISOString(),
  totalKeys: totalKeys,
  languages: languageStats,
  missingTranslations: missingTranslations,
  allKeys: allKeys
};

const reportPath = path.join(__dirname, '..', 'translation-completeness-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log();
console.log(`Detailed report saved to: ${reportPath}`);
console.log('='.repeat(80));
