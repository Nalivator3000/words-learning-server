// Generate Russian translations for German words that are missing translations
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
        // Get max source_word_id that has translations
        const maxIdResult = await pool.query(
            'SELECT MAX(source_word_id) as max_id FROM target_translations_russian WHERE source_lang = $1',
            ['de']
        );
        const maxId = maxIdResult.rows[0].max_id || 0;
        console.log(`Max German source_word_id with translation: ${maxId}`);

        // Get all German words without translations
        const wordsResult = await pool.query(`
            SELECT id, word, example_de
            FROM source_words_german
            WHERE id > $1
            ORDER BY id
        `, [maxId]);

        console.log(`Found ${wordsResult.rows.length} words without translations\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const word of wordsResult.rows) {
            try {
                // Translate word
                const wordTranslation = await translate(word.word, { from: 'de', to: 'ru' });

                // Translate example if exists
                let exampleTranslation = '';
                if (word.example_de) {
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

                // Small delay to avoid rate limiting
                await delay(100);

            } catch (err) {
                errorCount++;
                console.error(`❌ Error translating "${word.word}":`, err.message);

                // Longer delay on error
                await delay(1000);
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
