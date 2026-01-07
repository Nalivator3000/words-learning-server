const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkProgress() {
    try {
        // Total Arabic words
        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_arabic');
        console.log(`Total Arabic words: ${totalWords.rows[0].count}`);

        // Translated words
        const translatedWords = await db.query('SELECT COUNT(*) FROM target_translations_english_from_ar');
        console.log(`Translated to English: ${translatedWords.rows[0].count}`);

        // Remaining words
        const remaining = await db.query(`
            SELECT COUNT(*) FROM source_words_arabic sw
            WHERE NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_ar tt
                WHERE tt.source_word_id = sw.id
            )
        `);
        console.log(`Remaining to translate: ${remaining.rows[0].count}`);

        // Progress percentage
        const progress = ((translatedWords.rows[0].count / totalWords.rows[0].count) * 100).toFixed(2);
        console.log(`Progress: ${progress}%`);

        // Show some examples
        console.log('\nLast 5 translations:');
        const examples = await db.query(`
            SELECT sw.word, tt.translation
            FROM target_translations_english_from_ar tt
            JOIN source_words_arabic sw ON tt.source_word_id = sw.id
            ORDER BY tt.id DESC
            LIMIT 5
        `);
        examples.rows.forEach(row => {
            console.log(`  ${row.word} → ${row.translation}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.end();
    }
}

checkProgress();
