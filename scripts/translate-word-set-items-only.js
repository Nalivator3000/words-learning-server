const { Pool } = require('pg');
const translate = require('@vitalets/google-translate-api').translate;
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function translateWordSetItemsOnly() {
    try {
        console.log('Translating ONLY words that are in Arabic word_set_items...\n');

        // Get unique Arabic words from word_set_items that don't have translations
        const wordsToTranslate = await db.query(`
            SELECT DISTINCT swa.id, swa.word
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            JOIN source_words_arabic swa ON wsi.word_id = swa.id
            WHERE ws.source_language = 'arabic'
            AND NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_ar tt
                WHERE tt.source_word_id = swa.id
            )
            ORDER BY swa.id
        `);

        console.log(`Found ${wordsToTranslate.rows.length} words in word sets that need translation\n`);

        if (wordsToTranslate.rows.length === 0) {
            console.log('✓ All word set items already have translations!');
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        let consecutiveErrors = 0;

        for (let i = 0; i < wordsToTranslate.rows.length; i++) {
            const word = wordsToTranslate.rows[i];

            try {
                const result = await translate(word.word, { from: 'ar', to: 'en' });
                const translation = result.text;

                await db.query(`
                    INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
                    VALUES ('ar', $1, $2)
                `, [word.id, translation]);

                successCount++;
                consecutiveErrors = 0;
                console.log(`✓ [${successCount}/${wordsToTranslate.rows.length}] ${word.word} → ${translation}`);

                // 2 second delay between translations
                await delay(2000);

            } catch (error) {
                errorCount++;
                consecutiveErrors++;
                console.error(`✗ [${i + 1}/${wordsToTranslate.rows.length}] Failed: ${word.word} - ${error.message}`);

                // If too many errors, wait longer
                if (consecutiveErrors >= 5) {
                    console.log(`  Too many errors (${consecutiveErrors}), waiting 60 seconds...`);
                    await delay(60000);
                    consecutiveErrors = 0;
                } else {
                    await delay(5000);
                }
            }

            // Every 20 words, take a longer break
            if ((i + 1) % 20 === 0 && i + 1 < wordsToTranslate.rows.length) {
                console.log(`\n  Progress break after ${i + 1} words, waiting 15 seconds...\n`);
                await delay(15000);
            }
        }

        console.log(`\n✅ Translation complete!`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);

        // Final check
        const finalCheck = await db.query(`
            SELECT COUNT(DISTINCT wsi.word_id) as total,
                   COUNT(DISTINCT CASE WHEN tt.id IS NOT NULL THEN wsi.word_id END) as translated
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            LEFT JOIN target_translations_english_from_ar tt ON tt.source_word_id = wsi.word_id
            WHERE ws.source_language = 'arabic'
        `);

        console.log(`\nWord set coverage:`);
        console.log(`   ${finalCheck.rows[0].translated} / ${finalCheck.rows[0].total} words translated`);
        console.log(`   ${((finalCheck.rows[0].translated / finalCheck.rows[0].total) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await db.end();
    }
}

translateWordSetItemsOnly();
