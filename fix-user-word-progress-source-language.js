const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/words_learning'
});

/**
 * Fix source_language in user_word_progress to match from_lang of language_pairs
 *
 * Problem: When importing word sets, source_language was set to word_set.source_language
 * instead of language_pair.from_lang, causing words to not appear in counts.
 *
 * Solution: Update all user_word_progress records to use the correct source_language
 * based on their language_pair.from_lang
 */
async function fixSourceLanguage() {
    try {
        console.log('=== FIXING source_language IN user_word_progress ===\n');

        // Language code to full name mapping
        const langCodeToName = {
            'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
            'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
            'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
            'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        // Step 1: Find all affected records
        console.log('Step 1: Finding records with mismatched source_language...\n');

        const checkQuery = `
            SELECT DISTINCT
                uwp.user_id,
                uwp.language_pair_id,
                uwp.source_language as current_source_language,
                lp.from_lang,
                COUNT(*) as affected_count
            FROM user_word_progress uwp
            JOIN language_pairs lp ON uwp.language_pair_id = lp.id
            WHERE uwp.source_language != CASE lp.from_lang
                WHEN 'de' THEN 'german'
                WHEN 'en' THEN 'english'
                WHEN 'es' THEN 'spanish'
                WHEN 'fr' THEN 'french'
                WHEN 'ru' THEN 'russian'
                WHEN 'it' THEN 'italian'
                WHEN 'pt' THEN 'portuguese'
                WHEN 'zh' THEN 'chinese'
                WHEN 'ja' THEN 'japanese'
                WHEN 'ko' THEN 'korean'
                WHEN 'hi' THEN 'hindi'
                WHEN 'ar' THEN 'arabic'
                WHEN 'tr' THEN 'turkish'
                WHEN 'uk' THEN 'ukrainian'
                WHEN 'pl' THEN 'polish'
                WHEN 'ro' THEN 'romanian'
                WHEN 'sr' THEN 'serbian'
                WHEN 'sw' THEN 'swahili'
                ELSE lp.from_lang
            END
            GROUP BY uwp.user_id, uwp.language_pair_id, uwp.source_language, lp.from_lang
            ORDER BY uwp.user_id, uwp.language_pair_id
        `;

        const checkResult = await pool.query(checkQuery);

        if (checkResult.rows.length === 0) {
            console.log('✅ No mismatched records found. All source_language values are correct!');
            return;
        }

        console.log(`Found ${checkResult.rows.length} user-language_pair combinations with mismatched source_language:\n`);
        checkResult.rows.forEach(row => {
            const correctSourceLang = langCodeToName[row.from_lang] || row.from_lang;
            console.log(`  User ${row.user_id}, Language Pair ${row.language_pair_id}:`);
            console.log(`    Current: ${row.current_source_language} → Should be: ${correctSourceLang}`);
            console.log(`    Affected records: ${row.affected_count}\n`);
        });

        // Step 2: Fix the records
        console.log('Step 2: Fixing source_language values...\n');

        const updateQuery = `
            UPDATE user_word_progress uwp
            SET source_language = CASE lp.from_lang
                WHEN 'de' THEN 'german'
                WHEN 'en' THEN 'english'
                WHEN 'es' THEN 'spanish'
                WHEN 'fr' THEN 'french'
                WHEN 'ru' THEN 'russian'
                WHEN 'it' THEN 'italian'
                WHEN 'pt' THEN 'portuguese'
                WHEN 'zh' THEN 'chinese'
                WHEN 'ja' THEN 'japanese'
                WHEN 'ko' THEN 'korean'
                WHEN 'hi' THEN 'hindi'
                WHEN 'ar' THEN 'arabic'
                WHEN 'tr' THEN 'turkish'
                WHEN 'uk' THEN 'ukrainian'
                WHEN 'pl' THEN 'polish'
                WHEN 'ro' THEN 'romanian'
                WHEN 'sr' THEN 'serbian'
                WHEN 'sw' THEN 'swahili'
                ELSE lp.from_lang
            END,
            updated_at = CURRENT_TIMESTAMP
            FROM language_pairs lp
            WHERE uwp.language_pair_id = lp.id
            AND uwp.source_language != CASE lp.from_lang
                WHEN 'de' THEN 'german'
                WHEN 'en' THEN 'english'
                WHEN 'es' THEN 'spanish'
                WHEN 'fr' THEN 'french'
                WHEN 'ru' THEN 'russian'
                WHEN 'it' THEN 'italian'
                WHEN 'pt' THEN 'portuguese'
                WHEN 'zh' THEN 'chinese'
                WHEN 'ja' THEN 'japanese'
                WHEN 'ko' THEN 'korean'
                WHEN 'hi' THEN 'hindi'
                WHEN 'ar' THEN 'arabic'
                WHEN 'tr' THEN 'turkish'
                WHEN 'uk' THEN 'ukrainian'
                WHEN 'pl' THEN 'polish'
                WHEN 'ro' THEN 'romanian'
                WHEN 'sr' THEN 'serbian'
                WHEN 'sw' THEN 'swahili'
                ELSE lp.from_lang
            END
        `;

        const updateResult = await pool.query(updateQuery);
        console.log(`✅ Updated ${updateResult.rowCount} records\n`);

        // Step 3: Verify the fix
        console.log('Step 3: Verifying the fix...\n');
        const verifyResult = await pool.query(checkQuery);

        if (verifyResult.rows.length === 0) {
            console.log('✅ Success! All source_language values are now correct.\n');
        } else {
            console.log(`⚠️ Warning: Still found ${verifyResult.rows.length} mismatched records after update:`);
            verifyResult.rows.forEach(row => {
                console.log(`  User ${row.user_id}, Language Pair ${row.language_pair_id}: ${row.current_source_language} (should be ${langCodeToName[row.from_lang]})`);
            });
        }

        // Step 4: Show updated counts for user 61 as example
        console.log('Step 4: Checking User 61 counts after fix...\n');
        const user61Result = await pool.query(`
            SELECT
                source_language,
                status,
                COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = 61
            GROUP BY source_language, status
            ORDER BY source_language, status
        `);

        console.log('User 61 word counts:');
        user61Result.rows.forEach(row => {
            console.log(`  ${row.source_language} - ${row.status}: ${row.count}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixSourceLanguage();
