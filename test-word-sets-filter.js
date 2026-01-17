#!/usr/bin/env node
/**
 * Test word sets filtering for Hindi - Updated logic
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testWordSetsFilter() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('TEST WORD SETS FILTERING - UPDATED LOGIC');
        console.log('='.repeat(80) + '\n');

        const langMap = {
            'ar': 'arabic',
            'de': 'german',
            'en': 'english',
            'es': 'spanish',
            'fr': 'french',
            'hi': 'hindi',
            'it': 'italian',
            'ja': 'japanese',
            'ko': 'korean',
            'pl': 'polish',
            'pt': 'portuguese',
            'ro': 'romanian',
            'ru': 'russian',
            'sr': 'serbian',
            'sw': 'swahili',
            'tr': 'turkish',
            'uk': 'ukrainian',
            'zh': 'chinese'
        };

        // Test 1: Hindi → English (hi-en)
        console.log('TEST 1: languagePair=hi-en (Hindi → English)\n');

        let query = 'SELECT * FROM word_sets WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        const learningLanguage1 = 'hi';
        const nativeLanguage1 = 'en';
        const fullLanguageName1 = langMap[learningLanguage1];
        const fullNativeName1 = langMap[nativeLanguage1];
        const nativeNameCapitalized1 = fullNativeName1.charAt(0).toUpperCase() + fullNativeName1.slice(1);

        query += ` AND source_language = $${paramIndex}`;
        params.push(fullLanguageName1);
        paramIndex++;

        if (nativeLanguage1 === 'en') {
            query += ` AND (title NOT LIKE '%→%' OR title LIKE $${paramIndex})`;
            params.push(`%→ ${nativeNameCapitalized1}%`);
        } else {
            query += ` AND title LIKE $${paramIndex}`;
            params.push(`%→ ${nativeNameCapitalized1}%`);
        }
        paramIndex++;

        query += ' AND is_public = true';
        query += ' ORDER BY level ASC, word_count DESC, title ASC';
        query += ' LIMIT 10';

        console.log('Query:', query);
        console.log('Params:', params);
        console.log('');

        const result1 = await db.query(query, params);
        console.log(`✅ Found ${result1.rows.length} sets:\n`);
        result1.rows.forEach((row, i) => {
            console.log(`${i + 1}. [${row.id}] ${row.title} (${row.level}, ${row.word_count} words)`);
        });

        // Test 2: Hindi → German (hi-de)
        console.log('\n' + '='.repeat(80));
        console.log('TEST 2: languagePair=hi-de (Hindi → German)\n');

        query = 'SELECT * FROM word_sets WHERE 1=1';
        params = [];
        paramIndex = 1;

        const learningLanguage2 = 'hi';
        const nativeLanguage2 = 'de';
        const fullLanguageName2 = langMap[learningLanguage2];
        const fullNativeName2 = langMap[nativeLanguage2];
        const nativeNameCapitalized2 = fullNativeName2.charAt(0).toUpperCase() + fullNativeName2.slice(1);

        query += ` AND source_language = $${paramIndex}`;
        params.push(fullLanguageName2);
        paramIndex++;

        if (nativeLanguage2 === 'en') {
            query += ` AND (title NOT LIKE '%→%' OR title LIKE $${paramIndex})`;
            params.push(`%→ ${nativeNameCapitalized2}%`);
        } else {
            query += ` AND title LIKE $${paramIndex}`;
            params.push(`%→ ${nativeNameCapitalized2}%`);
        }
        paramIndex++;

        query += ' AND is_public = true';
        query += ' ORDER BY level ASC, word_count DESC, title ASC';
        query += ' LIMIT 10';

        console.log('Query:', query);
        console.log('Params:', params);
        console.log('');

        const result2 = await db.query(query, params);
        console.log(`✅ Found ${result2.rows.length} sets:\n`);
        result2.rows.forEach((row, i) => {
            console.log(`${i + 1}. [${row.id}] ${row.title} (${row.level}, ${row.word_count} words)`);
        });

        // Verification: Check counts
        console.log('\n' + '='.repeat(80));
        console.log('VERIFICATION - Total counts\n');

        const verification = await db.query(`
            SELECT
                CASE
                    WHEN title LIKE '%→ German%' THEN 'Hindi → German'
                    WHEN title NOT LIKE '%→%' THEN 'Hindi (no arrow, default English)'
                    ELSE 'Other'
                END as type,
                COUNT(*) as count
            FROM word_sets
            WHERE source_language = 'hindi' AND is_public = true
            GROUP BY type
            ORDER BY count DESC
        `);

        verification.rows.forEach(row => {
            console.log(`${row.type}: ${row.count} sets`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('✅ TESTS COMPLETE');
        console.log('='.repeat(80) + '\n');

        console.log('Expected results:');
        console.log('  - hi-en should show ~162 sets (without arrow)');
        console.log('  - hi-de should show ~162 sets (with "→ German")');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

testWordSetsFilter();
