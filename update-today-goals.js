#!/usr/bin/env node

/**
 * Update today's daily goals from 5 to 20
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateTodayGoals() {
    const client = await pool.connect();

    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`🔄 Updating today's goals (${today})...\n`);

        // Update today's goals from 5 to 20
        const updateResult = await client.query(`
            UPDATE daily_goals
            SET words_goal = 20
            WHERE goal_date = $1
            AND words_goal = 5
            RETURNING user_id, words_progress, words_goal;
        `, [today]);

        if (updateResult.rowCount === 0) {
            console.log('ℹ️  No goals needed updating (all already at 20 or different value)');
        } else {
            console.log(`✅ Updated ${updateResult.rowCount} goal(s) for today:\n`);
            updateResult.rows.forEach(row => {
                console.log(`   User ${row.user_id}: ${row.words_progress}/${row.words_goal} words`);
            });
        }

        // Show current state
        console.log('\n📊 Current goals for today:');
        const currentGoals = await client.query(`
            SELECT user_id, words_progress, words_goal, completed
            FROM daily_goals
            WHERE goal_date = $1
            ORDER BY user_id;
        `, [today]);

        currentGoals.rows.forEach(row => {
            const status = row.completed ? '✅' : '⏳';
            console.log(`   ${status} User ${row.user_id}: ${row.words_progress}/${row.words_goal} words`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run update
updateTodayGoals()
    .then(() => {
        console.log('\n✅ Update completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
