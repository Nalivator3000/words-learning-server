/**
 * Check which interface languages are supported
 */

const fs = require('fs');

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║       ЯЗЫКИ ИНТЕРФЕЙСА                                       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Read i18n.js to find supported languages
const i18nCode = fs.readFileSync('public/i18n.js', 'utf8');
const match = i18nCode.match(/\['ru', 'en', [^\]]+\]/);

if (match) {
  console.log('Языки из public/i18n.js:\n');
  const langs = match[0]
    .replace(/[\[\]']/g, '')
    .split(',')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  langs.forEach((lang, idx) => {
    console.log(`  ${(idx + 1).toString().padStart(2)}. ${lang}`);
  });

  console.log(`\nВсего языков интерфейса: ${langs.length}\n`);
}

// Try to read source-texts.json
try {
  const data = JSON.parse(fs.readFileSync('public/translations/source-texts.json', 'utf8'));
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const translationLangs = Object.keys(data[firstKey]).filter(k => k !== 'source');

    console.log('═'.repeat(65));
    console.log('\nЯзыки в source-texts.json:\n');
    translationLangs.sort().forEach((lang, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${lang}`);
    });
    console.log(`\nВсего языков в переводах: ${translationLangs.length}\n`);
  }
} catch (error) {
  console.log('\n⚠️  Не удалось прочитать source-texts.json:', error.message, '\n');
}
