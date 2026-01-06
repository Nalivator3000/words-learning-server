const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUser61Words() {
    try {
        // Check user 61's language pair
        console.log('=== USER 61 LANGUAGE PAIR ===');
        const langPair = await db.query(
            'SELECT * FROM language_pairs WHERE user_id = 61'
        );
        console.log('Language pairs:', langPair.rows);

        const languagePairId = 65; // from the console logs
        const userId = 61;

        // Check word progress count
        console.log('\n=== USER WORD PROGRESS COUNT ===');
        const progressCount = await db.query(
            'SELECT COUNT(*) FROM user_word_progress WHERE user_id = $1 AND language_pair_id = $2',
            [userId, languagePairId]
        );
        console.log('Total words in user_word_progress:', progressCount.rows[0].count);

        // Check status breakdown
        console.log('\n=== STATUS BREAKDOWN ===');
        const statusBreakdown = await db.query(
            `SELECT status, COUNT(*) FROM user_word_progress
             WHERE user_id = $1 AND language_pair_id = $2
             GROUP BY status`,
            [userId, languagePairId]
        );
        console.log('Status breakdown:', statusBreakdown.rows);

        // Simulate the /api/words query with limit=10000
        console.log('\n=== SIMULATING /api/words QUERY ===');
        const limit = 10000;
        const offset = 0;
        const status = 'studying';

        const langPairResult = await db.query(
            'SELECT from_lang, to_lang FROM language_pairs WHERE id = $1 AND user_id = $2',
            [languagePairId, userId]
        );

        const sourceLanguageCode = langPairResult.rows[0].from_lang;
        const targetLanguageCode = langPairResult.rows[0].to_lang;
        console.log(`Source: ${sourceLanguageCode}, Target: ${targetLanguageCode}`);

        const LANG_CODE_TO_FULL_NAME = {
            'en': 'english',
            'de': 'german',
            'ru': 'russian',
            'es': 'spanish',
            'fr': 'french',
            'it': 'italian',
            'pt': 'portuguese',
            'zh': 'chinese',
            'ar': 'arabic',
            'tr': 'turkish',
            'uk': 'ukrainian',
            'pl': 'polish',
            'ro': 'romanian',
            'sr': 'serbian',
            'sw': 'swahili',
            'ja': 'japanese',
            'ko': 'korean',
            'hi': 'hindi'
        };

        const sourceLanguage = LANG_CODE_TO_FULL_NAME[sourceLanguageCode];
        let targetLanguage = LANG_CODE_TO_FULL_NAME[targetLanguageCode];

        // Fallback for invalid target languages
        const validTargetLanguages = ['english', 'russian', 'french', 'italian', 'portuguese',
                                     'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
                                     'romanian', 'serbian', 'swahili', 'japanese', 'korean', 'hindi'];

        if (!validTargetLanguages.includes(targetLanguage)) {
            targetLanguage = (sourceLanguage === 'english') ? 'russian' : 'english';
            console.log(`Using fallback target language: ${targetLanguage}`);
        }

        const sourceTableName = `source_words_${sourceLanguage}`;
        const translationTableName = `target_translations_${targetLanguage}`;

        console.log(`Source table: ${sourceTableName}`);
        console.log(`Translation table: ${translationTableName}`);

        let query = `
            SELECT
                sw.id,
                sw.word,
                uwp.status
            FROM ${sourceTableName} sw
            INNER JOIN user_word_progress uwp ON (
                uwp.source_word_id = sw.id
                AND uwp.source_language = $1
                AND uwp.user_id = $2
                AND uwp.language_pair_id = $3
            )
            WHERE (uwp.status = 'new' OR uwp.status = 'studying' OR uwp.status = 'learning')
            ORDER BY uwp.created_at DESC LIMIT $4 OFFSET $5
        `;

        const result = await db.query(query, [sourceLanguage, userId, languagePairId, limit, offset]);

        console.log(`\nQuery returned ${result.rows.length} words`);
        console.log('First 5 words:', result.rows.slice(0, 5).map(w => ({ id: w.id, word: w.word, status: w.status })));
        console.log('Last 5 words:', result.rows.slice(-5).map(w => ({ id: w.id, word: w.word, status: w.status })));

        await db.end();
    } catch (err) {
        console.error('Error:', err);
        await db.end();
        process.exit(1);
    }
}

checkUser61Words();
