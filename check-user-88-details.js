#!/usr/bin/env node
/**
 * Check User 88 detailed status
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUser88() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('USER 88 DETAILED STATUS');
        console.log('='.repeat(80) + '\n');

        // 1. User info
        const user = await db.query(`
            SELECT id, username, email
            FROM users
            WHERE id = 88
        `);

        if (user.rows.length === 0) {
            console.log('❌ User 88 not found');
            await db.end();
            return;
        }

        const u = user.rows[0];
        console.log(`User: ${u.email || u.username}`);

        // 2. Language pairs
        console.log('\n📚 Language Pairs:\n');
        const pairs = await db.query(`
            SELECT id, from_lang, to_lang, name, active
            FROM language_pairs
            WHERE user_id = 88
            ORDER BY id
        `);

        pairs.rows.forEach(p => {
            console.log(`   LP ${p.id}: ${p.name} (${p.from_lang} → ${p.to_lang}) ${p.active ? '✅' : '❌'}`);
        });

        // 3. Word lists
        console.log('\n📝 Word Lists:\n');
        const lists = await db.query(`
            SELECT id, name, language_pair_id, words_count
            FROM word_lists
            WHERE user_id = 88
            ORDER BY id DESC
        `);

        if (lists.rows.length === 0) {
            console.log('   No word lists found');
        } else {
            lists.rows.forEach(l => {
                console.log(`   List ${l.id}: "${l.name}" (LP ${l.language_pair_id}, ${l.words_count} words)`);
            });
        }

        // 4. Word progress (all statuses)
        console.log('\n📊 Word Progress (ALL statuses):\n');
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
                console.log(`      ${p.status.padEnd(15)}: ${p.count.toString().padStart(5)} words`);
            });
        }

        // 5. Check if word sets are available for hi-de
        console.log('\n📚 Available Word Sets for Hindi → German:\n');
        const sets = await db.query(`
            SELECT id, title, level, word_count
            FROM word_sets
            WHERE source_language = 'hindi'
                AND title LIKE '%→ German%'
                AND is_public = true
            ORDER BY id
            LIMIT 10
        `);

        if (sets.rows.length === 0) {
            console.log('   ❌ NO WORD SETS FOUND');
        } else {
            console.log(`   ✅ Found ${sets.rows.length}+ word sets (showing first 10):`);
            sets.rows.forEach(s => {
                console.log(`      Set ${s.id}: ${s.title} (${s.word_count} words)`);
            });
        }

        // 6. Check if words from a set exist
        if (sets.rows.length > 0) {
            const firstSet = sets.rows[0];
            console.log(`\n🔍 Checking words in set ${firstSet.id}:\n`);

            const setWords = await db.query(`
                SELECT word_id, position
                FROM word_sets_words
                WHERE set_id = $1
                ORDER BY position
                LIMIT 5
            `, [firstSet.id]);

            console.log(`   ✅ Found ${setWords.rows.length} words in set (showing first 5):`);

            for (const sw of setWords.rows) {
                // Check if source word exists
                const sourceWord = await db.query(`
                    SELECT id, word
                    FROM source_words_hindi
                    WHERE id = $1
                `, [sw.word_id]);

                if (sourceWord.rows.length === 0) {
                    console.log(`      ❌ Word ID ${sw.word_id}: NOT FOUND in source_words_hindi`);
                } else {
                    const word = sourceWord.rows[0];

                    // Check if translation exists
                    const translation = await db.query(`
                        SELECT translation
                        FROM target_translations_german_from_hi
                        WHERE source_word_id = $1
                    `, [sw.word_id]);

                    if (translation.rows.length === 0) {
                        console.log(`      ⚠️  Word ID ${sw.word_id}: "${word.word}" → NO TRANSLATION`);
                    } else {
                        console.log(`      ✅ Word ID ${sw.word_id}: "${word.word}" → "${translation.rows[0].translation}"`);
                    }
                }
            }
        }

        // 7. Summary
        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80) + '\n');

        if (progress.rows.length === 0) {
            console.log('❌ PROBLEM: User has NO words in their progress');
            console.log('\n💡 Possible causes:');
            console.log('   1. User hasn\'t imported any word sets yet');
            console.log('   2. Import functionality is broken');
            console.log('   3. Word sets can\'t be imported due to missing source words or translations');

            if (sets.rows.length > 0) {
                console.log('\n✅ Word sets ARE available for this language pair');
                console.log('   → User needs to import words from Word Lists page');
            }
        } else {
            const total = progress.rows.reduce((sum, p) => sum + parseInt(p.count), 0);
            console.log(`✅ User has ${total} words in progress`);
        }

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

checkUser88();
