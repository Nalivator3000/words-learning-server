#!/usr/bin/env node
/**
 * Translate Hindi words to English
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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

async function translateHindiToEnglish() {
    try {
        console.log('🇮🇳→🇬🇧 Starting Hindi to English translation...\n');

        // Get all Hindi words that need English translation
        const result = await db.query(`
            SELECT sw.id, sw.word, sw.level, sw.theme
            FROM source_words_hindi sw
            LEFT JOIN target_translations_english_from_hi tt
                ON sw.id = tt.source_word_id
            WHERE tt.id IS NULL
            ORDER BY sw.id
        `);

        const wordsToTranslate = result.rows;
        console.log(`📝 Found ${wordsToTranslate.length} Hindi words to translate to English\n`);

        if (wordsToTranslate.length === 0) {
            console.log(`✅ All Hindi words already translated to English!\n`);
            return;
        }

        let translated = 0;
        let failed = 0;
        const startTime = Date.now();

        for (const row of wordsToTranslate) {
            try {
                // Translate Hindi word to English
                const translation = await translateWithGoogleAPI(row.word, 'hi', 'en');

                if (translation) {
                    // Insert translation
                    await db.query(`
                        INSERT INTO target_translations_english_from_hi
                        (source_lang, source_word_id, translation, example_en, example_native)
                        VALUES ('hi', $1, $2, NULL, NULL)
                        ON CONFLICT (source_word_id) DO UPDATE
                        SET translation = EXCLUDED.translation
                    `, [row.id, translation]);

                    translated++;

                    // Progress report every 50 words
                    if (translated % 50 === 0) {
                        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                        const remaining = wordsToTranslate.length - translated;
                        const rate = translated / (elapsed || 0.1);
                        const eta = (remaining / rate).toFixed(1);

                        console.log(`   ✅ ${translated}/${wordsToTranslate.length} words translated (${elapsed}m elapsed, ~${eta}m remaining)`);
                        console.log(`      Latest: ${row.word} → ${translation}`);
                    }
                } else {
                    failed++;
                    console.error(`   ⚠️  Failed to translate: "${row.word}"`);
                }

                // Rate limiting: 150ms between requests to be safe
                await sleep(150);

            } catch (error) {
                failed++;
                console.error(`   ❌ Error translating "${row.word}":`, error.message);
                // Wait longer on error
                await sleep(500);
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log('\n' + '═'.repeat(80));
        console.log('TRANSLATION COMPLETE');
        console.log('═'.repeat(80));
        console.log(`✅ Translated: ${translated} words`);
        console.log(`❌ Failed: ${failed} words`);
        console.log(`⏱️  Total time: ${totalTime} minutes`);
        console.log('═'.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

translateHindiToEnglish();
