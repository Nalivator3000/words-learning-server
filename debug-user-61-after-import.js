const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/words_learning'
});

async function debugUser61() {
    try {
        console.log('=== USER 61 DEBUG AFTER IMPORT ===\n');

        // 1. Get user info
        const userResult = await pool.query(
            'SELECT id, name, email FROM users WHERE id = 61'
        );
        console.log('1. User Info:', userResult.rows[0]);

        // 2. Get user's language pair
        const langPairResult = await pool.query(
            'SELECT id, from_lang, to_lang FROM language_pairs WHERE user_id = 61'
        );
        console.log('\n2. Language Pair:', langPairResult.rows[0]);

        const languagePairId = langPairResult.rows[0]?.id;
        const fromLang = langPairResult.rows[0]?.from_lang;

        // 3. Count words in user_word_progress
        const progressCountResult = await pool.query(`
            SELECT
                source_language,
                status,
                COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = 61
            GROUP BY source_language, status
            ORDER BY source_language, status
        `);
        console.log('\n3. Words in user_word_progress (grouped by language and status):');
        progressCountResult.rows.forEach(row => {
            console.log(`   ${row.source_language} - ${row.status}: ${row.count}`);
        });

        // 4. Total count
        const totalResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM user_word_progress
            WHERE user_id = 61
        `);
        console.log('\n4. Total words in progress:', totalResult.rows[0].total);

        // 5. Check what the API would return
        if (languagePairId && fromLang) {
            const langCodeToName = {
                'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
                'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
                'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
                'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
                'sr': 'serbian', 'sw': 'swahili'
            };
            const sourceLanguage = langCodeToName[fromLang] || fromLang;

            const apiCountsResult = await pool.query(`
                SELECT
                    status,
                    COUNT(*) as count
                FROM user_word_progress
                WHERE user_id = 61
                AND language_pair_id = $1
                AND source_language = $2
                GROUP BY status
            `, [languagePairId, sourceLanguage]);

            console.log(`\n5. What API /api/words/counts would return (language_pair_id=${languagePairId}, source_language=${sourceLanguage}):`);
            const counts = {
                new: 0,
                studying: 0,
                review: 0,
                learned: 0,
                mastered: 0
            };
            apiCountsResult.rows.forEach(row => {
                counts[row.status] = parseInt(row.count);
            });
            console.log('   Counts:', counts);
            console.log('   Total:', Object.values(counts).reduce((a, b) => a + b, 0));
        }

        // 6. Get recent imports
        const recentWords = await pool.query(`
            SELECT
                source_language,
                source_word_id,
                status,
                created_at
            FROM user_word_progress
            WHERE user_id = 61
            ORDER BY created_at DESC
            LIMIT 10
        `);
        console.log('\n6. Recent 10 imports:');
        recentWords.rows.forEach(row => {
            console.log(`   ${row.source_language} word_id=${row.source_word_id}, status=${row.status}, created=${row.created_at}`);
        });

        // 7. Check if there are any words with wrong language_pair_id
        const wrongPairResult = await pool.query(`
            SELECT
                language_pair_id,
                COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = 61
            GROUP BY language_pair_id
        `);
        console.log('\n7. Words by language_pair_id:');
        wrongPairResult.rows.forEach(row => {
            console.log(`   language_pair_id=${row.language_pair_id}: ${row.count} words`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debugUser61();