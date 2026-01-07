const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTranslations() {
    try {
        // Check if translations exist for word "can" (source_word_id = 121)
        console.log('🔍 Checking translations for source_word_id = 121 (word: "can")\n');

        const query1 = `
            SELECT * FROM target_translations_spanish_from_en
            WHERE source_word_id = 121
            LIMIT 5;
        `;

        const result1 = await pool.query(query1);
        console.log('Results from target_translations_spanish_from_en:');
        console.log(JSON.stringify(result1.rows, null, 2));
        console.log('\n');

        // Check source word
        console.log('📖 Checking source word:');
        const query2 = `
            SELECT * FROM source_words_english
            WHERE id = 121;
        `;
        const result2 = await pool.query(query2);
        console.log(JSON.stringify(result2.rows, null, 2));
        console.log('\n');

        // Check if JOIN works manually
        console.log('🔗 Testing JOIN query:');
        const query3 = `
            SELECT
                sw.id as source_word_id,
                sw.word,
                tt.translation,
                tt.example_native
            FROM source_words_english sw
            LEFT JOIN target_translations_spanish_from_en tt ON tt.source_word_id = sw.id
            WHERE sw.id = 121;
        `;
        const result3 = await pool.query(query3);
        console.log(JSON.stringify(result3.rows, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTranslations();
