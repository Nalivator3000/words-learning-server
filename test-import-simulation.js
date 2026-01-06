const { Client } = require('pg');

async function simulateImport() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    await client.connect();

    try {
        const setId = 5; // First German set
        const userId = 50;
        const languagePairId = 54;

        console.log('Testing import of set', setId);

        // Step 1: Get word set info
        const wordSetResult = await client.query(
            'SELECT source_language, level, theme FROM word_sets WHERE id = $1',
            [setId]
        );

        if (wordSetResult.rows.length === 0) {
            console.log('❌ Word set not found');
            return;
        }

        const { source_language, level, theme } = wordSetResult.rows[0];
        console.log('✅ Word set found:', { source_language, level, theme });

        const sourceTableName = `source_words_${source_language}`;
        console.log('📋 Source table:', sourceTableName);

        // Step 2: Get language pair info
        const pairResult = await client.query(
            'SELECT from_lang, to_lang FROM language_pairs WHERE id = $1',
            [languagePairId]
        );

        if (pairResult.rows.length === 0) {
            console.log('❌ Language pair not found');
            return;
        }

        const { from_lang, to_lang } = pairResult.rows[0];
        console.log('✅ Language pair:', { from_lang, to_lang });

        // Map language codes
        const langCodeToName = {
            'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
            'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
            'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
            'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        const target_language = langCodeToName[to_lang] || to_lang;
        const translationTableName = `target_translations_${target_language}`;
        const exampleColumn = `example_${from_lang}`;

        console.log('📋 Translation table:', translationTableName);
        console.log('📋 Example column:', exampleColumn);

        // Build query
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (level) {
            whereConditions.push(`s.level = $${paramIndex}`);
            queryParams.push(level);
            paramIndex++;
        }

        if (theme && theme !== 'general') {
            whereConditions.push(`s.theme = $${paramIndex}`);
            queryParams.push(theme);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        queryParams.push(from_lang);

        const query = `
            SELECT
                s.id,
                s.word,
                s.level,
                s.theme,
                s.${exampleColumn} as example,
                t.translation,
                t.example_en as example_translation
            FROM ${sourceTableName} s
            LEFT JOIN ${translationTableName} t ON s.id = t.source_word_id AND t.source_lang = $${paramIndex}
            ${whereClause}
            ORDER BY s.id ASC
            LIMIT 5
        `;

        console.log('\n🔍 Final query:');
        console.log(query);
        console.log('🔍 Params:', queryParams);

        const wordsResult = await client.query(query, queryParams);
        console.log(`\n✅ Found ${wordsResult.rows.length} words`);
        console.log('Sample words:', wordsResult.rows);

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
    } finally {
        await client.end();
    }
}

simulateImport();
