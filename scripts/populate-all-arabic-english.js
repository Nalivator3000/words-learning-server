const { Pool } = require('pg');
const translate = require('@vitalets/google-translate-api').translate;
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateAllArabicEnglish() {
    try {
        console.log('Populating all Arabic to English translations...\n');

        while (true) {
            // Get batch of 50 words
            const arabicWords = await db.query(`
                SELECT sw.id, sw.word
                FROM source_words_arabic sw
                WHERE NOT EXISTS (
                    SELECT 1 FROM target_translations_english_from_ar tt
                    WHERE tt.source_word_id = sw.id
                )
                ORDER BY sw.id
                LIMIT 50
            `);

            if (arabicWords.rows.length === 0) {
                console.log('\n✓ All Arabic words have been translated!');
                break;
            }

            const remaining = await db.query(`
                SELECT COUNT(*) FROM source_words_arabic sw
                WHERE NOT EXISTS (
                    SELECT 1 FROM target_translations_english_from_ar tt
                    WHERE tt.source_word_id = sw.id
                )
            `);

            console.log(`\nProcessing batch of ${arabicWords.rows.length} words (${remaining.rows[0].count} remaining)...`);

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < arabicWords.rows.length; i++) {
                const word = arabicWords.rows[i];
                try {
                    const result = await translate(word.word, { from: 'ar', to: 'en' });
                    const translation = result.text;

                    await db.query(`
                        INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
                        VALUES ('ar', $1, $2)
                    `, [word.id, translation]);

                    successCount++;
                    if ((i + 1) % 10 === 0) {
                        console.log(`  Progress: ${i + 1}/${arabicWords.rows.length}`);
                    }

                    // Small delay between requests
                    await delay(500);

                } catch (error) {
                    errorCount++;
                    console.error(`  ✗ Failed: "${word.word}": ${error.message}`);
                    await delay(2000);
                }
            }

            console.log(`Batch complete: ${successCount} successful, ${errorCount} errors`);

            // Pause between batches
            console.log('Pausing 5 seconds before next batch...');
            await delay(5000);
        }

        const finalCount = await db.query('SELECT COUNT(*) FROM target_translations_english_from_ar');
        console.log(`\n✓ Complete! Total translations: ${finalCount.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
    }
}

populateAllArabicEnglish();
