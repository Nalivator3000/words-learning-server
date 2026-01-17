#!/usr/bin/env node
/**
 * Debug quiz issue - why only 7 words instead of 10?
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugQuizIssue() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('DEBUG: QUIZ WORDS ISSUE');
        console.log('='.repeat(80) + '\n');

        // 1. Check specific user: User 88, Hindi-German (LP 92)
        console.log('🔍 Target user: User 88 (Hindi → German):\n');
        const users = await db.query(`
            SELECT u.id, u.username, u.email, lp.id as lp_id, lp.from_lang, lp.to_lang
            FROM users u
            JOIN language_pairs lp ON lp.user_id = u.id
            WHERE u.id = 88 AND lp.id = 92
        `);

        if (users.rows.length === 0) {
            console.log('   No users found with Russian\n');
            await db.end();
            return;
        }

        users.rows.forEach(user => {
            console.log(`   User ${user.id}: ${user.email || user.username} (${user.from_lang}-${user.to_lang}, LP: ${user.lp_id})`);
        });

        // 2. Pick the first user and check their word progress
        const testUser = users.rows[0];
        console.log(`\n${'='.repeat(80)}`);
        console.log(`ANALYZING USER ${testUser.id}: ${testUser.email || testUser.username}`);
        console.log(`Language Pair: ${testUser.from_lang} → ${testUser.to_lang} (ID: ${testUser.lp_id})`);
        console.log('='.repeat(80) + '\n');

        // 3. Check word progress counts by status
        console.log('📊 Word Progress by Status:\n');
        const statusCounts = await db.query(`
            SELECT status, COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = $1 AND language_pair_id = $2
            GROUP BY status
            ORDER BY
                CASE status
                    WHEN 'new' THEN 1
                    WHEN 'studying' THEN 2
                    WHEN 'review_1' THEN 3
                    WHEN 'review_3' THEN 4
                    WHEN 'review_7' THEN 5
                    WHEN 'review_14' THEN 6
                    WHEN 'review_30' THEN 7
                    WHEN 'review_60' THEN 8
                    WHEN 'review_120' THEN 9
                    WHEN 'learned' THEN 10
                    ELSE 99
                END
        `, [testUser.id, testUser.lp_id]);

        let totalEligible = 0;
        statusCounts.rows.forEach(row => {
            console.log(`   ${row.status.padEnd(15)}: ${row.count.toString().padStart(5)} words`);
            if (['new', 'studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120'].includes(row.status)) {
                totalEligible += parseInt(row.count);
            }
        });

        console.log(`   ${'-'.repeat(30)}`);
        console.log(`   ELIGIBLE FOR QUIZ: ${totalEligible} words`);

        // 4. Test the actual API query - simulate what /api/words/random-proportional does
        console.log(`\n${'='.repeat(80)}`);
        console.log('SIMULATING API QUERY FOR 10 WORDS');
        console.log('='.repeat(80) + '\n');

        const sourceLanguageCode = testUser.from_lang;
        const targetLanguageCode = testUser.to_lang;

        // Map language codes to full names
        const LANG_CODE_TO_FULL_NAME = {
            'en': 'english', 'ru': 'russian', 'de': 'german', 'es': 'spanish',
            'fr': 'french', 'it': 'italian', 'pt': 'portuguese', 'pl': 'polish',
            'hi': 'hindi', 'ar': 'arabic', 'zh': 'chinese', 'ja': 'japanese',
            'ko': 'korean', 'tr': 'turkish', 'uk': 'ukrainian', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        const sourceLanguage = LANG_CODE_TO_FULL_NAME[sourceLanguageCode] || sourceLanguageCode;
        const targetLanguage = LANG_CODE_TO_FULL_NAME[targetLanguageCode] || targetLanguageCode;

        console.log(`Source: ${sourceLanguage} (${sourceLanguageCode})`);
        console.log(`Target: ${targetLanguage} (${targetLanguageCode})\n`);

        const sourceTableName = `source_words_${sourceLanguage}`;
        const baseTranslationTableName = `target_translations_${targetLanguage}`;

        // Check if base table exists and has translations
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

        console.log(`Using translation table: ${translationTableName}`);
        console.log(`Base table mode: ${useBaseTable}\n`);

        // Get eligible statuses
        const eligibleStatuses = ['new', 'studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120'];

        // Try to get 10 words with valid translations
        console.log('Attempting to fetch 10 words with translations...\n');

        for (const status of eligibleStatuses) {
            const statusCount = statusCounts.rows.find(r => r.status === status);
            if (!statusCount) continue;

            console.log(`Testing status "${status}" (${statusCount.count} words available):`);

            const testQuery = `
                SELECT
                    sw.id,
                    sw.word,
                    tt.translation,
                    uwp.status
                FROM user_word_progress uwp
                JOIN ${sourceTableName} sw ON sw.id = uwp.source_word_id
                LEFT JOIN ${translationTableName} tt ON tt.source_word_id = sw.id
                    ${useBaseTable ? 'AND tt.source_lang = $5' : ''}
                WHERE uwp.status = $1
                    AND uwp.user_id = $2
                    AND uwp.language_pair_id = $3
                    AND uwp.source_language = $4
                LIMIT 3
            `;
            const queryParams = useBaseTable
                ? [status, testUser.id, testUser.lp_id, sourceLanguage, sourceLanguageCode]
                : [status, testUser.id, testUser.lp_id, sourceLanguage];

            const testResult = await db.query(testQuery, queryParams);

            const withTranslation = testResult.rows.filter(r => r.translation && r.translation !== '').length;
            const withoutTranslation = testResult.rows.length - withTranslation;

            console.log(`   Sampled 3 words: ${withTranslation} with translation, ${withoutTranslation} without`);

            if (withoutTranslation > 0) {
                console.log(`   ⚠️  Some words missing translations!`);
                testResult.rows.forEach(r => {
                    if (!r.translation || r.translation === '') {
                        console.log(`      - Word ID ${r.id}: "${r.word}" → NO TRANSLATION`);
                    }
                });
            }
            console.log('');
        }

        // 5. Summary
        console.log('='.repeat(80));
        console.log('DIAGNOSIS');
        console.log('='.repeat(80) + '\n');

        if (totalEligible < 10) {
            console.log(`❌ PROBLEM: User has only ${totalEligible} words eligible for quiz`);
            console.log(`   Need at least 10 words in eligible statuses.`);
        } else {
            console.log(`✅ User has ${totalEligible} eligible words`);
            console.log(`\n⚠️  If quiz still shows <10 words, the issue is likely:`);
            console.log(`   1. Some words don't have translations in ${translationTableName}`);
            console.log(`   2. The API filters out words with NULL or empty translations`);
            console.log(`\nTo fix: Ensure all source words have corresponding translations.`);
        }

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

debugQuizIssue();
