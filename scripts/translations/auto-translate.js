/**
 * Auto-translate script
 * Automatically translates all texts in translations/source-texts.json
 * Uses free Google Translate API (no API key required)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target languages (excluding source language)
const TARGET_LANGUAGES = ['de', 'es', 'fr', 'it'];

// Free translation using simple HTTP fetch (no API key)
async function translateText(text, targetLang, sourceLang = 'auto') {
    try {
        // Use MyMemory Translation API (free, no API key)
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        }

        console.warn(`⚠️  Translation failed for: "${text}" -> ${targetLang}`);
        return null;
    } catch (error) {
        console.error(`❌ Translation error: ${error.message}`);
        return null;
    }
}

// Add delay to avoid rate limiting
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoTranslate() {
    console.log('🌍 Starting auto-translation...\n');

    // Read source translations
    const translationsPath = path.join(__dirname, '..', 'translations', 'source-texts.json');

    if (!fs.existsSync(translationsPath)) {
        console.error('❌ Error: translations/source-texts.json not found!');
        console.log('💡 Run: node scripts/extract-translations.js first');
        process.exit(1);
    }

    const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));
    const keys = Object.keys(translations);

    console.log(`📊 Found ${keys.length} translation keys\n`);

    let translatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each key
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const entry = translations[key];

        // Determine source language and text
        let sourceLang = 'en';
        let sourceText = entry.en;

        if (!sourceText && entry.ru) {
            sourceLang = 'ru';
            sourceText = entry.ru;
        }

        if (!sourceText) {
            console.log(`⏭️  Skipping ${key}: no source text`);
            skippedCount++;
            continue;
        }

        console.log(`[${i + 1}/${keys.length}] Translating: "${sourceText.substring(0, 50)}${sourceText.length > 50 ? '...' : ''}"`);

        // Fill missing English translation if source is Russian
        if (sourceLang === 'ru' && !entry.en) {
            await delay(500); // Rate limiting
            const translated = await translateText(sourceText, 'en', 'ru');
            if (translated) {
                entry.en = translated;
                translatedCount++;
                console.log(`  ✅ en: ${translated.substring(0, 50)}${translated.length > 50 ? '...' : ''}`);
            } else {
                errorCount++;
            }
        }

        // Fill missing Russian translation if source is English
        if (sourceLang === 'en' && !entry.ru) {
            await delay(500); // Rate limiting
            const translated = await translateText(sourceText, 'ru', 'en');
            if (translated) {
                entry.ru = translated;
                translatedCount++;
                console.log(`  ✅ ru: ${translated.substring(0, 50)}${translated.length > 50 ? '...' : ''}`);
            } else {
                errorCount++;
            }
        }

        // Translate to other languages
        for (const targetLang of TARGET_LANGUAGES) {
            if (!entry[targetLang]) {
                await delay(500); // Rate limiting
                const translated = await translateText(sourceText, targetLang, sourceLang);

                if (translated) {
                    entry[targetLang] = translated;
                    translatedCount++;
                    console.log(`  ✅ ${targetLang}: ${translated.substring(0, 50)}${translated.length > 50 ? '...' : ''}`);
                } else {
                    errorCount++;
                }
            }
        }

        console.log(''); // Empty line for readability
    }

    // Save updated translations
    fs.writeFileSync(
        translationsPath,
        JSON.stringify(translations, null, 2),
        'utf-8'
    );

    console.log('\n✅ Auto-translation complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total keys: ${keys.length}`);
    console.log(`   Translations added: ${translatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`\n💾 Saved to: ${translationsPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review translations in translations/source-texts.json');
    console.log('   2. Create public/i18n.js translation manager');
    console.log('   3. Update HTML files to use data-i18n attributes');
    console.log('   4. Update JS files to use i18n.t() method');
}

// Run auto-translation
autoTranslate().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
