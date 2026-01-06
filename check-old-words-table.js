#!/usr/bin/env node
/**
 * Check if user has words in old 'words' table
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkOldWordsTable() {
    try {
        console.log('\n🔍 Checking old words table for test.de.ru@lexibooster.test\n');
        console.log('='.repeat(80));

        // Find user
        const userResult = await db.query(
            'SELECT id, email FROM users WHERE email = $1',
            ['test.de.ru@lexibooster.test']
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log(`\n✅ Found user: ${user.email} (ID: ${user.id})`);

        // Check if 'words' table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'words'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('\n❌ Old "words" table does not exist');
            return;
        }

        console.log('\n✅ Old "words" table exists');

        // Count words by status in old table
        const countsResult = await db.query(`
            SELECT
                status,
                COUNT(*) as count,
                MIN(correctcount) as min_points,
                MAX(correctcount) as max_points,
                AVG(correctcount)::int as avg_points
            FROM words
            WHERE userid = $1
            GROUP BY status
            ORDER BY
                CASE
                    WHEN status = 'studying' THEN 1
                    WHEN status = 'learning' THEN 2
                    WHEN status = 'review_1' THEN 3
                    WHEN status = 'review_3' THEN 4
                    WHEN status = 'review_7' THEN 5
                    WHEN status = 'review_14' THEN 6
                    WHEN status = 'review_30' THEN 7
                    WHEN status = 'review_60' THEN 8
                    WHEN status = 'review_120' THEN 9
                    WHEN status = 'learned' THEN 10
                    WHEN status = 'mastered' THEN 11
                    ELSE 99
                END
        `, [user.id]);

        console.log('\n📊 Word counts by status (OLD table):');
        console.log('-'.repeat(80));

        let totalWords = 0;
        countsResult.rows.forEach(row => {
            totalWords += parseInt(row.count);
            console.log(`  ${row.status.padEnd(15)} : ${row.count.toString().padStart(4)} words (points: ${row.min_points}-${row.max_points}, avg: ${row.avg_points})`);
        });

        console.log('-'.repeat(80));
        console.log(`  TOTAL: ${totalWords} words`);

        // Sample words
        console.log('\n📋 Sample words from old table:');
        console.log('-'.repeat(80));

        const sampleResult = await db.query(`
            SELECT word, translation, status, correctcount
            FROM words
            WHERE userid = $1
            ORDER BY correctcount DESC
            LIMIT 10
        `, [user.id]);

        sampleResult.rows.forEach(word => {
            console.log(`  ${word.word.padEnd(20)} → ${word.translation.padEnd(20)} | ${word.status.padEnd(12)} | ${word.correctcount} points`);
        });

        console.log('\n✅ Check complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

checkOldWordsTable();
