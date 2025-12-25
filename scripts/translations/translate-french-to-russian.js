#!/usr/bin/env node
/**
 * Translate French vocabulary to Russian
 * Creates FR→RU translations for ru→fr language pair
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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

async function translateFrenchToRussian() {
    try {
        console.log('🇫🇷→🇷🇺 Starting French to Russian translation...\n');

        // Get all French words that need translation
        const result = await db.query(`
            SELECT sw.word_id, sw.word, sw.level
            FROM source_words_french sw
            LEFT JOIN target_translations_french tt
                ON sw.word_id = tt.word_id AND tt.target_lang = 'ru'
            WHERE tt.translation_id IS NULL
            ORDER BY sw.word_id
        `);

        const wordsToTranslate = result.rows;
        console.log(`📝 Found ${wordsToTranslate.length} French words to translate to Russian\n`);

        if (wordsToTranslate.length === 0) {
            console.log('✅ All French words already translated to Russian!\n');
            return;
        }

        let translated = 0;
        let failed = 0;
        const startTime = Date.now();

        for (const row of wordsToTranslate) {
            try {
                // Translate French → Russian
                const translation = await translateWithGoogleAPI(row.word, 'fr', 'ru');

                if (translation) {
                    // Insert translation
                    await db.query(`
                        INSERT INTO target_translations_french (word_id, target_lang, translation)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (word_id, target_lang) DO UPDATE
                        SET translation = EXCLUDED.translation
                    `, [row.word_id, 'ru', translation]);

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
        console.log('✅ FRENCH→RUSSIAN TRANSLATION COMPLETED');
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

translateFrenchToRussian().catch(err => {
    console.error(err);
    process.exit(1);
});
