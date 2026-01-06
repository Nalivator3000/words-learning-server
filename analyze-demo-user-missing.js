const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function analyzeDemoUserMissing() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        ANALYZING DEMO USER MISSING TRANSLATIONS               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // Get words without translations
        const query = `
            SELECT
                sw.id,
                sw.word,
                uwp.status,
                uwp.correct_count,
                uwp.total_reviews
            FROM user_word_progress uwp
            JOIN source_words_german sw ON sw.id = uwp.source_word_id
            LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id AND tt.source_lang = 'de'
            WHERE uwp.user_id = 5
                AND uwp.language_pair_id = 7
                AND (tt.translation IS NULL OR tt.translation = '')
            ORDER BY sw.id
        `;

        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} words without translations\n`);

        // Analyze by status
        const statusCounts = {};
        result.rows.forEach(row => {
            statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
        });

        console.log('📊 Breakdown by status:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} words`);
        });

        // Show ID ranges
        const ids = result.rows.map(r => r.id);
        const minId = Math.min(...ids);
        const maxId = Math.max(...ids);
        console.log(`\n📊 ID range: ${minId} - ${maxId}`);

        // Sample words
        console.log(`\n📝 Sample words (first 20):`);
        result.rows.slice(0, 20).forEach((row, i) => {
            console.log(`   ${i + 1}. ID: ${row.id}, Word: "${row.word}", Status: ${row.status}`);
        });

        // Check if these words exist in translation table at all
        console.log(`\n🔍 Checking if these words exist in target_translations_russian...\n`);
        const checkQuery = `
            SELECT COUNT(*) as count
            FROM target_translations_russian
            WHERE source_word_id IN (${ids.join(',')})
        `;
        const checkResult = await pool.query(checkQuery);
        console.log(`   Found ${checkResult.rows[0].count} rows in target_translations_russian for these words`);

        if (checkResult.rows[0].count > 0) {
            // Show sample of existing rows
            const sampleQuery = `
                SELECT source_word_id, source_lang, translation
                FROM target_translations_russian
                WHERE source_word_id IN (${ids.slice(0, 10).join(',')})
                LIMIT 10
            `;
            const sampleResult = await pool.query(sampleQuery);
            console.log(`\n   Sample existing rows:`);
            sampleResult.rows.forEach(row => {
                console.log(`      Word ID: ${row.source_word_id}, source_lang: '${row.source_lang}', translation: '${row.translation}'`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }

    await pool.end();
}

analyzeDemoUserMissing().catch(console.error);
