#!/usr/bin/env node
/**
 * Check word set 12214 content
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSet() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('WORD SET 12214 - CONTENT CHECK');
        console.log('='.repeat(80) + '\n');

        // 1. Get set info
        const set = await db.query(`
            SELECT * FROM word_sets WHERE id = 12214
        `);

        if (set.rows.length === 0) {
            console.log('❌ Set not found');
            await db.end();
            return;
        }

        const setInfo = set.rows[0];
        console.log('Set Info:');
        console.log(`  ID: ${setInfo.id}`);
        console.log(`  Title: ${setInfo.title}`);
        console.log(`  Source Language: ${setInfo.source_language}`);
        console.log(`  Level: ${setInfo.level}`);
        console.log(`  Word Count: ${setInfo.word_count}`);
        console.log(`  Public: ${setInfo.is_public}`);

        // 2. Get words from the set
        console.log('\n📝 Words in Set (first 10):\n');

        const words = await db.query(`
            SELECT
                wsi.word_id,
                wsi.order_index,
                sw.word as hindi_word
            FROM word_set_items wsi
            JOIN source_words_hindi sw ON wsi.word_id = sw.id
            WHERE wsi.word_set_id = 12214
            ORDER BY wsi.order_index
            LIMIT 10
        `);

        console.log(`Found ${words.rows.length} words:\n`);

        for (const w of words.rows) {
            console.log(`   [${w.order_index}] Word ID ${w.word_id}: "${w.hindi_word}"`);

            // Get German translation
            const translation = await db.query(`
                SELECT translation, example_de
                FROM target_translations_german_from_hi
                WHERE source_word_id = $1
            `, [w.word_id]);

            if (translation.rows.length === 0) {
                console.log(`       ❌ NO GERMAN TRANSLATION FOUND`);
            } else {
                const t = translation.rows[0];
                console.log(`       → German: "${t.translation}"`);
                if (t.example_de) {
                    console.log(`       Example (DE): ${t.example_de}`);
                }
            }

            // IMPORTANT: Check if there's a RUSSIAN translation too
            // This might be why Russian words are showing up!
            try {
                const russianTranslation = await db.query(`
                    SELECT translation
                    FROM target_translations_russian_from_hi
                    WHERE source_word_id = $1
                `, [w.word_id]);

                if (russianTranslation.rows.length > 0) {
                    console.log(`       ⚠️  ALSO has Russian: "${russianTranslation.rows[0].translation}"`);
                }
            } catch (err) {
                // Table might not exist, that's ok
            }

            console.log('');
        }

        // 3. Check API endpoint simulation
        console.log('='.repeat(80));
        console.log('SIMULATING API CALL: /api/word-sets/12214?languagePair=hi-de');
        console.log('='.repeat(80) + '\n');

        // This simulates what the API should return
        const apiResult = await db.query(`
            SELECT
                sw.id,
                sw.word,
                tt.translation,
                wsi.order_index
            FROM word_set_items wsi
            JOIN source_words_hindi sw ON wsi.word_id = sw.id
            LEFT JOIN target_translations_german_from_hi tt ON sw.id = tt.source_word_id
            WHERE wsi.word_set_id = 12214
            ORDER BY wsi.order_index ASC
            LIMIT 10
        `);

        console.log('API would return:\n');
        apiResult.rows.forEach(r => {
            console.log(`   [${r.order_index}] "${r.word}" → "${r.translation || 'NO TRANSLATION'}"`);
        });

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

checkSet();
