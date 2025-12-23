const fs = require('fs');
const data = JSON.parse(fs.readFileSync('translations/source-texts.json', 'utf8'));

const languages = ['en', 'ru', 'de', 'es', 'fr', 'it'];
const languageNames = {
  en: 'English',
  ru: 'Russian (Русский)',
  de: 'German (Deutsch)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  it: 'Italian (Italiano)'
};

// Create a file for each language
for (const lang of languages) {
  let content = '# ' + languageNames[lang] + ' UI Translations\n\n';
  content += 'Generated: ' + new Date().toISOString() + '\n\n';
  content += '## All Interface Elements\n\n';
  content += '| # | Key | Translation |\n';
  content += '|---|-----|-------------|\n';

  let index = 1;
  for (const [key, translations] of Object.entries(data)) {
    const translation = translations[lang] || '[MISSING]';
    // Skip empty keys
    if (!key || key.trim() === '') continue;
    content += `| ${index} | ${key} | ${translation} |\n`;
    index++;
  }

  content += `\n\n## Statistics\n\n`;
  content += `- Total keys: ${index - 1}\n`;
  content += `- Language: ${languageNames[lang]}\n`;

  fs.writeFileSync(`translations/ui-elements-${lang}.md`, content);
  console.log(`Created ui-elements-${lang}.md (${index - 1} entries)`);
}

console.log('\nAll files created in translations/ directory');
