const { Pool } = require('pg');
const translate = require('@vitalets/google-translate-api').translate;
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateArabicEnglishTranslations() {
    try {
        console.log('Populating target_translations_english_from_ar...\n');

        // Get all Arabic words that don't have English translations yet
        const arabicWords = await db.query(`
            SELECT sw.id, sw.word
            FROM source_words_arabic sw
            WHERE NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_ar tt
                WHERE tt.source_word_id = sw.id
            )
            ORDER BY sw.id
            LIMIT 100
        `);

        if (arabicWords.rows.length === 0) {
            console.log('✓ All Arabic words already have English translations!');
            return;
        }

        console.log(`Found ${arabicWords.rows.length} Arabic words without English translations`);
        console.log('Starting translation process...\n');

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < arabicWords.rows.length; i++) {
            const word = arabicWords.rows[i];
            try {
                // Translate from Arabic to English
                const result = await translate(word.word, { from: 'ar', to: 'en' });
                const translation = result.text;

                // Insert into database
                await db.query(`
                    INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
                    VALUES ('ar', $1, $2)
                `, [word.id, translation]);

                successCount++;
                console.log(`✓ [${i + 1}/${arabicWords.rows.length}] ${word.word} → ${translation}`);

                // Delay to avoid rate limiting
                if ((i + 1) % 10 === 0) {
                    console.log('  Pausing for 2 seconds to avoid rate limits...');
                    await delay(2000);
                }

            } catch (error) {
                errorCount++;
                console.error(`✗ [${i + 1}/${arabicWords.rows.length}] Failed to translate "${word.word}": ${error.message}`);

                // On error, wait a bit longer before continuing
                await delay(3000);
            }
        }

        console.log(`\n✓ Translation complete!`);
        console.log(`  Successful: ${successCount}`);
        console.log(`  Errors: ${errorCount}`);

        // Show final count
        const finalCount = await db.query('SELECT COUNT(*) FROM target_translations_english_from_ar');
        console.log(`\nTotal translations in table: ${finalCount.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

populateArabicEnglishTranslations();
