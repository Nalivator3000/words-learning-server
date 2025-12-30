#!/usr/bin/env node
/**
 * Study Flow Integration Tests
 * Tests complete user learning flow
 */

const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER = { email: 'demo@fluentflow.app', password: 'DemoPassword123!' };

let results = { passed: 0, failed: 0 };
let userId = null;
let languagePairId = null;
let sessionId = null;

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const isHttps = BASE_URL.startsWith('https');
        const protocol = isHttps ? https : require('http');
        const url = new URL(path, BASE_URL);

        const req = protocol.request(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

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

async function runTests() {
    console.log('\n🎓 Study Flow Integration Tests\n');
    console.log('━'.repeat(60));

    // Phase 1: Authentication
    console.log('\n1️⃣  Authentication:');

    await test('User login', async () => {
        const res = await request('POST', '/api/auth/login', TEST_USER);
        if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
        userId = res.body.user.id;
        console.log(`    → User ID: ${userId}`);
    });

    // Phase 2: Setup
    console.log('\n2️⃣  Setup:');

    await test('Get language pair', async () => {
        const res = await request('GET', `/api/language-pairs/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        if (!res.body || res.body.length === 0) throw new Error('No language pairs');
        languagePairId = res.body[0].id;
        console.log(`    → Pair: ${res.body[0].from_lang}→${res.body[0].to_lang} (ID: ${languagePairId})`);
    });

    await test('Check initial stats', async () => {
        const res = await request('GET', `/api/stats/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → Level: ${res.body.level}, XP: ${res.body.total_xp}, Streak: ${res.body.current_streak}`);
    });

    // Phase 3: Study Session
    console.log('\n3️⃣  Study Session:');

    await test('Create study session', async () => {
        const res = await request('POST', '/api/study-sessions', {
            user_id: userId,
            language_pair_id: languagePairId,
            session_type: 'study'
        });

        if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Failed: ${res.status}`);
        }

        sessionId = res.body.id || res.body.session_id;
        console.log(`    → Session ID: ${sessionId}`);
    });

    await test('Get study cards', async () => {
        const res = await request('GET', `/api/study-sessions/${sessionId}/cards`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        if (!Array.isArray(res.body)) throw new Error('Response is not an array');
        if (res.body.length === 0) throw new Error('No cards returned');
        console.log(`    → ${res.body.length} cards`);
    });

    await test('Submit correct answer', async () => {
        // Get first card
        const cardsRes = await request('GET', `/api/study-sessions/${sessionId}/cards`);
        if (!cardsRes.body || cardsRes.body.length === 0) {
            console.log('    → No cards available, skipping');
            return;
        }

        const card = cardsRes.body[0];

        const res = await request('POST', `/api/study-sessions/${sessionId}/answer`, {
            word_id: card.word_id,
            is_correct: true,
            time_spent: 5000
        });

        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → XP earned: ${res.body.xp_earned || 'unknown'}`);
    });

    await test('Submit incorrect answer', async () => {
        const cardsRes = await request('GET', `/api/study-sessions/${sessionId}/cards`);
        if (!cardsRes.body || cardsRes.body.length < 2) {
            console.log('    → Not enough cards, skipping');
            return;
        }

        const card = cardsRes.body[1];

        const res = await request('POST', `/api/study-sessions/${sessionId}/answer`, {
            word_id: card.word_id,
            is_correct: false,
            time_spent: 3000
        });

        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → Card will repeat`);
    });

    // Phase 4: Review Session
    console.log('\n4️⃣  Review Session:');

    await test('Get due words', async () => {
        const res = await request('GET', `/api/words/due/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → ${res.body.length} due for review`);
    });

    // Phase 5: Statistics
    console.log('\n5️⃣  Statistics:');

    await test('Check updated stats', async () => {
        const res = await request('GET', `/api/stats/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → Level: ${res.body.level}, XP: ${res.body.total_xp}`);
    });

    await test('Get progress analytics', async () => {
        const res = await request('GET', `/api/stats/progress/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
    });

    await test('Get activity heatmap', async () => {
        const res = await request('GET', `/api/stats/heatmap/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → ${res.body.length} days of activity`);
    });

    // Phase 6: Achievements
    console.log('\n6️⃣  Achievements:');

    await test('Check achievements', async () => {
        const res = await request('GET', `/api/achievements/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        console.log(`    → ${res.body.length} achievement(s)`);
    });

    // Print results
    console.log('\n' + '━'.repeat(60));
    console.log(`\n✅ Passed: ${results.passed}/${results.passed + results.failed}`);
    console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);
    console.log('━'.repeat(60) + '\n');

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
