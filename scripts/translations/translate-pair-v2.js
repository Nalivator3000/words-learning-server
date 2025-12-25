#!/usr/bin/env node
/**
 * Universal translation script for any language pair (v2)
 * Handles the complex table naming scheme
 * Usage: node translate-pair-v2.js <source_lang> <target_lang>
 */

const { Pool } = require('pg');
const https = require('https');
const path = require('path');

// Load .env from project root (two levels up from this script)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 60000
});

// Retry logic for database queries
async function queryWithRetry(query, params, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await db.query(query, params);
        } catch (error) {
            const isRetryableError = error.code === 'ECONNRESET' ||
                                    error.code === 'ECONNREFUSED' ||
                                    error.code === 'ETIMEDOUT' ||
                                    error.message?.includes('Connection terminated') ||
                                    error.message?.includes('read ECONNRESET');

            if (attempt === maxRetries || !isRetryableError) {
                throw error;
            }
            const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
            console.log(`⚠️  Connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Language code mapping
const LANG_CODES = {
    'german': 'de', 'english': 'en', 'spanish': 'es', 'french': 'fr',
    'russian': 'ru', 'italian': 'it', 'polish': 'pl', 'portuguese': 'pt',
    'romanian': 'ro', 'serbian': 'sr', 'turkish': 'tr', 'ukrainian': 'uk',
    'arabic': 'ar', 'swahili': 'sw', 'chinese': 'zh', 'hindi': 'hi',
    'japanese': 'ja', 'korean': 'ko'
};

const FLAGS = {
    'de': '🇩🇪', 'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷',
    'ru': '🇷🇺', 'it': '🇮🇹', 'pl': '🇵🇱', 'pt': '🇵🇹',
    'ro': '🇷🇴', 'sr': '🇷🇸', 'tr': '🇹🇷', 'uk': '🇺🇦',
    'ar': '🇸🇦', 'sw': '🇰🇪', 'zh': '🇨🇳', 'hi': '🇮🇳',
    'ja': '🇯🇵', 'ko': '🇰🇷'
};

// Get the correct translation table name based on source and target languages
function getTranslationTableName(sourceLang, targetLang) {
    if (sourceLang === 'german') {
        return `target_translations_${targetLang}`;
    } else if (sourceLang === 'english') {
        return `target_translations_${targetLang}_from_en`;
    } else if (sourceLang === 'spanish') {
        return `target_translations_${targetLang}_from_es`;
    } else if (sourceLang === 'french') {
        return `target_translations_${targetLang}_from_fr`;
    } else if (sourceLang === 'chinese') {
        return `target_translations_${targetLang}_from_zh`;
    } else if (sourceLang === 'portuguese') {
        return `target_translations_${targetLang}_from_pt`;
    } else if (sourceLang === 'italian') {
        return `target_translations_${targetLang}_from_it`;
    } else if (sourceLang === 'arabic') {
        return `target_translations_${targetLang}_from_ar`;
    } else if (sourceLang === 'turkish') {
        return `target_translations_${targetLang}_from_tr`;
    } else if (sourceLang === 'russian') {
        return `target_translations_${targetLang}_from_ru`;
    } else if (sourceLang === 'polish') {
        return `target_translations_${targetLang}_from_pl`;
    } else if (sourceLang === 'romanian') {
        return `target_translations_${targetLang}_from_ro`;
    } else if (sourceLang === 'serbian') {
        return `target_translations_${targetLang}_from_sr`;
    } else if (sourceLang === 'ukrainian') {
        return `target_translations_${targetLang}_from_uk`;
    } else if (sourceLang === 'swahili') {
        return `target_translations_${targetLang}_from_sw`;
    } else if (sourceLang === 'hindi') {
        return `target_translations_${targetLang}_from_hi`;
    } else if (sourceLang === 'japanese') {
        return `target_translations_${targetLang}_from_ja`;
    } else if (sourceLang === 'korean') {
        return `target_translations_${targetLang}_from_ko`;
    } else {
        throw new Error(`Unsupported source language: ${sourceLang}`);
    }
}

// Translate using Google Translate API
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateLanguagePair(sourceLangName, targetLangName) {
    try {
        const sourceLang = sourceLangName.toLowerCase();
        const targetLang = targetLangName.toLowerCase();

        if (!LANG_CODES[sourceLang] || !LANG_CODES[targetLang]) {
            throw new Error(`Unknown language: ${sourceLang} or ${targetLang}`);
        }

        const sourceCode = LANG_CODES[sourceLang];
        const targetCode = LANG_CODES[targetLang];
        const sourceFlag = FLAGS[sourceCode];
        const targetFlag = FLAGS[targetCode];
        const translationTable = getTranslationTableName(sourceLang, targetLang);

        console.log(`${sourceFlag}→${targetFlag} Starting ${sourceLang} to ${targetLang} translation...\n`);
        console.log(`📋 Using table: ${translationTable}\n`);

        // Check if translation table exists, if not create it
        const tableExists = await queryWithRetry(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = $1
            )
        `, [translationTable]);

        if (!tableExists.rows[0].exists) {
            console.log(`📝 Creating table ${translationTable}...`);

            const exampleColumn = `example_${targetCode}`;
            await queryWithRetry(`
                CREATE TABLE ${translationTable} (
                    id SERIAL PRIMARY KEY,
                    source_lang VARCHAR(2) DEFAULT $1,
                    source_word_id INTEGER NOT NULL,
                    translation VARCHAR(255) NOT NULL,
                    ${exampleColumn} TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(source_word_id)
                )
            `, [sourceCode]);
            console.log(`✅ Table created\n`);
        }

        // Get all source words that need translation
        const result = await queryWithRetry(`
            SELECT sw.id, sw.word, sw.level
            FROM source_words_${sourceLang} sw
            LEFT JOIN ${translationTable} tt ON sw.id = tt.source_word_id
            WHERE tt.id IS NULL
            ORDER BY sw.id
        `);

        const wordsToTranslate = result.rows;
        console.log(`📝 Found ${wordsToTranslate.length} words to translate\n`);

        if (wordsToTranslate.length === 0) {
            console.log(`✅ All ${sourceLang} words already translated to ${targetLang}!\n`);
            return;
        }

        let translated = 0;
        let failed = 0;
        const startTime = Date.now();

        for (const row of wordsToTranslate) {
            try {
                const translation = await translateWithGoogleAPI(row.word, sourceCode, targetCode);

                if (translation) {
                    // Check if table has source_lang column
                    const hasSourceLang = await queryWithRetry(`
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = $1 AND column_name = 'source_lang'
                    `, [translationTable]);

                    if (hasSourceLang.rows.length > 0) {
                        await queryWithRetry(`
                            INSERT INTO ${translationTable} (source_word_id, translation, source_lang)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (source_word_id) DO UPDATE
                            SET translation = EXCLUDED.translation
                        `, [row.id, translation, sourceCode]);
                    } else {
                        await queryWithRetry(`
                            INSERT INTO ${translationTable} (source_word_id, translation)
                            VALUES ($1, $2)
                            ON CONFLICT (source_word_id) DO UPDATE
                            SET translation = EXCLUDED.translation
                        `, [row.id, translation]);
                    }

                    translated++;

                    if (translated % 100 === 0) {
                        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                        const remaining = wordsToTranslate.length - translated;
                        const rate = translated / elapsed;
                        const eta = (remaining / rate).toFixed(1);
                        console.log(`   ✅ ${translated}/${wordsToTranslate.length} (${elapsed}m, ~${eta}m left)`);
                    }
                } else {
                    failed++;
                }

                await sleep(100);

            } catch (error) {
                failed++;
                console.error(`   ❌ "${row.word}":`, error.message);
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log('\n' + '='.repeat(70));
        console.log(`✅ ${sourceLang.toUpperCase()}→${targetLang.toUpperCase()} COMPLETED`);
        console.log('='.repeat(70));
        console.log(`✅ Translated: ${translated} words`);
        console.log(`❌ Failed: ${failed} words`);
        console.log(`⏱️  Time: ${totalTime} minutes`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Translation failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Usage: node translate-pair-v2.js <source_lang> <target_lang>');
    process.exit(1);
}

translateLanguagePair(args[0], args[1]).catch(err => {
    console.error(err);
    process.exit(1);
});
