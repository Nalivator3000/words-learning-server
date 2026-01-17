#!/usr/bin/env node
/**
 * Simple check for User 88
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function simpleCheck() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('USER 88 - SIMPLE CHECK');
        console.log('='.repeat(80) + '\n');

        // 1. Language pair
        const lp = await db.query(`
            SELECT * FROM language_pairs WHERE id = 92
        `);
        console.log('Language Pair 92:', lp.rows[0]);

        // 2. Skip word lists check (table doesn't exist or deprecated)

        // 3. Word progress for this user
        console.log('\n📊 Word Progress for User 88:\n');
        const progress = await db.query(`
            SELECT language_pair_id, status, COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = 88
            GROUP BY language_pair_id, status
            ORDER BY language_pair_id, status
        `);

        if (progress.rows.length === 0) {
            console.log('   ❌ NO WORD PROGRESS RECORDS');
        } else {
            let currentLP = null;
            progress.rows.forEach(p => {
                if (p.language_pair_id !== currentLP) {
                    currentLP = p.language_pair_id;
                    console.log(`\n   LP ${p.language_pair_id}:`);
                }
                console.log(`      ${p.status.padEnd(15)}: ${p.count}`);
            });
        }

        // 4. Check Hindi → German word sets
        console.log('\n\n📚 Hindi → German Word Sets:\n');
        const sets = await db.query(`
            SELECT id, title, level, word_count
            FROM word_sets
            WHERE source_language = 'hindi'
                AND title LIKE '%→ German%'
                AND is_public = true
            ORDER BY id
            LIMIT 5
        `);

        console.log(`   Found ${sets.rows.length}+ sets (first 5):`);
        sets.rows.forEach(s => {
            console.log(`      [${s.id}] ${s.title} (${s.word_count} words)`);
        });

        // 5. Check if user has imported any set
        if (sets.rows.length > 0) {
            const firstSet = sets.rows[0];

            console.log(`\n\n🔍 Checking if words from set ${firstSet.id} are in user's progress:\n`);

            // Get words from the set (word_id in word_set_items is the id in source_words_hindi)
            const setWords = await db.query(`
                SELECT word_id
                FROM word_set_items
                WHERE word_set_id = $1
                ORDER BY order_index
                LIMIT 10
            `, [firstSet.id]);

            console.log(`   Set has ${setWords.rows.length} words (checking first 10):`);

            // Check if these words are in user's word_progress
            let inProgressCount = 0;
            for (const sw of setWords.rows) {
                const inProgress = await db.query(`
                    SELECT status
                    FROM user_word_progress
                    WHERE user_id = 88
                        AND source_word_id = $1
                        AND language_pair_id = 92
                `, [sw.word_id]);

                if (inProgress.rows.length > 0) {
                    console.log(`      Word ${sw.word_id}: ✅ IN PROGRESS (${inProgress.rows[0].status})`);
                    inProgressCount++;
                } else {
                    console.log(`      Word ${sw.word_id}: ❌ NOT in progress`);
                }
            }

            console.log(`\n   Summary: ${inProgressCount}/${setWords.rows.length} words in progress`);

            if (inProgressCount === 0) {
                console.log(`\n   ⚠️  User has NOT imported any words from this set yet!`);
            }
        }

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

simpleCheck();
