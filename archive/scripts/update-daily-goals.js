#!/usr/bin/env node

/**
 * Migration Script: Update daily goals from 5 to 20
 * Updates words_goal for all existing users who still have the old default value
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateDailyGoals() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting daily goals migration...');

        // Update words_goal from 5 to 20 in daily_goals table
        const updateResult = await client.query(`
            UPDATE daily_goals
            SET words_goal = 20
            WHERE words_goal = 5
            RETURNING user_id;
        `);

        console.log(`✅ Updated ${updateResult.rowCount} daily goal records from 5 to 20 words goal`);

        // Show current distribution
        const statsResult = await client.query(`
            SELECT
                words_goal,
                COUNT(*) as goal_count,
                COUNT(DISTINCT user_id) as user_count
            FROM daily_goals
            GROUP BY words_goal
            ORDER BY words_goal;
        `);

        console.log('\n📊 Current distribution of words_goal:');
        statsResult.rows.forEach(row => {
            console.log(`   ${row.words_goal} words: ${row.goal_count} records (${row.user_count} users)`);
        });

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
updateDailyGoals()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
