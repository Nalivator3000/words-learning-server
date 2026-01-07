const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createArabicEnglishTable() {
    try {
        console.log('Creating target_translations_english_from_ar table...\n');

        // Create the table
        await db.query(`
            CREATE TABLE IF NOT EXISTS target_translations_english_from_ar (
                id SERIAL PRIMARY KEY,
                source_lang VARCHAR(10),
                source_word_id INTEGER REFERENCES source_words_arabic(id) ON DELETE CASCADE,
                translation TEXT NOT NULL,
                example_native TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Created table target_translations_english_from_ar');

        // Create index
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_target_translations_english_from_ar_source_word_id
            ON target_translations_english_from_ar(source_word_id)
        `);
        console.log('✓ Created index on source_word_id');

        // Create index on source_lang
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_target_translations_english_from_ar_source_lang
            ON target_translations_english_from_ar(source_lang)
        `);
        console.log('✓ Created index on source_lang');

        // Check if we have any data to populate
        const arabicCount = await db.query('SELECT COUNT(*) FROM source_words_arabic');
        console.log(`\nArabic words available: ${arabicCount.rows[0].count}`);

        // Check if reverse translation table exists and has data
        const reverseCheck = await db.query(`
            SELECT COUNT(*) FROM target_translations_arabic_from_en
        `);
        console.log(`Reverse translations (Arabic from English): ${reverseCheck.rows[0].count}`);

        console.log('\n✓ Table created successfully!');
        console.log('\nℹ️  Note: The table is empty. You may need to:');
        console.log('   1. Run a translation import script');
        console.log('   2. Or populate it with translations from another source');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

createArabicEnglishTable();
