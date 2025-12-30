#!/usr/bin/env node
/**
 * Gamification Tests: XP & Leveling System
 * Tests XP calculation, level progression, and rewards
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

// XP Calculation Logic
function calculateXP(isCorrect, difficulty = 'normal', streak = 0) {
    let baseXP = isCorrect ? 10 : 2; // Base XP for correct/incorrect

    // Difficulty multiplier
    const difficultyMultipliers = {
        'easy': 0.8,
        'normal': 1.0,
        'hard': 1.5
    };
    baseXP *= (difficultyMultipliers[difficulty] || 1.0);

    // Streak bonus (every 5 correct in a row)
    if (streak > 0 && streak % 5 === 0) {
        baseXP += streak;
    }

    return Math.round(baseXP);
}

// Level Calculation
function calculateLevel(totalXP) {
    // Level formula: XP required = 100 * level^1.5
    // Level 1: 100 XP
    // Level 2: 283 XP
    // Level 3: 520 XP
    // etc.

    let level = 1;
    while (true) {
        const xpRequired = Math.floor(100 * Math.pow(level, 1.5));
        if (totalXP < xpRequired) break;
        level++;
    }
    return level - 1;
}

function xpRequiredForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

async function runTests() {
    console.log('\n🎮 Gamification: XP & Leveling Tests\n');
    console.log('━'.repeat(60));

    console.log('\n⭐ XP Calculation Tests:');

    await test('Correct answer gives 10 XP', async () => {
        const xp = calculateXP(true);
        assert(xp === 10, `Expected 10 XP, got ${xp}`);
    });

    await test('Incorrect answer gives 2 XP', async () => {
        const xp = calculateXP(false);
        assert(xp === 2, `Expected 2 XP, got ${xp}`);
    });

    await test('Hard difficulty gives 1.5x XP', async () => {
        const xp = calculateXP(true, 'hard');
        assert(xp === 15, `Expected 15 XP, got ${xp}`);
    });

    await test('Easy difficulty gives 0.8x XP', async () => {
        const xp = calculateXP(true, 'easy');
        assert(xp === 8, `Expected 8 XP, got ${xp}`);
    });

    await test('Streak bonus at 5 correct', async () => {
        const xpNoStreak = calculateXP(true, 'normal', 4);
        const xpWithStreak = calculateXP(true, 'normal', 5);
        assert(xpWithStreak > xpNoStreak, 'Streak 5 should give bonus');
    });

    console.log('\n📊 Level Progression Tests:');

    await test('0 XP = Level 1', async () => {
        const level = calculateLevel(0);
        assert(level === 1, `Expected level 1, got ${level}`);
    });

    await test('100 XP = Level 2', async () => {
        const level = calculateLevel(100);
        assert(level === 2, `Expected level 2, got ${level}`);
    });

    await test('1000 XP reaches level 4+', async () => {
        const level = calculateLevel(1000);
        assert(level >= 4, `Expected level >= 4, got ${level}`);
    });

    await test('Level progression is non-linear', async () => {
        const level5XP = xpRequiredForLevel(5);
        const level10XP = xpRequiredForLevel(10);
        const level15XP = xpRequiredForLevel(15);

        // XP gap should increase with level
        const gap1 = level10XP - level5XP;
        const gap2 = level15XP - level10XP;
        assert(gap2 > gap1, 'XP gap should increase at higher levels');

        console.log(`\n    → L5: ${level5XP} XP`);
        console.log(`    → L10: ${level10XP} XP`);
        console.log(`    → L15: ${level15XP} XP`);
    });

    console.log('\n🗄️  Database Gamification Tests:');

    await test('Users table has XP and level columns', async () => {
        const res = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('total_xp', 'level', 'current_streak')
        `);
        assert(res.rows.length >= 2, `Expected at least 2 gamification columns, found ${res.rows.length}`);
    });

    await test('Check XP distribution across users', async () => {
        const res = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE total_xp < 100) as beginners,
                COUNT(*) FILTER (WHERE total_xp BETWEEN 100 AND 1000) as intermediate,
                COUNT(*) FILTER (WHERE total_xp BETWEEN 1000 AND 5000) as advanced,
                COUNT(*) FILTER (WHERE total_xp > 5000) as experts,
                COUNT(*) as total,
                MAX(total_xp) as top_xp,
                AVG(total_xp) as avg_xp
            FROM users
        `);

        const total = parseInt(res.rows[0].total);
        if (total > 0) {
            console.log(`\n    → Beginners (<100 XP): ${res.rows[0].beginners}`);
            console.log(`    → Intermediate (100-1k): ${res.rows[0].intermediate}`);
            console.log(`    → Advanced (1k-5k): ${res.rows[0].advanced}`);
            console.log(`    → Experts (>5k): ${res.rows[0].experts}`);
            console.log(`    → Top XP: ${res.rows[0].top_xp || 0}`);
            console.log(`    → Avg XP: ${Math.round(res.rows[0].avg_xp || 0)}`);
        }
    });

    await test('Check level distribution', async () => {
        const res = await db.query(`
            SELECT level, COUNT(*) as users
            FROM users
            WHERE level IS NOT NULL
            GROUP BY level
            ORDER BY level
            LIMIT 10
        `);

        if (res.rows.length > 0) {
            console.log('\n    → Level distribution:');
            res.rows.forEach(row => {
                console.log(`       L${row.level}: ${row.users} user(s)`);
            });
        }
    });

    await test('No negative XP', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM users
            WHERE total_xp < 0
        `);
        assert(parseInt(res.rows[0].count) === 0, 'Should have no negative XP');
    });

    await test('Level matches XP', async () => {
        const res = await db.query(`
            SELECT id, total_xp, level
            FROM users
            WHERE total_xp IS NOT NULL AND level IS NOT NULL
            LIMIT 5
        `);

        for (const user of res.rows) {
            const expectedLevel = calculateLevel(user.total_xp);
            // Allow ±1 level difference (in case of manual adjustments)
            assert(
                Math.abs(user.level - expectedLevel) <= 1,
                `User ${user.id}: Expected level ${expectedLevel}, got ${user.level} (XP: ${user.total_xp})`
            );
        }
    });

    console.log('\n🏆 Achievement System Tests:');

    await test('Achievements table exists', async () => {
        const res = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'user_achievements'
            )
        `);
        assert(res.rows[0].exists, 'user_achievements table should exist');
    });

    await test('Check achievement types', async () => {
        const res = await db.query(`
            SELECT achievement_type, COUNT(*) as count
            FROM user_achievements
            GROUP BY achievement_type
            ORDER BY count DESC
        `);

        if (res.rows.length > 0) {
            console.log('\n    → Achievement types:');
            res.rows.forEach(row => {
                console.log(`       ${row.achievement_type}: ${row.count}`);
            });
        }
    });

    console.log('\n📈 Progression Simulation:');

    await test('Simulate 100 words learned', async () => {
        let totalXP = 0;
        let streak = 0;

        for (let i = 0; i < 100; i++) {
            const isCorrect = Math.random() > 0.2; // 80% success rate
            if (isCorrect) {
                streak++;
            } else {
                streak = 0;
            }
            totalXP += calculateXP(isCorrect, 'normal', streak);
        }

        const level = calculateLevel(totalXP);

        console.log(`\n    → Total XP earned: ${totalXP}`);
        console.log(`    → Level reached: ${level}`);
        console.log(`    → XP per word: ${Math.round(totalXP / 100)}`);

        assert(totalXP > 0, 'Should earn some XP');
        assert(level >= 2, 'Should reach at least level 2');
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
