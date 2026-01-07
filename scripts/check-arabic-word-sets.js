const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkArabicWordSets() {
    try {
        console.log('Checking Arabic word sets...\n');

        // Find all word sets for Arabic
        const wordSets = await db.query(`
            SELECT id, level, theme, source_language, word_count
            FROM word_sets
            WHERE source_language = 'arabic'
            ORDER BY level, theme
            LIMIT 20
        `);

        console.log(`Found ${wordSets.rows.length} Arabic word sets:\n`);

        for (const set of wordSets.rows) {
            console.log(`Set #${set.id}`);
            console.log(`  Level: ${set.level}, Theme: ${set.theme || 'none'}`);
            console.log(`  Words: ${set.word_count}`);

            // Check if this set has specific words in word_set_items
            const items = await db.query(`
                SELECT COUNT(*) as count
                FROM word_set_items
                WHERE word_set_id = $1
            `, [set.id]);

            if (items.rows[0].count > 0) {
                console.log(`  Has specific word_set_items: ${items.rows[0].count}`);

                // Check how many of these words have translations
                const translated = await db.query(`
                    SELECT COUNT(*) as count
                    FROM word_set_items wsi
                    JOIN source_words_arabic swa ON wsi.word_id = swa.id
                    JOIN target_translations_english_from_ar tt ON tt.source_word_id = swa.id
                    WHERE wsi.word_set_id = $1
                `, [set.id]);

                console.log(`  Words with English translations: ${translated.rows[0].count}/${items.rows[0].count}`);
            } else {
                // Check words by level/theme
                const levelWords = await db.query(`
                    SELECT COUNT(*) as count
                    FROM source_words_arabic
                    WHERE level = $1 ${set.theme ? 'AND theme = $2' : ''}
                    LIMIT 1
                `, set.theme ? [set.level, set.theme] : [set.level]);

                console.log(`  Based on level/theme: ~${levelWords.rows[0].count || 'N/A'} words`);
            }

            console.log('');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.end();
    }
}

checkArabicWordSets();
