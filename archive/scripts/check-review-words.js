#!/usr/bin/env node

/**
 * Check review words status
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkReviewWords() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking review words...\n');

        // Get all words by status
        const statusResult = await client.query(`
            SELECT
                status,
                COUNT(*) as count
            FROM words
            GROUP BY status
            ORDER BY status;
        `);

        console.log('📊 Words by status:');
        console.log('─'.repeat(50));
        statusResult.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count} words`);
        });

        // Get review words details
        console.log('\n🔎 Detailed review words:');
        console.log('─'.repeat(80));

        const reviewWords = await client.query(`
            SELECT
                id,
                word,
                translation,
                status,
                reviewcycle,
                nextreviewdate,
                user_id,
                language_pair_id
            FROM words
            WHERE status LIKE 'review_%'
            ORDER BY status, nextreviewdate
            LIMIT 20;
        `);

        if (reviewWords.rows.length === 0) {
            console.log('  ⚠️  No words in review status found!');
        } else {
            reviewWords.rows.forEach(row => {
                const nextReview = row.nextreviewdate ? new Date(row.nextreviewdate).toLocaleString('ru-RU') : 'Not set';
                const isDue = row.nextreviewdate ? new Date(row.nextreviewdate) <= new Date() : true;
                const dueStatus = isDue ? '✅ DUE NOW' : '⏰ Future';

                console.log(`  ${row.status} - "${row.word}" (${row.translation})`);
                console.log(`    User: ${row.user_id}, Pair: ${row.language_pair_id}, Cycle: ${row.reviewcycle}`);
                console.log(`    Next Review: ${nextReview} ${dueStatus}`);
                console.log('─'.repeat(80));
            });
        }

        // Check words that should be due for review
        console.log('\n⏰ Words DUE for review (nextReviewDate <= NOW):');
        console.log('─'.repeat(80));

        const dueWords = await client.query(`
            SELECT
                status,
                COUNT(*) as count
            FROM words
            WHERE status LIKE 'review_%'
            AND (nextreviewdate IS NULL OR nextreviewdate <= CURRENT_TIMESTAMP)
            GROUP BY status
            ORDER BY status;
        `);

        if (dueWords.rows.length === 0) {
            console.log('  ℹ️  No words are due for review right now');
        } else {
            dueWords.rows.forEach(row => {
                console.log(`  ${row.status}: ${row.count} words`);
            });
        }

        // Check for user_id=5 specifically
        console.log('\n👤 Your words (user_id=5):');
        console.log('─'.repeat(80));

        const userWords = await client.query(`
            SELECT
                status,
                COUNT(*) as count
            FROM words
            WHERE user_id = 5
            GROUP BY status
            ORDER BY status;
        `);

        userWords.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count} words`);
        });

        // Your review words details
        const userReview = await client.query(`
            SELECT
                word,
                translation,
                status,
                nextreviewdate
            FROM words
            WHERE user_id = 5
            AND status LIKE 'review_%'
            ORDER BY nextreviewdate
            LIMIT 10;
        `);

        if (userReview.rows.length > 0) {
            console.log('\n📚 Your review words (sample):');
            console.log('─'.repeat(80));
            userReview.rows.forEach(row => {
                const nextReview = row.nextreviewdate ? new Date(row.nextreviewdate).toLocaleString('ru-RU') : 'Not set';
                const isDue = row.nextreviewdate ? new Date(row.nextreviewdate) <= new Date() : true;
                console.log(`  ${row.status}: "${row.word}" → ${row.translation}`);
                console.log(`    Next: ${nextReview} ${isDue ? '✅' : '⏰'}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run check
checkReviewWords()
    .then(() => {
        console.log('\n✅ Check completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
