const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

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

async function testGermanFix() {
    try {
        const userId = 61;
        const languagePairId = 65;
        const limit = 100000;
        const offset = 0;
        const status = 'studying';

        console.log('=== TESTING GERMAN FIX ===\n');

        // Get language pair info
        const langPairResult = await db.query(
            'SELECT from_lang, to_lang FROM language_pairs WHERE id = $1 AND user_id = $2',
            [languagePairId, userId]
        );

        const sourceLanguageCode = langPairResult.rows[0].from_lang;
        const targetLanguageCode = langPairResult.rows[0].to_lang;
        const sourceLanguage = LANG_CODE_TO_FULL_NAME[sourceLanguageCode];
        const targetLanguage = LANG_CODE_TO_FULL_NAME[targetLanguageCode];

        console.log(`Source: ${sourceLanguageCode} (${sourceLanguage})`);
        console.log(`Target: ${targetLanguageCode} (${targetLanguage})`);

        // Check if target is in validTargetLanguages
        const validTargetLanguages = ['english', 'russian', 'french', 'italian', 'portuguese',
                                     'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
                                     'romanian', 'serbian', 'swahili', 'japanese', 'korean', 'hindi'];

        const sourceTableName = `source_words_${sourceLanguage}`;
        let translationTableName;

        let useNativeExampleColumn = false;

        if (!validTargetLanguages.includes(targetLanguage)) {
            translationTableName = `target_translations_${targetLanguage}_from_${sourceLanguageCode}`;
            useNativeExampleColumn = true;
            console.log(`\n✅ Using translation table with source suffix: ${translationTableName}`);
        } else {
            translationTableName = `target_translations_${targetLanguage}`;
            console.log(`\n✅ Using base translation table: ${translationTableName}`);
        }

        // Check if table exists
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = $1
            )
        `, [translationTableName]);

        console.log(`Table exists: ${tableExists.rows[0].exists}`);

        if (!tableExists.rows[0].exists) {
            console.log('\n❌ ERROR: Translation table does not exist!');
            await db.end();
            return;
        }

        // Try to fetch words using the new logic
        const exampleTranslationColumn = useNativeExampleColumn
            ? 'tt.example_native'
            : `tt.example_${targetLanguageCode}`;

        let query = `
            SELECT
                sw.id,
                sw.word,
                tt.translation,
                sw.example_${sourceLanguageCode} as example,
                ${exampleTranslationColumn} as example_translation,
                uwp.status
            FROM ${sourceTableName} sw
            INNER JOIN user_word_progress uwp ON (
                uwp.source_word_id = sw.id
                AND uwp.source_language = $1
                AND uwp.user_id = $2
                AND uwp.language_pair_id = $3
            )
            LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                AND tt.source_lang = $4
            WHERE (uwp.status = 'new' OR uwp.status = 'studying' OR uwp.status = 'learning')
            ORDER BY uwp.created_at DESC LIMIT $5 OFFSET $6
        `;

        const result = await db.query(query, [sourceLanguage, userId, languagePairId, sourceLanguageCode, limit, offset]);

        console.log(`\n✅ Query returned ${result.rows.length} words`);
        console.log('\nFirst 10 words:');
        result.rows.slice(0, 10).forEach(w => {
            console.log(`  - ${w.word} → ${w.translation || '[NO TRANSLATION]'} (status: ${w.status})`);
        });

        if (result.rows.length > 0) {
            const withTranslation = result.rows.filter(w => w.translation).length;
            const withoutTranslation = result.rows.length - withTranslation;
            console.log(`\n✅ Words with translation: ${withTranslation}`);
            console.log(`⚠️  Words without translation: ${withoutTranslation}`);
        }

        await db.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
        await db.end();
        process.exit(1);
    }
}

testGermanFix();
