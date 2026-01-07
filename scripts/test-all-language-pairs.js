const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Language code to full name mapping
const LANG_CODE_TO_FULL_NAME = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'uk': 'ukrainian', 'pt': 'portuguese', 'it': 'italian',
    'zh': 'chinese', 'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi',
    'ar': 'arabic', 'tr': 'turkish', 'pl': 'polish', 'ro': 'romanian',
    'sr': 'serbian', 'sw': 'swahili'
};

const sourceLanguagesWithExamples = ['english', 'german', 'spanish', 'french'];
const validTargetLanguages = ['english', 'russian', 'french', 'italian', 'portuguese',
                             'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
                             'romanian', 'serbian', 'swahili', 'japanese', 'korean', 'hindi'];

async function testLanguagePair(fromLang, toLang) {
    const sourceLanguageCode = fromLang;
    const targetLanguageCode = toLang;
    const sourceLanguage = LANG_CODE_TO_FULL_NAME[sourceLanguageCode] || sourceLanguageCode;
    const targetLanguage = LANG_CODE_TO_FULL_NAME[targetLanguageCode] || targetLanguageCode;

    const sourceTableName = `source_words_${sourceLanguage}`;
    let translationTableName;
    let useNativeExampleColumn = false;

    // Same logic as in server
    if (!validTargetLanguages.includes(targetLanguage)) {
        translationTableName = `target_translations_${targetLanguage}_from_${sourceLanguageCode}`;
        useNativeExampleColumn = true;
    } else {
        if (!sourceLanguagesWithExamples.includes(sourceLanguage)) {
            translationTableName = `target_translations_${targetLanguage}_from_${sourceLanguageCode}`;
        } else {
            translationTableName = `target_translations_${targetLanguage}`;
        }
    }

    const hasSourceExample = sourceLanguagesWithExamples.includes(sourceLanguage);
    const exampleSourceColumn = hasSourceExample
        ? `sw.example_${sourceLanguageCode}`
        : `''`;

    const exampleTranslationColumn = (useNativeExampleColumn && sourceLanguageCode === 'en')
        ? `COALESCE(tt.example_native, '')`
        : `COALESCE(tt.example_${targetLanguageCode}, '')`;

    // Check if tables exist
    const sourceTableExists = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
        );
    `, [sourceTableName]);

    const translationTableExists = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
        );
    `, [translationTableName]);

    const status = {
        pair: `${fromLang} → ${toLang}`,
        sourceTable: sourceTableName,
        sourceExists: sourceTableExists.rows[0].exists,
        translationTable: translationTableName,
        translationExists: translationTableExists.rows[0].exists,
        exampleSource: exampleSourceColumn,
        exampleTranslation: exampleTranslationColumn
    };

    return status;
}

async function testAll() {
    await client.connect();

    console.log('🔍 Testing all possible language pairs\n');

    // Test some problematic cases
    const testCases = [
        ['hi', 'en'], // Hindi → English (reported issue)
        ['ar', 'en'], // Arabic → English
        ['ru', 'en'], // Russian → English
        ['zh', 'en'], // Chinese → English
        ['en', 'de'], // English → German
        ['en', 'es'], // English → Spanish
        ['hi', 'ru'], // Hindi → Russian
        ['ar', 'fr'], // Arabic → French
    ];

    console.log('Testing language pairs:\n');

    for (const [from, to] of testCases) {
        const status = await testLanguagePair(from, to);
        const statusIcon = status.sourceExists && status.translationExists ? '✅' : '❌';

        console.log(`${statusIcon} ${status.pair}`);
        console.log(`   Source: ${status.sourceTable} (${status.sourceExists ? 'exists' : 'MISSING'})`);
        console.log(`   Translation: ${status.translationTable} (${status.translationExists ? 'exists' : 'MISSING'})`);
        console.log(`   Example source: ${status.exampleSource}`);
        console.log(`   Example translation: ${status.exampleTranslation}\n`);
    }

    await client.end();
}

testAll().catch(console.error);
