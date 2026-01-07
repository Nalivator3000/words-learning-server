#!/usr/bin/env node
/**
 * Generate 10,000 Hindi words by translating English frequency list
 * Uses existing English vocabulary with proper CEFR distribution
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// CEFR distribution for 10,000 words
const DISTRIBUTION = {
    'A1': 1000,   // 10%
    'A2': 1000,   // 10%
    'B1': 1500,   // 15%
    'B2': 2000,   // 20%
    'C1': 2500,   // 25%
    'C2': 2000    // 20%
};

// Translate using Google Translate API
function translateToHindi(text) {
    return new Promise((resolve, reject) => {
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodedText}`;

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

async function generateHindiVocabulary() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🇮🇳 HINDI 10K VOCABULARY GENERATOR');
        console.log('='.repeat(80) + '\n');

        // Step 1: Get English words by level from database
        console.log('📊 Fetching English vocabulary by CEFR level...\n');

        const englishWords = {};
        for (const [level, count] of Object.entries(DISTRIBUTION)) {
            const result = await db.query(`
                SELECT word, level
                FROM source_words_english
                WHERE level = $1
                ORDER BY id
                LIMIT $2
            `, [level, count]);

            englishWords[level] = result.rows.map(r => r.word);
            console.log(`   ${level}: ${englishWords[level].length} words`);
        }

        const totalEnglish = Object.values(englishWords).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`\n✅ Total English words: ${totalEnglish}\n`);

        // Step 2: Clear existing Hindi words
        console.log('🗑️  Clearing existing Hindi vocabulary...');
        const deleted = await db.query('DELETE FROM source_words_hindi');
        console.log(`   Deleted ${deleted.rowCount} existing words\n`);

        // Step 3: Translate and import Hindi words
        console.log('🔄 Translating English → Hindi...\n');

        let totalTranslated = 0;
        let totalFailed = 0;
        const startTime = Date.now();

        for (const [level, words] of Object.entries(englishWords)) {
            console.log(`📝 Level ${level} (${words.length} words):`);
            let levelTranslated = 0;
            let levelFailed = 0;

            for (let i = 0; i < words.length; i++) {
                const englishWord = words[i];

                try {
                    // Translate to Hindi
                    const hindiWord = await translateToHindi(englishWord);

                    if (hindiWord && hindiWord.length > 0) {
                        // Insert into database
                        try {
                            await db.query(`
                                INSERT INTO source_words_hindi (word, level, theme)
                                VALUES ($1, $2, 'general')
                                ON CONFLICT (word) DO NOTHING
                            `, [hindiWord, level]);

                            levelTranslated++;
                            totalTranslated++;
                        } catch (dbError) {
                            // Duplicate or other DB error
                            levelFailed++;
                            totalFailed++;
                        }
                    } else {
                        levelFailed++;
                        totalFailed++;
                        console.log(`   ⚠️  Failed: ${englishWord}`);
                    }

                    // Progress report every 50 words
                    if ((i + 1) % 50 === 0) {
                        const progress = ((i + 1) / words.length * 100).toFixed(1);
                        console.log(`   ${progress}% complete (${i + 1}/${words.length})`);
                    }

                    // Rate limiting: 150ms between requests
                    await sleep(150);

                } catch (error) {
                    levelFailed++;
                    totalFailed++;
                    console.error(`   ❌ Error translating "${englishWord}":`, error.message);
                    await sleep(500);
                }
            }

            console.log(`   ✅ ${level}: ${levelTranslated} translated, ${levelFailed} failed\n`);
        }

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        // Step 4: Final statistics
        console.log('='.repeat(80));
        console.log('FINAL STATISTICS');
        console.log('='.repeat(80) + '\n');

        const finalCount = await db.query('SELECT COUNT(*) FROM source_words_hindi');
        console.log(`📊 Total Hindi words in database: ${finalCount.rows[0].count}\n`);

        console.log('📈 By level:');
        const byLevel = await db.query(`
            SELECT level, COUNT(*) as count
            FROM source_words_hindi
            GROUP BY level
            ORDER BY
                CASE level
                    WHEN 'A1' THEN 1
                    WHEN 'A2' THEN 2
                    WHEN 'B1' THEN 3
                    WHEN 'B2' THEN 4
                    WHEN 'C1' THEN 5
                    WHEN 'C2' THEN 6
                END
        `);

        for (const row of byLevel.rows) {
            const percentage = (row.count / finalCount.rows[0].count * 100).toFixed(1);
            console.log(`   ${row.level}: ${row.count} words (${percentage}%)`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ IMPORT COMPLETE');
        console.log('='.repeat(80));
        console.log(`✅ Translated: ${totalTranslated} words`);
        console.log(`❌ Failed: ${totalFailed} words`);
        console.log(`⏱️  Total time: ${totalTime} minutes`);
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

generateHindiVocabulary();
