const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugProportionalWords() {
    try {
        console.log('=' .repeat(80));
        console.log('DEBUGGING PROPORTIONAL WORDS QUERY');
        console.log('='.repeat(80) + '\n');

        // First, find any active user with words
        const userResult = await db.query(`
            SELECT DISTINCT u.id, u.username, lp.id as language_pair_id, lp.from_lang, lp.to_lang
            FROM users u
            JOIN language_pairs lp ON lp.user_id = u.id
            JOIN user_word_progress uwp ON uwp.user_id = u.id AND uwp.language_pair_id = lp.id
            LIMIT 1
        `);

        if (userResult.rows.length === 0) {
            console.log('ERROR: No users with word progress found!');
            process.exit(1);
        }

        const testUser = userResult.rows[0];
        const userId = testUser.id;
        const languagePairId = testUser.language_pair_id;
        const totalWords = 10;
        const lp = testUser;

        console.log(`User ID: ${userId} (${testUser.username})`);
        console.log(`Language Pair ID: ${languagePairId}`);
        console.log(`Language Pair: ${lp.from_lang} → ${lp.to_lang}\n`);

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

        const sourceTableName = `source_words_${sourceLanguage}`;

        // Step 1: Get counts for each status
        console.log('STEP 1: Getting status counts');
        console.log('-'.repeat(80));
        const countsQuery = `
            SELECT status, COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = $1 AND language_pair_id = $2 AND source_language = $3
            AND status IN ('new', 'studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120')
            GROUP BY status
        `;
        const countsResult = await db.query(countsQuery, [userId, languagePairId, sourceLanguage]);

        const statusCounts = {};
        let totalAvailable = 0;

        countsResult.rows.forEach(row => {
            statusCounts[row.status] = parseInt(row.count);
            totalAvailable += parseInt(row.count);
            console.log(`  ${row.status}: ${row.count} words`);
        });

        console.log(`  ${'='.repeat(30)}`);
        console.log(`  TOTAL AVAILABLE: ${totalAvailable} words\n`);

        if (totalAvailable === 0) {
            console.log('ERROR: No words available!');
            process.exit(1);
        }

        // Step 2: Calculate proportional allocations
        console.log('STEP 2: Calculating proportional allocations');
        console.log('-'.repeat(80));
        const statusAllocations = {};
        let allocatedSoFar = 0;

        for (const [status, count] of Object.entries(statusCounts)) {
            const proportion = count / totalAvailable;
            const allocation = Math.round(proportion * totalWords);
            statusAllocations[status] = Math.min(allocation, count);
            allocatedSoFar += statusAllocations[status];
            console.log(`  ${status}: ${allocation} words (${(proportion * 100).toFixed(1)}%)`);
        }

        console.log(`  ${'='.repeat(30)}`);
        console.log(`  ALLOCATED: ${allocatedSoFar} / ${totalWords} words\n`);

        // Adjust if needed
        const diff = totalWords - allocatedSoFar;
        if (diff !== 0) {
            console.log(`  Adjusting allocation by ${diff} words...`);
            const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
            for (const [status, count] of sortedStatuses) {
                if (diff > 0 && statusAllocations[status] < count) {
                    const canAdd = Math.min(diff, count - statusAllocations[status]);
                    statusAllocations[status] += canAdd;
                    console.log(`  Added ${canAdd} to ${status}`);
                    break;
                } else if (diff < 0 && statusAllocations[status] > 0) {
                    const canRemove = Math.min(Math.abs(diff), statusAllocations[status]);
                    statusAllocations[status] -= canRemove;
                    console.log(`  Removed ${canRemove} from ${status}`);
                    break;
                }
            }
            console.log();
        }

        // Step 3: Determine translation table
        console.log('STEP 3: Determining translation table');
        console.log('-'.repeat(80));
        const SOURCE_LANGUAGES_WITH_EXAMPLES = ['english', 'german', 'spanish', 'french'];
        const hasSourceExample = SOURCE_LANGUAGES_WITH_EXAMPLES.includes(sourceLanguage);
        const baseTranslationTableName = `target_translations_${targetLanguage}`;

        console.log(`  Base translation table: ${baseTranslationTableName}`);
        console.log(`  Has source examples: ${hasSourceExample}`);

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

        console.log(`  Using table: ${translationTableName} (useBaseTable: ${useBaseTable})\n`);

        // Step 4: Fetch words for each status
        console.log('STEP 4: Fetching words for each status');
        console.log('-'.repeat(80));

        const exampleTranslationColumnActual = useBaseTable ? `example_${targetLanguageCode}` : 'example_native';
        const exampleSourceColumn = hasSourceExample ? `sw.example_${sourceLanguageCode}` : `''`;

        const allWords = [];
        let totalFetched = 0;

        for (const [status, allocation] of Object.entries(statusAllocations)) {
            if (allocation > 0) {
                console.log(`\n  Fetching ${allocation} words with status "${status}"...`);

                const wordsQuery = `
                    SELECT
                        sw.id,
                        sw.word,
                        ${exampleSourceColumn} as example,
                        COALESCE(tt.translation, '') as translation,
                        COALESCE(tt.${exampleTranslationColumnActual}, '') as exampleTranslation,
                        uwp.source_word_id,
                        uwp.status,
                        uwp.correct_count,
                        uwp.total_reviews,
                        uwp.next_review_date,
                        uwp.last_review_date
                    FROM user_word_progress uwp
                    JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
                    LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                        ${useBaseTable ? 'AND tt.source_lang = $6' : ''}
                    WHERE uwp.status = $1
                        AND uwp.user_id = $2
                        AND uwp.language_pair_id = $3
                        AND uwp.source_language = $4
                    ORDER BY RANDOM()
                    LIMIT $5
                `;
                const queryParams = useBaseTable
                    ? [status, userId, languagePairId, sourceLanguage, allocation, sourceLanguageCode]
                    : [status, userId, languagePairId, sourceLanguage, allocation];

                const wordsResult = await db.query(wordsQuery, queryParams);

                console.log(`    Requested: ${allocation}, Got: ${wordsResult.rows.length}`);

                if (wordsResult.rows.length < allocation) {
                    console.log(`    ⚠️  WARNING: Got fewer words than requested!`);

                    // Debug: Check how many words exist WITHOUT translation filter
                    const debugQuery = `
                        SELECT COUNT(*) as count
                        FROM user_word_progress uwp
                        JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
                        LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                            ${useBaseTable ? `AND tt.source_lang = '${sourceLanguageCode}'` : ''}
                        WHERE uwp.status = $1
                            AND uwp.user_id = $2
                            AND uwp.language_pair_id = $3
                            AND uwp.source_language = $4
                    `;
                    const debugResult = await db.query(debugQuery, [status, userId, languagePairId, sourceLanguage]);
                    console.log(`    Total words in DB (without translation filter): ${debugResult.rows[0].count}`);

                    // Debug: Check how many have NULL translations
                    const nullQuery = `
                        SELECT COUNT(*) as count
                        FROM user_word_progress uwp
                        JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
                        LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                            ${useBaseTable ? `AND tt.source_lang = '${sourceLanguageCode}'` : ''}
                        WHERE uwp.status = $1
                            AND uwp.user_id = $2
                            AND uwp.language_pair_id = $3
                            AND uwp.source_language = $4
                            AND (tt.translation IS NULL OR tt.translation = '')
                    `;
                    const nullResult = await db.query(nullQuery, [status, userId, languagePairId, sourceLanguage]);
                    console.log(`    Words with missing/empty translations: ${nullResult.rows[0].count}`);
                }

                wordsResult.rows.forEach(word => {
                    if (!word.translation) word.translation = '';
                    if (!word.exampletranslation) word.exampletranslation = '';
                });

                allWords.push(...wordsResult.rows);
                totalFetched += wordsResult.rows.length;
            }
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log(`FINAL RESULT: Fetched ${totalFetched} out of ${totalWords} requested words`);
        console.log('='.repeat(80) + '\n');

        if (totalFetched < totalWords) {
            console.log('⚠️  ISSUE FOUND: Not all words could be fetched!');
            console.log('This is likely because some words are missing translations.\n');
        }

        // Show sample of fetched words
        console.log('Sample of fetched words:');
        console.log('-'.repeat(80));
        allWords.slice(0, 5).forEach((word, i) => {
            console.log(`${i + 1}. ${word.word} → ${word.translation} (status: ${word.status})`);
        });

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await db.end();
    }
}

debugProportionalWords();
