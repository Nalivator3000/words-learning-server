/**
 * Add missing topic_general_X translations to source-texts.json
 * Adds translations for General 1, General 2, ... General 108
 */

const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '..', 'public', 'translations', 'source-texts.json');

// Translation templates for "General X" in all supported languages
const generalTranslations = {
  en: (num) => `General ${num}`,
  ru: (num) => `Общее ${num}`,
  de: (num) => `Allgemein ${num}`,
  es: (num) => `General ${num}`,
  fr: (num) => `Général ${num}`,
  it: (num) => `Generale ${num}`,
  uk: (num) => `Загальне ${num}`,
  pt: (num) => `Geral ${num}`,
  pl: (num) => `Ogólny ${num}`,
  ar: (num) => `عام ${num}`,
  tr: (num) => `Genel ${num}`,
  zh: (num) => `一般 ${num}`,
  ja: (num) => `一般 ${num}`,
  ko: (num) => `일반 ${num}`,
  hi: (num) => `सामान्य ${num}`,
  sw: (num) => `Jumla ${num}`,
  ro: (num) => `General ${num}`,
  sr: (num) => `Опште ${num}`
};

async function addGeneralTranslations() {
  try {
    console.log('📖 Reading source-texts.json...');

    // Read the existing translations
    const data = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

    console.log('✅ File loaded successfully');
    console.log(`📊 Current entries: ${Object.keys(data).length}`);

    // Count how many topic_general_X entries already exist
    const existingGeneralKeys = Object.keys(data).filter(key => key.match(/^topic_general_\d+$/));
    console.log(`🔍 Existing topic_general_X entries: ${existingGeneralKeys.length}`);

    let added = 0;

    // Add topic_general_1 through topic_general_108
    for (let i = 1; i <= 108; i++) {
      const key = `topic_general_${i}`;

      if (data[key]) {
        console.log(`⏭️  Skipping ${key} - already exists`);
        continue;
      }

      // Create translation object for this number
      const translations = {};
      for (const [lang, template] of Object.entries(generalTranslations)) {
        translations[lang] = template(i);
      }

      data[key] = translations;
      added++;

      if (i <= 10 || i % 10 === 0) {
        console.log(`✅ Added ${key}: "${translations.en}"`);
      }
    }

    console.log(`\n📝 Writing updated translations...`);

    // Write back to file with proper formatting
    fs.writeFileSync(translationsPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`✨ Successfully added ${added} new translation entries!`);
    console.log(`📊 Total entries now: ${Object.keys(data).length}`);
    console.log(`✅ File saved: ${translationsPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addGeneralTranslations();
