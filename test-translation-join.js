const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function testQuery() {
    console.log('Testing query with sourceLanguageCode = de...\n');

    const query = `
        SELECT
            sw.id,
            sw.word,
            tt.translation,
            tt.source_lang
        FROM source_words_german sw
        LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id
            AND tt.source_lang = 'de'
        LIMIT 10
    `;

    const result = await pool.query(query);
    console.log('Results:');
    result.rows.forEach(row => {
        console.log(`  Word: ${row.word}, Translation: ${row.translation || 'NULL'}, source_lang: ${row.source_lang || 'NULL'}`);
    });

    await pool.end();
}

testQuery().catch(console.error);
