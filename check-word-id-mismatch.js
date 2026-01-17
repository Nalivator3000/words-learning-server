const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkWordIdMismatch() {
    try {
        console.log('='.repeat(80));
        console.log('INVESTIGATING SOURCE_WORD_ID MISMATCH');
        console.log('='.repeat(80) + '\n');

        // Get a few words from user_word_progress with review_1 status
        const uwpResult = await db.query(`
            SELECT uwp.source_word_id, uwp.status, sw.word, sw.id as sw_id
            FROM user_word_progress uwp
            JOIN source_words_german sw ON sw.id = uwp.source_word_id
            WHERE uwp.user_id = 5
            AND uwp.language_pair_id = 7
            AND uwp.status = 'review_1'
            AND uwp.source_language = 'german'
            LIMIT 10
        `);

        console.log(`Found ${uwpResult.rows.length} words with review_1 status:\n`);

        for (const word of uwpResult.rows) {
            console.log(`Word: "${word.word}" (source_word_id: ${word.source_word_id}, sw.id: ${word.sw_id})`);

            // Check if translation exists in base table
            const baseResult = await db.query(`
                SELECT translation, source_lang, source_word_id
                FROM target_translations_russian
                WHERE source_word_id = $1 AND source_lang = 'de'
            `, [word.source_word_id]);

            if (baseResult.rows.length > 0) {
                console.log(`  ✓ Found in target_translations_russian: "${baseResult.rows[0].translation}"`);
            } else {
                console.log(`  ✗ NOT found in target_translations_russian`);

                // Check if it exists with a different source_word_id
                const searchResult = await db.query(`
                    SELECT translation, source_lang, source_word_id
                    FROM target_translations_russian
                    WHERE source_lang = 'de'
                    ORDER BY ABS(source_word_id - $1)
                    LIMIT 1
                `, [word.source_word_id]);

                if (searchResult.rows.length > 0) {
                    console.log(`    Closest match: source_word_id ${searchResult.rows[0].source_word_id}`);
                }

                // Check if word exists in source_words_german with different ID
                const wordSearchResult = await db.query(`
                    SELECT id, word
                    FROM source_words_german
                    WHERE word = $1
                `, [word.word]);

                if (wordSearchResult.rows.length > 1) {
                    console.log(`    Word "${word.word}" appears ${wordSearchResult.rows.length} times in source_words_german with IDs:`);
                    wordSearchResult.rows.forEach(row => {
                        console.log(`      - ID ${row.id}`);
                    });
                }
            }

            console.log();
        }

        // Check overall statistics
        console.log('\n' + '='.repeat(80));
        console.log('OVERALL STATISTICS');
        console.log('='.repeat(80) + '\n');

        const statsResult = await db.query(`
            SELECT
                COUNT(*) as total_uwp,
                COUNT(DISTINCT uwp.source_word_id) as unique_source_word_ids,
                COUNT(tt.source_word_id) as matched_translations
            FROM user_word_progress uwp
            LEFT JOIN target_translations_russian tt ON tt.source_word_id = uwp.source_word_id AND tt.source_lang = 'de'
            WHERE uwp.user_id = 5
            AND uwp.language_pair_id = 7
            AND uwp.status = 'review_1'
            AND uwp.source_language = 'german'
        `);

        const stats = statsResult.rows[0];
        console.log(`Total user_word_progress records: ${stats.total_uwp}`);
        console.log(`Unique source_word_ids: ${stats.unique_source_word_ids}`);
        console.log(`Matched translations: ${stats.matched_translations}`);
        console.log(`Missing translations: ${stats.total_uwp - stats.matched_translations}`);
        console.log(`Match rate: ${((stats.matched_translations / stats.total_uwp) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await db.end();
    }
}

checkWordIdMismatch();
