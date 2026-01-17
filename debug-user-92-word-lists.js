#!/usr/bin/env node
/**
 * Debug user 92 word lists issue
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugUser92() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('DEBUG USER 92 - WORD LISTS ISSUE');
        console.log('='.repeat(80) + '\n');

        // 1. Check user info
        console.log('👤 User Info:\n');
        const user = await db.query(`
            SELECT id, name, email, native_language, from_language, to_language
            FROM users
            WHERE id = 92
        `);

        if (user.rows.length === 0) {
            console.log('   ❌ User 92 not found!');
            return;
        }

        const u = user.rows[0];
        console.log(`   ID: ${u.id}`);
        console.log(`   Name: ${u.name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Native Language: ${u.native_language}`);
        console.log(`   From Language: ${u.from_language}`);
        console.log(`   To Language: ${u.to_language}`);

        // 2. Check language pair
        console.log('\n📚 Language Pair:\n');
        const langPair = await db.query(`
            SELECT id, from_language, to_language, active
            FROM language_pairs
            WHERE id = 92
        `);

        if (langPair.rows.length === 0) {
            console.log('   ❌ Language pair 92 not found!');
        } else {
            const lp = langPair.rows[0];
            console.log(`   ID: ${lp.id}`);
            console.log(`   From: ${lp.from_language} (learning)`);
            console.log(`   To: ${lp.to_language} (native)`);
            console.log(`   Active: ${lp.active}`);
            console.log(`   Expected pair code: ${lp.from_language}-${lp.to_language}`);
        }

        // 3. Check what word sets exist for Hindi
        console.log('\n📋 Available Hindi Word Sets:\n');
        const hindiSets = await db.query(`
            SELECT
                CASE
                    WHEN title LIKE '%→ German%' THEN 'Hindi → German'
                    WHEN title LIKE '%→ English%' THEN 'Hindi → English'
                    WHEN title LIKE '%German%' THEN 'Contains German'
                    WHEN title LIKE '%English%' THEN 'Contains English'
                    ELSE 'Hindi → English (default)'
                END as set_type,
                COUNT(*) as sets,
                MIN(id) as first_id,
                MAX(id) as last_id,
                MIN(title) as sample_title
            FROM word_sets
            WHERE source_language = 'hindi'
            GROUP BY set_type
            ORDER BY sets DESC
        `);

        hindiSets.rows.forEach(row => {
            console.log(`   ${row.set_type}:`);
            console.log(`      Sets: ${row.sets}`);
            console.log(`      ID range: ${row.first_id} - ${row.last_id}`);
            console.log(`      Sample: ${row.sample_title}`);
            console.log('');
        });

        // 4. Check what the API endpoint would return
        console.log('='.repeat(80));
        console.log('API SIMULATION - What word-lists endpoint returns');
        console.log('='.repeat(80) + '\n');

        // Simulate the query from word-lists-ui.js
        const fromLang = 'hi';
        const toLang = 'de';

        console.log(`Simulating request for: fromLanguage='${fromLang}', toLanguage='${toLang}'`);
        console.log('');

        // Current API query (likely the problem)
        console.log('❌ CURRENT API QUERY (checking source_language only):\n');
        const currentQuery = await db.query(`
            SELECT id, title, description, level, theme, word_count
            FROM word_sets
            WHERE source_language = $1
            ORDER BY level, title
            LIMIT 10
        `, [fromLang]);

        console.log(`   Returns ${currentQuery.rows.length} sets:`);
        currentQuery.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. [${row.id}] ${row.title} (${row.level}, ${row.word_count} words)`);
        });

        // What it SHOULD be
        console.log('\n✅ CORRECT QUERY (should filter by title pattern):\n');

        // Try filtering by title
        const correctQuery = await db.query(`
            SELECT id, title, description, level, theme, word_count
            FROM word_sets
            WHERE source_language = $1
            AND title LIKE '%→ German%'
            ORDER BY level, title
            LIMIT 10
        `, [fromLang]);

        console.log(`   Returns ${correctQuery.rows.length} sets:`);
        correctQuery.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. [${row.id}] ${row.title} (${row.level}, ${row.word_count} words)`);
        });

        // 5. Check the actual API endpoint code
        console.log('\n' + '='.repeat(80));
        console.log('NEXT STEPS');
        console.log('='.repeat(80) + '\n');

        console.log('The issue is likely in the /api/word-lists endpoint.');
        console.log('It needs to filter word sets by BOTH:');
        console.log('  1. source_language (fromLanguage)');
        console.log('  2. Title pattern to match target language');
        console.log('');
        console.log('For Hindi → German:');
        console.log('  - source_language = \'hindi\' OR \'hi\'');
        console.log('  - title LIKE \'%→ German%\' OR title LIKE \'%German%\'');
        console.log('');
        console.log('Need to check: server-postgresql.js /api/word-lists endpoint');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

debugUser92();
