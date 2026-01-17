const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugUser7WordBuilding() {
    try {
        const userId = 7;

        console.log('=' .repeat(80));
        console.log(`DEBUGGING USER ${userId} - WORD BUILDING QUIZ ISSUE`);
        console.log('='.repeat(80) + '\n');

        // Step 1: Get user's language pair
        const lpResult = await db.query(`
            SELECT id, from_lang, to_lang
            FROM language_pairs
            WHERE user_id = $1
            ORDER BY id DESC
            LIMIT 1
        `, [userId]);

        if (lpResult.rows.length === 0) {
            console.log('ERROR: No active language pair found for user!');
            process.exit(1);
        }

        const lp = lpResult.rows[0];
        console.log(`User ${userId} active language pair:`);
        console.log(`  Language Pair ID: ${lp.id}`);
        console.log(`  From: ${lp.from_lang} → To: ${lp.to_lang}\n`);

        const LANG_CODE_TO_FULL_NAME = {
            'en': 'english', 'ru': 'russian', 'de': 'german', 'es': 'spanish',
            'fr': 'french', 'it': 'italian', 'pt': 'portuguese', 'pl': 'polish',
            'hi': 'hindi', 'ar': 'arabic', 'zh': 'chinese', 'ja': 'japanese',
            'ko': 'korean', 'tr': 'turkish', 'uk': 'ukrainian', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        const sourceLanguage = LANG_CODE_TO_FULL_NAME[lp.from_lang];
        const targetLanguage = LANG_CODE_TO_FULL_NAME[lp.to_lang];
        const sourceLanguageCode = lp.from_lang;
        const targetLanguageCode = lp.to_lang;

        console.log(`Source Language: ${sourceLanguage} (${sourceLanguageCode})`);
        console.log(`Target Language: ${targetLanguage} (${targetLanguageCode})\n`);

        // Step 2: Sample 5 words from user's progress
        console.log('STEP 2: Fetching sample words from user progress');
        console.log('-'.repeat(80));

        const sourceTableName = `source_words_${sourceLanguage}`;
        const SOURCE_LANGUAGES_WITH_EXAMPLES = ['english', 'german', 'spanish', 'french'];
        const hasSourceExample = SOURCE_LANGUAGES_WITH_EXAMPLES.includes(sourceLanguage);
        const baseTranslationTableName = `target_translations_${targetLanguage}`;

        // Check if base table exists and has data for this source lang
        const tableExistsResult = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = $1
            )
        `, [baseTranslationTableName]);

        let useBaseTable = false;
        if (tableExistsResult.rows[0].exists) {
            const checkResult = await db.query(`
                SELECT COUNT(*) as count
                FROM ${baseTranslationTableName}
                WHERE source_lang = $1
                LIMIT 1
            `, [sourceLanguageCode]);
            useBaseTable = checkResult.rows[0].count > 0;
        }

        const translationTableName = useBaseTable
            ? baseTranslationTableName
            : `${baseTranslationTableName}_from_${sourceLanguageCode}`;

        console.log(`  Using translation table: ${translationTableName}\n`);

        const exampleTranslationColumnActual = useBaseTable ? `example_${targetLanguageCode}` : 'example_native';
        const exampleSourceColumn = hasSourceExample ? `sw.example_${sourceLanguageCode}` : `''`;

        const wordsQuery = `
            SELECT
                sw.id,
                sw.word,
                ${exampleSourceColumn} as example,
                COALESCE(tt.translation, '') as translation,
                COALESCE(tt.${exampleTranslationColumnActual}, '') as "exampleTranslation",
                uwp.status
            FROM user_word_progress uwp
            JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
            LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                ${useBaseTable ? 'AND tt.source_lang = $4' : ''}
            WHERE uwp.user_id = $1
                AND uwp.language_pair_id = $2
                AND uwp.source_language = $3
            ORDER BY RANDOM()
            LIMIT 5
        `;

        const queryParams = useBaseTable
            ? [userId, lp.id, sourceLanguage, sourceLanguageCode]
            : [userId, lp.id, sourceLanguage];

        const wordsResult = await db.query(wordsQuery, queryParams);

        console.log(`Fetched ${wordsResult.rows.length} sample words:\n`);

        wordsResult.rows.forEach((word, i) => {
            console.log(`Word ${i + 1}:`);
            console.log(`  ID: ${word.id}`);
            console.log(`  Word (${sourceLanguageCode}): "${word.word}"`);
            console.log(`  Example (${sourceLanguageCode}): "${word.example || '(empty)'}"`);
            console.log(`  Translation (${targetLanguageCode}): "${word.translation}"`);
            console.log(`  Example Translation (${targetLanguageCode}): "${word.exampleTranslation}"`);
            console.log(`  Status: ${word.status}`);

            // CHECK: Is translation empty?
            if (!word.translation || word.translation.trim() === '') {
                console.log(`  ⚠️  WARNING: Translation is EMPTY or NULL!`);
                console.log(`      This word would be filtered out by the client and cause missing question text!`);
            } else {
                console.log(`  ✅ Translation is present`);
            }
            console.log();
        });

        // Step 3: Check how many words have missing translations
        console.log('STEP 3: Checking translation coverage');
        console.log('-'.repeat(80));

        const coverageQuery = `
            SELECT
                COUNT(*) as total_words,
                COUNT(tt.translation) as words_with_translation,
                COUNT(*) - COUNT(tt.translation) as words_without_translation,
                ROUND(100.0 * COUNT(tt.translation) / COUNT(*), 2) as coverage_percentage
            FROM user_word_progress uwp
            JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
            LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                ${useBaseTable ? `AND tt.source_lang = '${sourceLanguageCode}'` : ''}
            WHERE uwp.user_id = $1
                AND uwp.language_pair_id = $2
                AND uwp.source_language = $3
        `;

        const coverageResult = await db.query(coverageQuery, [userId, lp.id, sourceLanguage]);
        const stats = coverageResult.rows[0];

        console.log(`Total words in user progress: ${stats.total_words}`);
        console.log(`Words WITH translation: ${stats.words_with_translation}`);
        console.log(`Words WITHOUT translation: ${stats.words_without_translation}`);
        console.log(`Coverage: ${stats.coverage_percentage}%\n`);

        if (parseFloat(stats.coverage_percentage) < 100) {
            console.log('⚠️  ISSUE DETECTED:');
            console.log('Some words are missing translations. When the quiz filters out words');
            console.log('without translations, it may not have enough words to display.');
            console.log('This explains why the questionText might be empty!\n');
        }

        // Step 4: Show which specific words are missing translations
        if (stats.words_without_translation > 0) {
            console.log('STEP 4: Words missing translations (first 10)');
            console.log('-'.repeat(80));

            const missingQuery = `
                SELECT
                    sw.id,
                    sw.word,
                    uwp.status
                FROM user_word_progress uwp
                JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
                LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                    ${useBaseTable ? `AND tt.source_lang = '${sourceLanguageCode}'` : ''}
                WHERE uwp.user_id = $1
                    AND uwp.language_pair_id = $2
                    AND uwp.source_language = $3
                    AND (tt.translation IS NULL OR tt.translation = '')
                LIMIT 10
            `;

            const missingResult = await db.query(missingQuery, [userId, lp.id, sourceLanguage]);

            missingResult.rows.forEach((word, i) => {
                console.log(`${i + 1}. ID ${word.id}: "${word.word}" (${word.status})`);
            });
            console.log();
        }

        console.log('='.repeat(80));
        console.log('DIAGNOSIS COMPLETE');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await db.end();
    }
}

debugUser7WordBuilding();