const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function testDemoUserWords() {
    console.log('Testing Demo User words with translations...\n');

    const query = `
        SELECT
            sw.id,
            sw.word,
            tt.translation,
            tt.source_lang,
            uwp.status
        FROM user_word_progress uwp
        JOIN source_words_german sw ON sw.id = uwp.source_word_id
        LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id
            AND tt.source_lang = 'de'
        WHERE uwp.user_id = 5 AND uwp.language_pair_id = 7
        LIMIT 10
    `;

    const result = await pool.query(query);
    console.log('Results:');
    result.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Word: ${row.word}, Translation: ${row.translation || 'NULL'}, Status: ${row.status}`);
    });

    console.log('\n\nNow checking how many have NULL translations:');
    const countQuery = `
        SELECT
            COUNT(*) FILTER (WHERE tt.translation IS NULL) as null_count,
            COUNT(*) as total_count
        FROM user_word_progress uwp
        JOIN source_words_german sw ON sw.id = uwp.source_word_id
        LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id
            AND tt.source_lang = 'de'
        WHERE uwp.user_id = 5 AND uwp.language_pair_id = 7
    `;

    const counts = await pool.query(countQuery);
    console.log(`Total: ${counts.rows[0].total_count}, NULL translations: ${counts.rows[0].null_count}`);

    await pool.end();
}

testDemoUserWords().catch(console.error);
