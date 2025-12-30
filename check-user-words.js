#!/usr/bin/env node
/**
 * Debug script - check words by user
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3
});

async function checkUserWords() {
    try {
        console.log('\n🔍 CHECKING WORDS BY USER\n');

        // Get all users
        const users = await db.query('SELECT id, name, email FROM users ORDER BY id LIMIT 10');

        console.log(`Found ${users.rows.length} users:\n`);

        for (const user of users.rows) {
            // Count words for this user
            const wordsCount = await db.query(
                'SELECT COUNT(*) FROM words WHERE user_id = $1',
                [user.id]
            );

            // Get language pairs
            const langPairs = await db.query(
                'SELECT id, name, from_lang, to_lang FROM language_pairs WHERE user_id = $1',
                [user.id]
            );

            console.log(`👤 User #${user.id}: ${user.name} (${user.email})`);
            console.log(`   📚 Total words: ${wordsCount.rows[0].count}`);

            if (langPairs.rows.length > 0) {
                console.log(`   🌍 Language pairs:`);
                for (const pair of langPairs.rows) {
                    const pairWords = await db.query(
                        'SELECT COUNT(*) FROM words WHERE user_id = $1 AND language_pair_id = $2',
                        [user.id, pair.id]
                    );
                    console.log(`      - ${pair.name} (ID: ${pair.id}): ${pairWords.rows[0].count} words`);
                }
            }
            console.log('');
        }

        // Check for words without user_id (orphaned words)
        const orphanedWords = await db.query(
            'SELECT COUNT(*) FROM words WHERE user_id IS NULL'
        );

        if (parseInt(orphanedWords.rows[0].count) > 0) {
            console.log(`⚠️  WARNING: ${orphanedWords.rows[0].count} words without user_id!`);
        }

        await db.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        await db.end();
        process.exit(1);
    }
}

checkUserWords();
