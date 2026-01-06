#!/usr/bin/env node
/**
 * Check review statistics for test.de.ru@lexibooster.test user
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkReviewStats() {
    try {
        console.log('\n🔍 Checking review statistics for test.de.ru@lexibooster.test\n');
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

        // Get language pair
        const langPairResult = await db.query(
            'SELECT id, from_lang, to_lang FROM language_pairs WHERE user_id = $1',
            [user.id]
        );

        if (langPairResult.rows.length === 0) {
            console.log('❌ No language pair found!');
            return;
        }

        const langPair = langPairResult.rows[0];
        console.log(`\n📚 Language pair: ${langPair.from_lang} → ${langPair.to_lang} (ID: ${langPair.id})`);

        // Count words by status
        console.log('\n📊 Word counts by status:');
        console.log('-'.repeat(80));

        const countsResult = await db.query(`
            SELECT
                status,
                COUNT(*) as count,
                MIN(correct_count) as min_points,
                MAX(correct_count) as max_points,
                AVG(correct_count)::int as avg_points
            FROM user_word_progress
            WHERE user_id = $1 AND language_pair_id = $2
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
        `, [user.id, langPair.id]);

        countsResult.rows.forEach(row => {
            console.log(`  ${row.status.padEnd(15)} : ${row.count.toString().padStart(4)} words (points: ${row.min_points}-${row.max_points}, avg: ${row.avg_points})`);
        });

        // Show sample words for each review status
        console.log('\n📋 Sample words in review statuses:');
        console.log('-'.repeat(80));

        const reviewStatuses = ['review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120'];

        for (const status of reviewStatuses) {
            const sampleResult = await db.query(`
                SELECT
                    uwp.status,
                    uwp.correct_count,
                    uwp.review_cycle,
                    sw.word
                FROM user_word_progress uwp
                JOIN source_words_german sw ON sw.id = uwp.source_word_id
                WHERE uwp.user_id = $1
                AND uwp.language_pair_id = $2
                AND uwp.status = $3
                LIMIT 3
            `, [user.id, langPair.id, status]);

            if (sampleResult.rows.length > 0) {
                console.log(`\n  ${status}:`);
                sampleResult.rows.forEach(word => {
                    console.log(`    - ${word.word} (${word.correct_count} points, cycle ${word.review_cycle})`);
                });
            }
        }

        // Check what API endpoint returns
        console.log('\n🌐 Simulating API response:');
        console.log('-'.repeat(80));

        const counts = {
            new: 0,
            studying: 0,
            review: 0,
            review7: 0,
            review30: 0,
            learned: 0,
            mastered: 0,
            review_1: 0,
            review_3: 0,
            review_7: 0,
            review_14: 0,
            review_30: 0,
            review_60: 0,
            review_120: 0
        };

        countsResult.rows.forEach(row => {
            if (row.status === 'new') {
                counts.new = parseInt(row.count);
                counts.studying += parseInt(row.count);
            } else if (row.status === 'studying' || row.status === 'learning') {
                counts.studying += parseInt(row.count);
            } else if (row.status.startsWith('review_')) {
                counts.review += parseInt(row.count);
                const stage = row.status;
                if (counts.hasOwnProperty(stage)) {
                    counts[stage] = parseInt(row.count);
                }
                if (row.status === 'review_7') {
                    counts.review7 = parseInt(row.count);
                } else if (row.status === 'review_30') {
                    counts.review30 = parseInt(row.count);
                }
            } else if (row.status === 'learned' || row.status === 'mastered') {
                counts.learned += parseInt(row.count);
                if (row.status === 'mastered') {
                    counts.mastered = parseInt(row.count);
                }
            }
        });

        console.log('\nAPI Response (counts object):');
        console.log(JSON.stringify(counts, null, 2));

        console.log('\n✅ Check complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

checkReviewStats();
