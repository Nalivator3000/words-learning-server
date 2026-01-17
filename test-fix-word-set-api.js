#!/usr/bin/env node
/**
 * Test the fixed API endpoint
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testFix() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('TEST FIX: Word Set API with native_lang=de');
        console.log('='.repeat(80) + '\n');

        // Simulate the API call with parameters: native_lang=de, languagePair=hi-de
        const setId = 12214;
        const native_lang = 'de';
        const languagePair = 'hi-de';

        console.log(`Fetching word set ${setId} with:`);
        console.log(`  native_lang: ${native_lang}`);
        console.log(`  languagePair: ${languagePair}\n`);

        // Get word set
        const setResult = await db.query('SELECT * FROM word_sets WHERE id = $1', [setId]);
        if (setResult.rows.length === 0) {
            console.log('❌ Word set not found');
            await db.end();
            return;
        }

        const wordSet = setResult.rows[0];
        console.log(`Word Set: ${wordSet.title}`);
        console.log(`Source Language: ${wordSet.source_language}\n`);

        // Determine target language using the FIXED logic
        let targetLang = 'english'; // default

        const langMap = {
            'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
            'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
            'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
            'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        const langToCode = {
            'english': 'en', 'german': 'de', 'spanish': 'es', 'french': 'fr',
            'russian': 'ru', 'italian': 'it', 'portuguese': 'pt', 'chinese': 'zh',
            'japanese': 'ja', 'korean': 'ko', 'hindi': 'hi', 'arabic': 'ar',
            'turkish': 'tr', 'ukrainian': 'uk', 'polish': 'pl', 'romanian': 'ro',
            'serbian': 'sr', 'swahili': 'sw'
        };

        const sourceLangCode = langToCode[wordSet.source_language] || wordSet.source_language.substring(0, 2);

        // Step 1: Try native_lang parameter (FIXED: now includes 'german')
        if (native_lang) {
            const nativeLangFull = langMap[native_lang] || native_lang;
            const validTargetLanguages = ['english', 'german', 'spanish', 'russian', 'french', 'italian', 'portuguese',
                                         'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
                                         'romanian', 'serbian', 'swahili', 'japanese', 'korean', 'hindi'];

            console.log('Checking native_lang parameter:');
            console.log(`  native_lang code: ${native_lang}`);
            console.log(`  nativeLangFull: ${nativeLangFull}`);
            console.log(`  validTargetLanguages includes '${nativeLangFull}': ${validTargetLanguages.includes(nativeLangFull)}`);
            console.log(`  nativeLangFull !== source_language: ${nativeLangFull !== wordSet.source_language}\n`);

            if (nativeLangFull !== wordSet.source_language && validTargetLanguages.includes(nativeLangFull)) {
                targetLang = nativeLangFull;
                console.log(`✅ Using native_lang parameter: ${native_lang} → ${targetLang}\n`);
            } else {
                targetLang = (wordSet.source_language === 'english') ? 'russian' : 'english';
                console.log(`❌ Falling back to: ${targetLang}\n`);
            }
        }

        console.log(`🎯 DETERMINED TARGET LANGUAGE: ${targetLang}\n`);

        // Now test fetching words with the correct translation table
        const sourceTableName = `source_words_${wordSet.source_language}`;
        const baseTranslationTableName = `target_translations_${targetLang}`;
        const targetLangCode = langToCode[targetLang] || targetLang.substring(0, 2);

        // Check which translation table to use
        let useBaseTable = false;
        try {
            const checkResult = await db.query(`
                SELECT COUNT(*) as count
                FROM ${baseTranslationTableName}
                WHERE source_lang = $1
                LIMIT 1
            `, [sourceLangCode]);
            useBaseTable = checkResult.rows[0].count > 0;
        } catch (err) {
            // Table doesn't exist, use the specific table
            useBaseTable = false;
        }

        const translationTableName = useBaseTable
            ? baseTranslationTableName
            : `${baseTranslationTableName}_from_${sourceLangCode}`;

        console.log(`Translation table: ${translationTableName}`);
        console.log(`Using base table: ${useBaseTable}\n`);

        // Fetch words
        const wordsResult = await db.query(`
            SELECT
                sw.id,
                sw.word,
                tt.translation,
                wsi.order_index
            FROM word_set_items wsi
            JOIN ${sourceTableName} sw ON wsi.word_id = sw.id
            LEFT JOIN ${translationTableName} tt ON sw.id = tt.source_word_id ${useBaseTable ? 'AND tt.source_lang = $2' : ''}
            WHERE wsi.word_set_id = $1
            ORDER BY wsi.order_index ASC
            LIMIT 10
        `, useBaseTable ? [setId, sourceLangCode] : [setId]);

        console.log('='.repeat(80));
        console.log('RESULTS (First 10 words):');
        console.log('='.repeat(80) + '\n');

        wordsResult.rows.forEach((word, index) => {
            console.log(`${index + 1}. "${word.word}" → "${word.translation}"`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('TEST RESULT');
        console.log('='.repeat(80) + '\n');

        const hasHindiWords = wordsResult.rows.some(w => w.word && /[\u0900-\u097F]/.test(w.word));
        const hasGermanTranslations = wordsResult.rows.some(w => w.translation && w.translation.length > 0);

        if (hasHindiWords && hasGermanTranslations) {
            console.log('✅ SUCCESS: Words are in Hindi with German translations!');
        } else if (!hasHindiWords) {
            console.log('❌ FAIL: Words are NOT in Hindi (expected Devanagari script)');
        } else {
            console.log('❌ FAIL: Missing German translations');
        }

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

testFix();
