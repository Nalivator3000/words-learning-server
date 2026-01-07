const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function copyFromReverse() {
    try {
        console.log('Copying translations from English words to Arabic translations...\n');

        // Strategy: Find English words that have Arabic translations
        // Then find those same English words in target_translations_english (base table)
        // and copy their source words as translations for Arabic words

        // First, let's try a different approach:
        // We have Arabic words in source_words_arabic
        // We need English translations in target_translations_english_from_ar

        // Check if we can find matching pairs through English source words
        const result = await db.query(`
            INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
            SELECT DISTINCT
                'ar' as source_lang,
                swa.id as source_word_id,
                swe.word as translation
            FROM source_words_arabic swa
            JOIN target_translations_arabic_from_en tta ON tta.translation = swa.word
            JOIN source_words_english swe ON swe.id = tta.source_word_id
            WHERE NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_ar tt2
                WHERE tt2.source_word_id = swa.id
            )
            AND swe.word IS NOT NULL
            AND swe.word != ''
            ON CONFLICT DO NOTHING
        `);

        console.log(`✓ Copied ${result.rowCount} translations from reverse table`);

        // Check progress
        const progress = await db.query(`
            SELECT COUNT(*) as translated
            FROM target_translations_english_from_ar
        `);

        const total = await db.query(`
            SELECT COUNT(*) as total
            FROM source_words_arabic
        `);

        console.log(`\nProgress: ${progress.rows[0].translated} / ${total.rows[0].total} words translated`);
        console.log(`Percentage: ${((progress.rows[0].translated / total.rows[0].total) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

copyFromReverse();
