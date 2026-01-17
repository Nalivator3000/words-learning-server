// Generate Russian translations for German words - SLOW version to avoid rate limiting
require('dotenv').config();
const { Pool } = require('pg');
const { translate } = require('@vitalets/google-translate-api');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateTranslations() {
    try {
        // Get German words that DON'T have translations yet
        const wordsResult = await pool.query(`
            SELECT sw.id, sw.word, sw.example_de
            FROM source_words_german sw
            WHERE sw.id > 10540
            AND NOT EXISTS (
                SELECT 1 FROM target_translations_russian ttr
                WHERE ttr.source_word_id = sw.id AND ttr.source_lang = 'de'
            )
            ORDER BY sw.id
        `);

        console.log(`Found ${wordsResult.rows.length} words still needing translations\n`);

        if (wordsResult.rows.length === 0) {
            console.log('All words already have translations!');
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const word of wordsResult.rows) {
            try {
                // Translate word
                const wordTranslation = await translate(word.word, { from: 'de', to: 'ru' });

                // Translate example if exists
                let exampleTranslation = '';
                if (word.example_de) {
                    await delay(500); // Extra delay before example
                    const exampleResult = await translate(word.example_de, { from: 'de', to: 'ru' });
                    exampleTranslation = exampleResult.text;
                }

                // Insert into target_translations_russian
                await pool.query(`
                    INSERT INTO target_translations_russian (source_lang, source_word_id, translation, example_ru, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    ON CONFLICT (source_lang, source_word_id) DO UPDATE
                    SET translation = $3, example_ru = $4, updated_at = NOW()
                `, ['de', word.id, wordTranslation.text, exampleTranslation]);

                successCount++;
                console.log(`✅ ${successCount}/${wordsResult.rows.length}: ${word.word} → ${wordTranslation.text}`);

                // Longer delay to avoid rate limiting (2 seconds between words)
                await delay(2000);

            } catch (err) {
                errorCount++;
                console.error(`❌ Error translating "${word.word}":`, err.message);

                // Even longer delay on error (10 seconds)
                await delay(10000);
            }
        }

        console.log(`\n=== DONE ===`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await pool.end();
    }
}

generateTranslations();
