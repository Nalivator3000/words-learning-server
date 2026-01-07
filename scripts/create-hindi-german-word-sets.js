#!/usr/bin/env node
/**
 * Create Hindi → German word sets
 * 1. Clean up orphaned German translations
 * 2. Translate Hindi words to German
 * 3. Create word sets for Hindi → German
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const WORDS_PER_SET = 50;

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

async function createHindiGermanWordSets() {
    try {
        console.log('='.repeat(80));
        console.log('🇮🇳 → 🇩🇪 HINDI → GERMAN WORD SETS CREATION');
        console.log('='.repeat(80) + '\n');

        // Step 1: Clean up orphaned translations
        console.log('🧹 Step 1: Cleaning up orphaned German translations...');
        const orphaned = await db.query(`
            SELECT COUNT(*) as count
            FROM target_translations_german_from_hi t
            WHERE NOT EXISTS (
                SELECT 1 FROM source_words_hindi s
                WHERE s.id = t.source_word_id
            )
        `);

        if (parseInt(orphaned.rows[0].count) > 0) {
            console.log(`   Found ${orphaned.rows[0].count} orphaned translations`);
            const deleted = await db.query(`
                DELETE FROM target_translations_german_from_hi
                WHERE NOT EXISTS (
                    SELECT 1 FROM source_words_hindi
                    WHERE id = source_word_id
                )
            `);
            console.log(`   ✅ Deleted ${deleted.rowCount} orphaned translations\n`);
        } else {
            console.log('   ✅ No orphaned translations found\n');
        }

        // Step 2: Translate Hindi words to German
        console.log('🔄 Step 2: Translating Hindi → German...');
        const wordsToTranslate = await db.query(`
            SELECT sw.id, sw.word, sw.level, sw.theme
            FROM source_words_hindi sw
            LEFT JOIN target_translations_german_from_hi tt
                ON sw.id = tt.source_word_id
            WHERE tt.id IS NULL
            ORDER BY sw.level, sw.id
        `);

        const totalToTranslate = wordsToTranslate.rows.length;
        console.log(`   Found ${totalToTranslate} words to translate\n`);

        if (totalToTranslate > 0) {
            let translated = 0;
            let failed = 0;
            const startTime = Date.now();

            console.log('   Starting translation...\n');

            for (const row of wordsToTranslate.rows) {
                try {
                    const translation = await translateWithGoogleAPI(row.word, 'hi', 'de');

                    if (translation) {
                        await db.query(`
                            INSERT INTO target_translations_german_from_hi
                            (source_lang, source_word_id, translation, example_de)
                            VALUES ('hi', $1, $2, NULL)
                            ON CONFLICT (source_word_id) DO UPDATE
                            SET translation = EXCLUDED.translation
                        `, [row.id, translation]);

                        translated++;

                        if (translated % 100 === 0) {
                            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                            const remaining = totalToTranslate - translated;
                            const rate = translated / (elapsed || 0.1);
                            const eta = (remaining / rate).toFixed(1);
                            const pct = ((translated / totalToTranslate) * 100).toFixed(1);

                            console.log(`   Progress: ${translated}/${totalToTranslate} (${pct}%) - ${elapsed}m elapsed, ~${eta}m remaining`);
                        }
                    } else {
                        failed++;
                    }

                    await sleep(150);

                } catch (error) {
                    failed++;
                    console.error(`   ⚠️  Failed to translate: "${row.word}"`);
                    await sleep(500);
                }
            }

            const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            console.log(`\n   ✅ Translation complete: ${translated} words, ${failed} failed, ${totalTime}m total\n`);
        } else {
            console.log('   ✅ All words already translated\n');
        }

        // Step 3: Delete old Hindi → German word sets
        console.log('🗑️  Step 3: Deleting old Hindi → German word sets...');
        const deletedSets = await db.query(`
            DELETE FROM word_sets
            WHERE source_language = 'hindi'
            AND title LIKE '%→ German%'
        `);
        console.log(`   ✅ Deleted ${deletedSets.rowCount} old sets\n`);

        // Step 4: Create new word sets
        console.log('📚 Step 4: Creating Hindi → German word sets...\n');

        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        let totalSetsCreated = 0;

        for (const level of levels) {
            // Get words with translations for this level
            const words = await db.query(`
                SELECT sw.id, sw.word, sw.level, sw.theme, tt.translation
                FROM source_words_hindi sw
                JOIN target_translations_german_from_hi tt
                    ON sw.id = tt.source_word_id
                WHERE sw.level = $1
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                ORDER BY sw.id
            `, [level]);

            const wordCount = words.rows.length;
            const setsNeeded = Math.ceil(wordCount / WORDS_PER_SET);

            console.log(`   📝 ${level}: ${wordCount} words → ${setsNeeded} sets`);

            for (let setNum = 1; setNum <= setsNeeded; setNum++) {
                const startIdx = (setNum - 1) * WORDS_PER_SET;
                const endIdx = Math.min(startIdx + WORDS_PER_SET, wordCount);
                const setWords = words.rows.slice(startIdx, endIdx);

                const setTitle = `Hindi → German ${level}: General ${setNum}`;
                const setDescription = `${level} level general vocabulary (Hindi to German) - Part ${setNum} of ${setsNeeded}`;

                // Create word set
                const setResult = await db.query(`
                    INSERT INTO word_sets (
                        source_language, title, description,
                        level, theme, word_count, is_public, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    RETURNING id
                `, ['hindi', setTitle, setDescription, level, 'general', setWords.length, true]);

                const wordSetId = setResult.rows[0].id;

                // Add words to set
                for (let i = 0; i < setWords.length; i++) {
                    await db.query(`
                        INSERT INTO word_set_items (word_set_id, word_id, order_index, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `, [wordSetId, setWords[i].id, i]);
                }

                totalSetsCreated++;
            }
        }

        console.log(`\n   ✅ Created ${totalSetsCreated} word sets\n`);

        // Step 5: Verification
        console.log('='.repeat(80));
        console.log('VERIFICATION');
        console.log('='.repeat(80) + '\n');

        const finalWords = await db.query('SELECT COUNT(*) FROM source_words_hindi');
        const finalTrans = await db.query(`
            SELECT COUNT(*) FROM target_translations_german_from_hi
            WHERE translation IS NOT NULL AND translation != ''
        `);
        const finalSets = await db.query(`
            SELECT level, COUNT(*) as count
            FROM word_sets
            WHERE source_language = 'hindi'
            AND title LIKE '%→ German%'
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
        const finalItems = await db.query(`
            SELECT COUNT(*) as count
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            WHERE ws.source_language = 'hindi'
            AND ws.title LIKE '%→ German%'
        `);

        console.log('📊 Final statistics:');
        console.log(`   Total Hindi words: ${finalWords.rows[0].count}`);
        console.log(`   Total translations (Hindi → German): ${finalTrans.rows[0].count}`);
        console.log(`   Total word sets: ${finalSets.rows.reduce((sum, r) => sum + parseInt(r.count), 0)}`);
        console.log(`   Total word set items: ${finalItems.rows[0].count}\n`);

        console.log('📚 Word sets by level:');
        finalSets.rows.forEach(row => {
            console.log(`   ${row.level}: ${row.count} sets`);
        });

        const coverage = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM source_words_hindi) as total_words,
                (SELECT COUNT(*) FROM target_translations_german_from_hi
                 WHERE translation IS NOT NULL) as translated_words,
                (SELECT COUNT(DISTINCT word_id) FROM word_set_items wsi
                 JOIN word_sets ws ON wsi.word_set_id = ws.id
                 WHERE ws.source_language = 'hindi'
                 AND ws.title LIKE '%→ German%') as words_in_sets
        `);

        const cov = coverage.rows[0];
        const transPct = ((cov.translated_words / cov.total_words) * 100).toFixed(1);
        const setPct = ((cov.words_in_sets / cov.total_words) * 100).toFixed(1);

        console.log(`\n📈 Coverage:`);
        console.log(`   Translated: ${cov.translated_words}/${cov.total_words} (${transPct}%)`);
        console.log(`   In sets: ${cov.words_in_sets}/${cov.total_words} (${setPct}%)`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ HINDI → GERMAN WORD SETS CREATED SUCCESSFULLY');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

createHindiGermanWordSets();
