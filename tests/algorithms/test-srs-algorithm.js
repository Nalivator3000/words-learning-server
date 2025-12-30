#!/usr/bin/env node
/**
 * Spaced Repetition System (SRS) Algorithm Tests
 * Tests SM-2 algorithm implementation for optimal review intervals
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

// SM-2 Algorithm (Simplified)
function calculateNextReview(quality, repetitions, easinessFactor, previousInterval) {
    // quality: 0-5 (0=complete blackout, 5=perfect recall)
    // repetitions: number of consecutive correct answers
    // easinessFactor: difficulty multiplier (1.3 - 2.5)
    // previousInterval: days since last review

    if (quality < 3) {
        // Forgot - restart
        return { interval: 1, repetitions: 0, easinessFactor: Math.max(1.3, easinessFactor - 0.2) };
    }

    // Update ease factor
    let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, Math.min(2.5, newEF));

    let newReps = repetitions + 1;
    let interval;

    if (newReps === 1) {
        interval = 1; // 1 day
    } else if (newReps === 2) {
        interval = 6; // 6 days
    } else {
        interval = Math.round(previousInterval * newEF);
    }

    return { interval, repetitions: newReps, easinessFactor: newEF };
}

async function runTests() {
    console.log('\n🧠 Spaced Repetition System (SRS) Tests\n');
    console.log('━'.repeat(60));

    console.log('\n📐 Algorithm Logic Tests:');

    await test('Perfect recall (quality=5) increases interval', async () => {
        const result = calculateNextReview(5, 2, 2.5, 6);
        assert(result.interval > 6, `Expected interval > 6, got ${result.interval}`);
        assert(result.easinessFactor >= 2.5, `Expected EF >= 2.5, got ${result.easinessFactor}`);
    });

    await test('Good recall (quality=4) maintains interval', async () => {
        const result = calculateNextReview(4, 2, 2.5, 6);
        assert(result.interval >= 6, `Expected interval >= 6, got ${result.interval}`);
    });

    await test('Hard recall (quality=3) decreases EF', async () => {
        const initialEF = 2.5;
        const result = calculateNextReview(3, 2, initialEF, 6);
        assert(result.easinessFactor < initialEF, `Expected EF < ${initialEF}, got ${result.easinessFactor}`);
    });

    await test('Forgot (quality=2) resets to day 1', async () => {
        const result = calculateNextReview(2, 5, 2.5, 30);
        assert(result.interval === 1, `Expected interval 1, got ${result.interval}`);
        assert(result.repetitions === 0, `Expected reps 0, got ${result.repetitions}`);
    });

    await test('First review is always 1 day', async () => {
        const result = calculateNextReview(4, 0, 2.5, 0);
        assert(result.interval === 1, `Expected interval 1, got ${result.interval}`);
    });

    await test('Second review is always 6 days', async () => {
        const result = calculateNextReview(4, 1, 2.5, 1);
        assert(result.interval === 6, `Expected interval 6, got ${result.interval}`);
    });

    await test('Ease factor never goes below 1.3', async () => {
        const result = calculateNextReview(0, 0, 1.3, 1);
        assert(result.easinessFactor >= 1.3, `Expected EF >= 1.3, got ${result.easinessFactor}`);
    });

    await test('Ease factor never goes above 2.5', async () => {
        const result = calculateNextReview(5, 10, 2.5, 100);
        assert(result.easinessFactor <= 2.5, `Expected EF <= 2.5, got ${result.easinessFactor}`);
    });

    console.log('\n🗄️  Database SRS Data Tests:');

    await test('User progress table exists', async () => {
        const res = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'user_word_progress'
            )
        `);
        assert(res.rows[0].exists, 'user_word_progress table should exist');
    });

    await test('Progress has SRS columns', async () => {
        const res = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user_word_progress'
            AND column_name IN ('repetitions', 'easiness_factor', 'interval_days', 'next_review')
        `);
        assert(res.rows.length >= 3, `Expected at least 3 SRS columns, found ${res.rows.length}`);
    });

    await test('Check SRS data distribution', async () => {
        const res = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE interval_days = 1) as day_1,
                COUNT(*) FILTER (WHERE interval_days BETWEEN 2 AND 6) as week_1,
                COUNT(*) FILTER (WHERE interval_days BETWEEN 7 AND 30) as month_1,
                COUNT(*) FILTER (WHERE interval_days > 30) as long_term,
                COUNT(*) as total
            FROM user_word_progress
            WHERE next_review IS NOT NULL
        `);

        const total = parseInt(res.rows[0].total);
        if (total > 0) {
            console.log(`\n    → Day 1: ${res.rows[0].day_1}`);
            console.log(`    → Week 1: ${res.rows[0].week_1}`);
            console.log(`    → Month 1: ${res.rows[0].month_1}`);
            console.log(`    → Long-term: ${res.rows[0].long_term}`);
        } else {
            console.log(`\n    → No review data yet`);
        }
    });

    await test('No negative intervals', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM user_word_progress
            WHERE interval_days < 0
        `);
        assert(parseInt(res.rows[0].count) === 0, 'Should have no negative intervals');
    });

    await test('Ease factors within valid range', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM user_word_progress
            WHERE easiness_factor < 1.3 OR easiness_factor > 2.5
        `);
        assert(parseInt(res.rows[0].count) === 0, 'All ease factors should be 1.3-2.5');
    });

    console.log('\n📊 Interval Progression Tests:');

    await test('Simulate learning curve', async () => {
        // Simulate a word being learned with consistent good recall
        let state = { interval: 0, repetitions: 0, easinessFactor: 2.5 };
        const intervals = [];

        for (let i = 0; i < 10; i++) {
            state = calculateNextReview(4, state.repetitions, state.easinessFactor, state.interval);
            intervals.push(state.interval);
        }

        // Check exponential growth
        assert(intervals[0] === 1, `First interval should be 1, got ${intervals[0]}`);
        assert(intervals[1] === 6, `Second interval should be 6, got ${intervals[1]}`);
        assert(intervals[9] > intervals[5], 'Intervals should increase over time');

        console.log(`\n    → Intervals: ${intervals.join(', ')}`);
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
