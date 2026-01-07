const { Pool } = require('pg');
const { Translate } = require('@google-cloud/translate').v2;
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Google Translate with credentials
const translateClient = new Translate({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateWithOfficialAPI() {
    try {
        console.log('Using official Google Cloud Translation API...\n');

        let totalProcessed = 0;
        let totalSuccess = 0;
        let totalErrors = 0;

        while (true) {
            // Get batch of 100 words (official API can handle more)
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

            console.log(`\nProcessing batch of ${arabicWords.rows.length} words (${remaining.rows[0].count} total remaining)...`);

            // Translate in bulk
            try {
                const textsToTranslate = arabicWords.rows.map(w => w.word);
                const [translations] = await translateClient.translate(textsToTranslate, {
                    from: 'ar',
                    to: 'en'
                });

                // Insert all translations
                for (let i = 0; i < arabicWords.rows.length; i++) {
                    const word = arabicWords.rows[i];
                    const translation = Array.isArray(translations) ? translations[i] : translations;

                    try {
                        await db.query(`
                            INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
                            VALUES ('ar', $1, $2)
                        `, [word.id, translation]);

                        totalSuccess++;

                        if ((i + 1) % 20 === 0) {
                            console.log(`  Progress: ${i + 1}/${arabicWords.rows.length}`);
                        }
                    } catch (error) {
                        totalErrors++;
                        console.error(`  ✗ Failed to insert: ${error.message}`);
                    }
                }

                totalProcessed += arabicWords.rows.length;
                console.log(`Batch complete: ${totalSuccess}/${totalProcessed} successful`);

            } catch (error) {
                console.error(`✗ Translation API error: ${error.message}`);
                totalErrors += arabicWords.rows.length;

                // Wait longer on API errors
                console.log('Waiting 10 seconds before retry...');
                await delay(10000);
            }

            // Small delay between batches
            await delay(1000);

            // Progress report every 500 words
            if (totalProcessed % 500 === 0) {
                console.log(`\n📊 Progress Report:`);
                console.log(`   Processed: ${totalProcessed}`);
                console.log(`   Successful: ${totalSuccess}`);
                console.log(`   Errors: ${totalErrors}`);
            }
        }

        const finalCount = await db.query('SELECT COUNT(*) FROM target_translations_english_from_ar');
        console.log(`\n✅ Complete! Total translations: ${finalCount.rows[0].count}`);
        console.log(`   Success: ${totalSuccess}`);
        console.log(`   Errors: ${totalErrors}`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await db.end();
    }
}

populateWithOfficialAPI();
