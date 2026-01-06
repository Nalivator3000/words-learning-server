const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugQuery() {
    try {
        const setId = 1;
        const languagePairId = 54;

        // Get word set info
        const wordSet = await pool.query('SELECT source_language, level, theme FROM word_sets WHERE id = $1', [setId]);
        const { source_language, level } = wordSet.rows[0];

        // Get language pair
        const pair = await pool.query('SELECT from_lang, to_lang FROM language_pairs WHERE id = $1', [languagePairId]);
        const { from_lang, to_lang } = pair.rows[0];

        console.log('Source language:', source_language);
        console.log('From lang:', from_lang);
        console.log('To lang:', to_lang);
        console.log('Level:', level);

        // Build query exactly as in server code
        const langCodeToName = {
            'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
            'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
            'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
            'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        const target_language = langCodeToName[to_lang] || to_lang;
        const sourceTableName = `source_words_${source_language}`;
        const translationTableName = `target_translations_${target_language}`;
        const exampleColumn = `example_${from_lang}`;

        console.log('\nTable names:');
        console.log('Source table:', sourceTableName);
        console.log('Translation table:', translationTableName);
        console.log('Example column:', exampleColumn);

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
            LEFT JOIN ${translationTableName} t ON s.id = t.source_word_id AND t.source_lang = $2
            WHERE s.level = $1
            ORDER BY s.id ASC
            LIMIT 3
        `;

        console.log('\nExecuting query with params:', [level, from_lang]);
        const result = await pool.query(query, [level, from_lang]);

        console.log('\nFirst 3 words from query:');
        result.rows.forEach((row, i) => {
            console.log(`${i + 1}. ID: ${row.id}, Word: ${row.word}, Translation: ${row.translation || 'NULL'}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
        console.error('Detail:', err.detail);
    } finally {
        await pool.end();
    }
}

debugQuery();
