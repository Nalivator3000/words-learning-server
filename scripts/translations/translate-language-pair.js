#!/usr/bin/env node
/**
 * Universal translation script for any language pair
 * Usage: node translate-language-pair.js <source_lang> <target_lang>
 * Example: node translate-language-pair.js french russian
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Language code mapping
const LANG_CODES = {
    'german': 'de',
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'russian': 'ru',
    'italian': 'it',
    'polish': 'pl',
    'portuguese': 'pt',
    'romanian': 'ro',
    'serbian': 'sr',
    'turkish': 'tr',
    'ukrainian': 'uk',
    'arabic': 'ar',
    'swahili': 'sw'
};

// Language flags
const FLAGS = {
    'de': '🇩🇪', 'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷',
    'ru': '🇷🇺', 'it': '🇮🇹', 'pl': '🇵🇱', 'pt': '🇵🇹',
    'ro': '🇷🇴', 'sr': '🇷🇸', 'tr': '🇹🇷', 'uk': '🇺🇦',
    'ar': '🇸🇦', 'sw': '🇰🇪'
};

// Translate using Google Translate API (free endpoint)
function translateWithGoogleAPI(text, from, to) {
    return new Promise((resolve, reject) => {
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodedText}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
                        resolve(parsed[0][0][0]);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateLanguagePair(sourceLangName, targetLangName) {
    try {
        const sourceLang = sourceLangName.toLowerCase();
        const targetLang = targetLangName.toLowerCase();

        if (!LANG_CODES[sourceLang]) {
            throw new Error(`Unknown source language: ${sourceLang}`);
        }
        if (!LANG_CODES[targetLang]) {
            throw new Error(`Unknown target language: ${targetLang}`);
        }

        const sourceCode = LANG_CODES[sourceLang];
        const targetCode = LANG_CODES[targetLang];
        const sourceFlag = FLAGS[sourceCode];
        const targetFlag = FLAGS[targetCode];

        console.log(`${sourceFlag}→${targetFlag} Starting ${sourceLang} to ${targetLang} translation...\n`);

        // Get all source words that need translation
        const result = await db.query(`
            SELECT sw.id as word_id, sw.word, sw.level
            FROM source_words_${sourceLang} sw
            LEFT JOIN target_translations_${sourceLang} tt
                ON sw.id = tt.word_id AND tt.target_lang = $1
            WHERE tt.translation_id IS NULL
            ORDER BY sw.id
        `, [targetCode]);

        const wordsToTranslate = result.rows;
        console.log(`📝 Found ${wordsToTranslate.length} ${sourceLang} words to translate to ${targetLang}\n`);

        if (wordsToTranslate.length === 0) {
            console.log(`✅ All ${sourceLang} words already translated to ${targetLang}!\n`);
            return;
        }

        let translated = 0;
        let failed = 0;
        const startTime = Date.now();

        for (const row of wordsToTranslate) {
            try {
                // Translate
                const translation = await translateWithGoogleAPI(row.word, sourceCode, targetCode);

                if (translation) {
                    // Insert translation
                    await db.query(`
                        INSERT INTO target_translations_${sourceLang} (word_id, target_lang, translation)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (word_id, target_lang) DO UPDATE
                        SET translation = EXCLUDED.translation
                    `, [row.word_id, targetCode, translation]);

                    translated++;

                    // Progress report every 100 words
                    if (translated % 100 === 0) {
                        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                        const remaining = wordsToTranslate.length - translated;
                        const rate = translated / elapsed;
                        const eta = (remaining / rate).toFixed(1);

                        console.log(`   ✅ ${translated}/${wordsToTranslate.length} words translated (${elapsed}m elapsed, ~${eta}m remaining)`);
                    }
                } else {
                    failed++;
                    console.error(`   ⚠️  Failed to translate: "${row.word}"`);
                }

                // Rate limiting: 100ms between requests
                await sleep(100);

            } catch (error) {
                failed++;
                console.error(`   ❌ Error translating "${row.word}":`, error.message);
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log('\n' + '='.repeat(70));
        console.log(`✅ ${sourceLang.toUpperCase()}→${targetLang.toUpperCase()} TRANSLATION COMPLETED`);
        console.log('='.repeat(70));
        console.log(`✅ Successfully translated: ${translated} words`);
        console.log(`❌ Failed: ${failed} words`);
        console.log(`⏱️  Total time: ${totalTime} minutes`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Translation failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Usage: node translate-language-pair.js <source_lang> <target_lang>');
    console.error('Example: node translate-language-pair.js french russian');
    console.error('\nAvailable languages:', Object.keys(LANG_CODES).join(', '));
    process.exit(1);
}

translateLanguagePair(args[0], args[1]).catch(err => {
    console.error(err);
    process.exit(1);
});
