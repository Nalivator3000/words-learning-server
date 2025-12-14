#!/usr/bin/env node

/**
 * Check current user daily goals
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUserGoals() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking current daily goals...\n');

        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 Today: ${today}\n`);

        // Get all goals for today
        const todayGoals = await client.query(`
            SELECT
                user_id,
                goal_date,
                words_goal,
                words_progress,
                xp_goal,
                xp_progress,
                completed
            FROM daily_goals
            WHERE goal_date = $1
            ORDER BY user_id;
        `, [today]);

        console.log(`📊 Goals for today (${today}):`);
        console.log('─'.repeat(80));

        if (todayGoals.rows.length === 0) {
            console.log('⚠️  No goals found for today!');
        } else {
            todayGoals.rows.forEach(row => {
                console.log(`User ID: ${row.user_id}`);
                console.log(`  📚 Words: ${row.words_progress}/${row.words_goal} ${row.words_goal === 20 ? '✅' : '❌ (should be 20!)'}`);
                console.log(`  ⭐ XP: ${row.xp_progress}/${row.xp_goal}`);
                console.log(`  ${row.completed ? '✅ Completed' : '⏳ In progress'}`);
                console.log('─'.repeat(80));
            });
        }

        console.log('\n📊 All daily goals summary:');
        const summary = await client.query(`
            SELECT
                words_goal,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as users
            FROM daily_goals
            GROUP BY words_goal
            ORDER BY words_goal;
        `);

        summary.rows.forEach(row => {
            console.log(`  ${row.words_goal} words: ${row.count} records (${row.users} users)`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run check
checkUserGoals()
    .then(() => {
        console.log('\n✅ Check completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
