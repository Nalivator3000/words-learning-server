#!/usr/bin/env node
/**
 * Resume Hindi 10K import without deleting existing words
 * Continues from where it left off
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
    'A1': 1000,
    'A2': 1000,
    'B1': 1500,
    'B2': 2000,
    'C1': 2500,
    'C2': 2000
};

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function resumeHindiImport() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🇮🇳 HINDI 10K VOCABULARY - RESUME IMPORT');
        console.log('='.repeat(80) + '\n');

        // Check existing words
        console.log('📊 Checking existing words...\n');
        const existing = await db.query('SELECT COUNT(*) FROM source_words_hindi');
        const totalExisting = parseInt(existing.rows[0].count);
        console.log(`   Current words in database: ${totalExisting}`);

        const byLevel = await db.query(`
            SELECT level, COUNT(*) as count
            FROM source_words_hindi
            GROUP BY level
            ORDER BY level
        `);

        console.log('\n   By level:');
        const existingByLevel = {};
        byLevel.rows.forEach(row => {
            existingByLevel[row.level] = parseInt(row.count);
            const target = DISTRIBUTION[row.level];
            console.log(`   ${row.level}: ${row.count} / ${target}`);
        });

        if (totalExisting >= 9900) {
            console.log('\n✅ Import already complete!');
            await db.end();
            return;
        }

        console.log('\n🔄 Resuming translation...\n');

        let totalTranslated = 0;
        let totalFailed = 0;
        const startTime = Date.now();

        for (const [level, targetCount] of Object.entries(DISTRIBUTION)) {
            const currentCount = existingByLevel[level] || 0;
            const needed = targetCount - currentCount;

            if (needed <= 0) {
                console.log(`✅ ${level}: Already complete (${currentCount}/${targetCount})\n`);
                continue;
            }

            console.log(`📝 Level ${level}: Need ${needed} more words (${currentCount}/${targetCount} existing)`);

            // Get English words for this level
            const englishWords = await db.query(`
                SELECT word
                FROM source_words_english
                WHERE level = $1
                ORDER BY id
                LIMIT $2 OFFSET $3
            `, [level, needed + 100, currentCount]); // Get extra in case of duplicates

            let levelTranslated = 0;
            let levelFailed = 0;

            for (let i = 0; i < Math.min(englishWords.rows.length, needed + 50); i++) {
                const englishWord = englishWords.rows[i].word;

                try {
                    const hindiWord = await translateToHindi(englishWord);

                    if (hindiWord && hindiWord.length > 0) {
                        try {
                            await db.query(`
                                INSERT INTO source_words_hindi (word, level, theme)
                                VALUES ($1, $2, 'general')
                                ON CONFLICT (word) DO NOTHING
                            `, [hindiWord, level]);

                            levelTranslated++;
                            totalTranslated++;

                            if (levelTranslated >= needed) break;
                        } catch (dbError) {
                            // Skip duplicates
                        }
                    } else {
                        levelFailed++;
                        totalFailed++;
                    }

                    if ((i + 1) % 50 === 0) {
                        const progress = ((i + 1) / needed * 100).toFixed(1);
                        console.log(`   ${Math.min(100, parseFloat(progress)).toFixed(1)}% (${levelTranslated}/${needed})`);
                    }

                    await sleep(150);

                } catch (error) {
                    levelFailed++;
                    totalFailed++;
                    await sleep(500);
                }
            }

            console.log(`   ✅ ${level}: +${levelTranslated} new words\n`);
        }

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        // Final stats
        console.log('='.repeat(80));
        console.log('RESUME COMPLETE');
        console.log('='.repeat(80));

        const finalCount = await db.query('SELECT COUNT(*) FROM source_words_hindi');
        console.log(`\n📊 Total words: ${finalCount.rows[0].count}\n`);

        const finalByLevel = await db.query(`
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

        console.log('📈 By level:');
        finalByLevel.rows.forEach(row => {
            const target = DISTRIBUTION[row.level];
            const pct = (row.count / target * 100).toFixed(1);
            console.log(`   ${row.level}: ${row.count} / ${target} (${pct}%)`);
        });

        console.log(`\n✅ Translated: ${totalTranslated} new words`);
        console.log(`❌ Failed: ${totalFailed} words`);
        console.log(`⏱️  Time: ${totalTime} minutes`);
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

resumeHindiImport();
