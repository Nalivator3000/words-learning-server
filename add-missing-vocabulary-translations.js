const fs = require('fs');
const path = require('path');

// Read the current translations file
const translationsPath = path.join(__dirname, 'public', 'translations', 'source-texts.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Define the pattern for Essential Vocabulary in all languages
const essentialVocabPatterns = {
  en: "Essential Vocabulary",
  ru: "Базовая лексика",
  de: "Grundwortschatz",
  es: "Vocabulario esencial",
  fr: "Vocabulaire essentiel",
  it: "Vocabolario essenziale",
  uk: "Базова лексика",
  pt: "Vocabulário essencial",
  pl: "Podstawowe słownictwo",
  ar: "المفردات الأساسية",
  tr: "Temel Kelime Bilgisi",
  zh: "基础词汇",
  ja: "基本語彙",
  ko: "필수 어휘",
  hi: "आवश्यक शब्दावली",
  sw: "Msamiati Muhimu"
};

// Generate entries for numbers 11 through 50 (to be safe)
console.log('Adding missing Essential Vocabulary translations...');

let addedCount = 0;
for (let i = 11; i <= 50; i++) {
  const key = `topic_essential_vocabulary_${i}`;

  // Skip if already exists
  if (translations[key]) {
    console.log(`  ✓ ${key} already exists, skipping`);
    continue;
  }

  // Create the translation object
  translations[key] = {};
  for (const [lang, pattern] of Object.entries(essentialVocabPatterns)) {
    translations[key][lang] = `${pattern} ${i}`;
  }

  addedCount++;
  console.log(`  + Added ${key}`);
}

// Write back to file with pretty formatting
fs.writeFileSync(translationsPath, JSON.stringify(translations, null, 2), 'utf8');

console.log(`\n✅ Successfully added ${addedCount} new translation entries!`);
console.log(`📝 Updated file: ${translationsPath}`);
