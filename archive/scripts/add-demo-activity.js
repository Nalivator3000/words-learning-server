/**
 * Add realistic activity to demo account for better screenshots
 * This script adds XP, streak, and word progress to make stats look active
 */

const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addDemoActivity() {
    const client = await pool.connect();

    try {
        console.log('📊 Adding activity to demo account...');

        // 1. Find demo user
        const userResult = await client.query(
            'SELECT id FROM users WHERE email = $1',
            ['demo@fluentflow.app']
        );

        if (userResult.rows.length === 0) {
            console.log('❌ Demo user not found. Run create-test-account.js first!');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log('✅ Found demo user, ID:', userId);

        // 2. Update user_stats with realistic activity
        await client.query(
            `UPDATE user_stats
             SET total_xp = 350,
                 level = 4,
                 current_streak = 5,
                 longest_streak = 7,
                 total_words_learned = 15,
                 total_quizzes_completed = 8,
                 coins = 120,
                 gems = 25,
                 last_activity_date = CURRENT_DATE
             WHERE user_id = $1`,
            [userId]
        );
        console.log('✅ Updated user stats: Level 4, 350 XP, 5-day streak');

        // 3. Mark some words as "learned" for better stats
        await client.query(
            `UPDATE words
             SET status = 'mastered',
                 correctcount = 5,
                 totalpoints = 100,
                 reviewcycle = 3,
                 lastreviewdate = NOW() - INTERVAL '1 day'
             WHERE user_id = $1
             AND id IN (
                 SELECT id FROM words WHERE user_id = $1 LIMIT 10
             )`,
            [userId]
        );
        console.log('✅ Marked 10 words as mastered');

        // 4. Mark some words as "learning" (in progress)
        await client.query(
            `UPDATE words
             SET status = 'learning',
                 correctcount = 2,
                 totalpoints = 40,
                 reviewcycle = 1,
                 lastreviewdate = NOW() - INTERVAL '2 hours'
             WHERE id IN (
                 SELECT id FROM words
                 WHERE user_id = $1
                 AND status = 'learning'
                 AND id NOT IN (
                     SELECT id FROM words WHERE user_id = $1 AND status = 'mastered'
                 )
                 LIMIT 15
             )`,
            [userId]
        );
        console.log('✅ Updated 15 words as in progress');

        // 5. Set some words as due for review
        await client.query(
            `UPDATE words
             SET nextreviewdate = NOW() - INTERVAL '1 hour'
             WHERE id IN (
                 SELECT id FROM words
                 WHERE user_id = $1
                 AND status = 'learning'
                 LIMIT 8
             )`,
            [userId]
        );
        console.log('✅ Set 8 words as due for review');

        console.log('\n🎉 Demo account activity added!');
        console.log('📊 Stats: Level 4, 350 XP, 5-day streak, 120 coins, 25 gems');
        console.log('📚 Words: 10 mastered, 15 learning, 8 due for review');
        console.log('\n🔗 Login at: https://words-learning-server-copy-production.up.railway.app/');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addDemoActivity().catch(console.error);
