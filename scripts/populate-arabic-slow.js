const { Pool } = require('pg');
const translate = require('@vitalets/google-translate-api').translate;
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateSlow() {
    try {
        console.log('Starting slow translation (3 sec delay between each word)...\n');

        let totalSuccess = 0;
        let totalErrors = 0;
        let consecutiveErrors = 0;

        while (true) {
            // Get just 10 words at a time
            const arabicWords = await db.query(`
                SELECT sw.id, sw.word
                FROM source_words_arabic sw
                WHERE NOT EXISTS (
                    SELECT 1 FROM target_translations_english_from_ar tt
                    WHERE tt.source_word_id = sw.id
                )
                ORDER BY sw.id
                LIMIT 10
            `);

            if (arabicWords.rows.length === 0) {
                console.log('\n✓ All words translated!');
                break;
            }

            const remaining = await db.query(`
                SELECT COUNT(*) FROM source_words_arabic sw
                WHERE NOT EXISTS (
                    SELECT 1 FROM target_translations_english_from_ar tt
                    WHERE tt.source_word_id = sw.id
                )
            `);

            console.log(`\nBatch of ${arabicWords.rows.length} words (${remaining.rows[0].count} remaining)`);

            for (let i = 0; i < arabicWords.rows.length; i++) {
                const word = arabicWords.rows[i];

                try {
                    const result = await translate(word.word, { from: 'ar', to: 'en' });
                    const translation = result.text;

                    await db.query(`
                        INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
                        VALUES ('ar', $1, $2)
                    `, [word.id, translation]);

                    totalSuccess++;
                    consecutiveErrors = 0;
                    console.log(`✓ ${word.word} → ${translation}`);

                    // 3 second delay between each word
                    await delay(3000);

                } catch (error) {
                    totalErrors++;
                    consecutiveErrors++;
                    console.error(`✗ Failed: ${word.word}`);

                    // If too many errors in a row, wait longer
                    if (consecutiveErrors >= 3) {
                        console.log('  Too many errors, waiting 30 seconds...');
                        await delay(30000);
                        consecutiveErrors = 0;
                    } else {
                        await delay(5000);
                    }
                }
            }

            // Report progress every batch
            console.log(`Progress: ${totalSuccess} successful, ${totalErrors} errors`);

            // Longer pause between batches
            console.log('Pausing 10 seconds...');
            await delay(10000);
        }

        console.log(`\n✅ Done! Success: ${totalSuccess}, Errors: ${totalErrors}`);

    } catch (error) {
        console.error('Fatal error:', error.message);
    } finally {
        await db.end();
    }
}

populateSlow();
