const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createPlaceholders() {
    try {
        console.log('Creating placeholder translations for Arabic words...\n');

        // For now, just insert the Arabic word itself as translation with a note
        // This will allow the preview to work
        const result = await db.query(`
            INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
            SELECT DISTINCT
                'ar' as source_lang,
                swa.id as source_word_id,
                '[AR] ' || swa.word as translation
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            JOIN source_words_arabic swa ON wsi.word_id = swa.id
            WHERE ws.source_language = 'arabic'
            AND NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_ar tt
                WHERE tt.source_word_id = swa.id
            )
            ON CONFLICT DO NOTHING
        `);

        console.log(`✓ Created ${result.rowCount} placeholder translations`);

        // Check coverage
        const coverage = await db.query(`
            SELECT COUNT(DISTINCT wsi.word_id) as total,
                   COUNT(DISTINCT CASE WHEN tt.id IS NOT NULL THEN wsi.word_id END) as with_translation
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            LEFT JOIN target_translations_english_from_ar tt ON tt.source_word_id = wsi.word_id
            WHERE ws.source_language = 'arabic'
        `);

        console.log(`\nWord set coverage:`);
        console.log(`   ${coverage.rows[0].with_translation} / ${coverage.rows[0].total} words have translations`);
        console.log(`   ${((coverage.rows[0].with_translation / coverage.rows[0].total) * 100).toFixed(2)}%`);

        console.log(`\n✅ Preview should now work for all Arabic word sets!`);
        console.log(`   Note: Translations marked with [AR] are placeholders`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.end();
    }
}

createPlaceholders();
