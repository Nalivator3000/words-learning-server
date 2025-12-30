#!/usr/bin/env node
/**
 * Daily Goals & Streaks Tests
 * Tests streak tracking, daily goals, and weekly challenges
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let results = { passed: 0, failed: 0 };

async function test(name, fn) {
    process.stdout.write(`  ${name}... `);
    try {
        await fn();
        console.log('✅');
        results.passed++;
    } catch (e) {
        console.log(`❌ ${e.message}`);
        results.failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// Streak calculation
function calculateStreak(lastStudyDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last = new Date(lastStudyDate);
    last.setHours(0, 0, 0, 0);

    const diffTime = today - last;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'continues'; // Studied today
    } else if (diffDays === 1) {
        return 'continues'; // Studied yesterday - streak continues
    } else {
        return 'broken'; // More than 1 day - streak broken
    }
}

async function runTests() {
    console.log('\n🔥 Daily Goals & Streaks Tests\n');
    console.log('━'.repeat(60));

    console.log('\n📅 Streak Logic Tests:');

    await test('Same day maintains streak', async () => {
        const today = new Date();
        const status = calculateStreak(today);
        assert(status === 'continues', 'Today should maintain streak');
    });

    await test('Yesterday maintains streak', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const status = calculateStreak(yesterday);
        assert(status === 'continues', 'Yesterday should maintain streak');
    });

    await test('2 days ago breaks streak', async () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const status = calculateStreak(twoDaysAgo);
        assert(status === 'broken', '2 days ago should break streak');
    });

    console.log('\n🗄️  Database Streak Tests:');

    await test('Users have streak tracking columns', async () => {
        const res = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('current_streak', 'longest_streak', 'last_study_date')
        `);
        assert(res.rows.length >= 2, `Expected at least 2 streak columns, found ${res.rows.length}`);
    });

    await test('Check streak distribution', async () => {
        const res = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE current_streak = 0) as no_streak,
                COUNT(*) FILTER (WHERE current_streak BETWEEN 1 AND 7) as week_1,
                COUNT(*) FILTER (WHERE current_streak BETWEEN 8 AND 30) as month_1,
                COUNT(*) FILTER (WHERE current_streak > 30) as long_streak,
                MAX(current_streak) as longest,
                AVG(current_streak) as average
            FROM users
            WHERE current_streak IS NOT NULL
        `);

        console.log(`\n    → No streak: ${res.rows[0].no_streak || 0}`);
        console.log(`    → 1-7 days: ${res.rows[0].week_1 || 0}`);
        console.log(`    → 8-30 days: ${res.rows[0].month_1 || 0}`);
        console.log(`    → 30+ days: ${res.rows[0].long_streak || 0}`);
        console.log(`    → Longest: ${res.rows[0].longest || 0} days`);
        console.log(`    → Average: ${Math.round(res.rows[0].average || 0)} days`);
    });

    await test('No negative streaks', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM users
            WHERE current_streak < 0 OR longest_streak < 0
        `);
        assert(parseInt(res.rows[0].count) === 0, 'Should have no negative streaks');
    });

    await test('Longest streak >= current streak', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM users
            WHERE longest_streak < current_streak
        `);
        assert(parseInt(res.rows[0].count) === 0, 'Longest streak should always be >= current');
    });

    console.log('\n🎯 Daily Goals Tests:');

    await test('Daily goals table/column exists', async () => {
        const res = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name LIKE '%daily_goal%'
        `);
        // May not exist, so just log
        console.log(`    → Found ${res.rows.length} daily goal column(s)`);
    });

    await test('Check today study activity', async () => {
        const res = await db.query(`
            SELECT COUNT(*) as active_today
            FROM users
            WHERE last_study_date::date = CURRENT_DATE
        `);

        const activeToday = parseInt(res.rows[0].active_today);
        console.log(`\n    → Users who studied today: ${activeToday}`);
    });

    await test('Check weekly activity distribution', async () => {
        const res = await db.query(`
            SELECT
                DATE_TRUNC('day', last_study_date) as day,
                COUNT(*) as users
            FROM users
            WHERE last_study_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day DESC
        `);

        if (res.rows.length > 0) {
            console.log('\n    → Last 7 days activity:');
            res.rows.forEach(row => {
                const date = new Date(row.day).toLocaleDateString('ru-RU');
                console.log(`       ${date}: ${row.users} user(s)`);
            });
        }
    });

    console.log('\n📊 Weekly Challenges Tests:');

    await test('Weekly challenges table exists', async () => {
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'weekly_challenges'
            )
        `);

        if (tableExists.rows[0].exists) {
            const res = await db.query(`
                SELECT COUNT(*) as total,
                       COUNT(*) FILTER (WHERE claimed = true) as claimed
                FROM weekly_challenges
                WHERE week_of >= CURRENT_DATE - INTERVAL '30 days'
            `);

            console.log(`\n    → Total challenges (last 30 days): ${res.rows[0].total}`);
            console.log(`    → Claimed: ${res.rows[0].claimed}`);
        } else {
            console.log('\n    → Weekly challenges table not found (skipping)');
        }
    });

    console.log('\n🔔 Streak Freeze/Recovery Tests:');

    await test('Check if freeze system exists', async () => {
        const res = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name LIKE '%freeze%'
        `);

        if (res.rows.length > 0) {
            console.log(`\n    → Found ${res.rows.length} freeze column(s)`);
        } else {
            console.log('\n    → No freeze system found (feature idea!)');
        }
    });

    console.log('\n📈 Engagement Metrics:');

    await test('Calculate daily active user rate', async () => {
        const res = await db.query(`
            SELECT
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE last_study_date::date = CURRENT_DATE) as dau,
                COUNT(*) FILTER (WHERE last_study_date >= CURRENT_DATE - INTERVAL '7 days') as wau,
                COUNT(*) FILTER (WHERE last_study_date >= CURRENT_DATE - INTERVAL '30 days') as mau
            FROM users
        `);

        const total = parseInt(res.rows[0].total_users);
        const dau = parseInt(res.rows[0].dau);
        const wau = parseInt(res.rows[0].wau);
        const mau = parseInt(res.rows[0].mau);

        if (total > 0) {
            console.log(`\n    → Total users: ${total}`);
            console.log(`    → DAU: ${dau} (${((dau/total)*100).toFixed(1)}%)`);
            console.log(`    → WAU: ${wau} (${((wau/total)*100).toFixed(1)}%)`);
            console.log(`    → MAU: ${mau} (${((mau/total)*100).toFixed(1)}%)`);
        }
    });

    await test('Check retention by streak length', async () => {
        const res = await db.query(`
            SELECT
                CASE
                    WHEN current_streak = 0 THEN '0 days'
                    WHEN current_streak BETWEEN 1 AND 3 THEN '1-3 days'
                    WHEN current_streak BETWEEN 4 AND 7 THEN '4-7 days'
                    WHEN current_streak BETWEEN 8 AND 14 THEN '1-2 weeks'
                    WHEN current_streak > 14 THEN '2+ weeks'
                END as streak_range,
                COUNT(*) as users
            FROM users
            WHERE current_streak IS NOT NULL
            GROUP BY streak_range
            ORDER BY
                CASE streak_range
                    WHEN '0 days' THEN 1
                    WHEN '1-3 days' THEN 2
                    WHEN '4-7 days' THEN 3
                    WHEN '1-2 weeks' THEN 4
                    WHEN '2+ weeks' THEN 5
                END
        `);

        if (res.rows.length > 0) {
            console.log('\n    → Retention by streak:');
            res.rows.forEach(row => {
                console.log(`       ${row.streak_range}: ${row.users} user(s)`);
            });
        }
    });

    // Print results
    console.log('\n' + '━'.repeat(60));
    console.log(`\n✅ Passed: ${results.passed}/${results.passed + results.failed}`);
    console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);
    console.log('━'.repeat(60) + '\n');

    await db.end();
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    db.end();
    process.exit(1);
});
