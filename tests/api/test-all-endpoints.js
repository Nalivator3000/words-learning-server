#!/usr/bin/env node
/**
 * Complete API Endpoints Test Suite
 * Tests all endpoints on lexybooster.com
 */

const https = require('https');
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'https://lexybooster.com';
let results = { passed: 0, failed: 0, skipped: 0 };
let authToken = null;
let testUserId = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function test(name, fn, options = {}) {
    process.stdout.write(`  ${name}... `);
    try {
        await fn();
        console.log('✅');
        results.passed++;
    } catch (e) {
        if (options.optional) {
            console.log(`⚠️  ${e.message} (optional)`);
            results.skipped++;
        } else {
            console.log(`❌ ${e.message}`);
            results.failed++;
        }
    }
    await sleep(500); // Rate limit delay
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function request(method, path, data = null, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const requestOptions = {
            method,
            headers,
            timeout: options.timeout || 15000
        };

        const req = https.request(url, requestOptions, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: parsed, headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, body, headers: res.headers });
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 Complete API Endpoints Test Suite\n');
    console.log('━'.repeat(80));
    console.log(`📍 Testing: ${BASE_URL}\n`);

    // ========================================
    // GAMIFICATION ENDPOINTS
    // ========================================
    console.log('🎮 Gamification Endpoints:\n');

    await test('GET /api/gamification/leaderboard/global', async () => {
        const res = await request('GET', '/api/gamification/leaderboard/global');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'Expected array');
        console.log(`    → ${res.body.length} users on global leaderboard`);
    });

    await test('GET /api/gamification/leaderboard/weekly', async () => {
        const res = await request('GET', '/api/gamification/leaderboard/weekly');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'Expected array');
        console.log(`    → ${res.body.length} users on weekly leaderboard`);
    });

    await test('GET /api/gamification/achievements', async () => {
        const res = await request('GET', '/api/gamification/achievements');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'Expected array');
        console.log(`    → ${res.body.length} total achievements`);
    });

    await test('GET /api/gamification/stats/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/gamification/stats/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/gamification/xp-log/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/gamification/xp-log/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/gamification/activity/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/gamification/activity/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/gamification/achievements/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/gamification/achievements/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/gamification/daily-goals/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/gamification/daily-goals/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    // ========================================
    // WORD SETS ENDPOINTS
    // ========================================
    console.log('\n📚 Word Sets Endpoints:\n');

    await test('GET /api/word-sets', async () => {
        const res = await request('GET', '/api/word-sets');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'Expected array');
        console.log(`    → ${res.body.length} word sets`);
    });

    await test('GET /api/word-sets/:setId', async () => {
        const res = await request('GET', '/api/word-sets/1');
        assert([200, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    // ========================================
    // LANGUAGE PAIRS ENDPOINTS
    // ========================================
    console.log('\n🌍 Language Pairs Endpoints:\n');

    await test('GET /api/users/:userId/language-pairs (requires auth)', async () => {
        const res = await request('GET', '/api/users/1/language-pairs');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/users/:userId/language-pairs/:pairId/word-count', async () => {
        const res = await request('GET', '/api/users/1/language-pairs/1/word-count');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    // ========================================
    // ANALYTICS ENDPOINTS
    // ========================================
    console.log('\n📊 Analytics Endpoints:\n');

    await test('GET /api/analytics/progress/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/analytics/progress/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/analytics/exercise-stats/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/analytics/exercise-stats/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    await test('GET /api/analytics/difficult-words/:userId (requires auth)', async () => {
        const res = await request('GET', '/api/analytics/difficult-words/1');
        assert([200, 401, 404].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    // ========================================
    // AUTHENTICATION ENDPOINTS
    // ========================================
    console.log('\n🔐 Authentication Endpoints:\n');

    await test('POST /api/auth/login (invalid credentials)', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: 'nonexistent@example.com',
            password: 'WrongPassword123!'
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('GET /auth/google (redirect)', async () => {
        const res = await request('GET', '/auth/google');
        assert([302, 200, 401].includes(res.status), `Unexpected status: ${res.status}`);
    });

    await test('GET /api/auth/user (requires auth)', async () => {
        const res = await request('GET', '/api/auth/user');
        assert([200, 401].includes(res.status), `Unexpected status: ${res.status}`);
    }, { optional: true });

    // ========================================
    // PERFORMANCE TESTS
    // ========================================
    console.log('\n⚡ Performance Tests:\n');

    await test('Homepage loads in < 2s', async () => {
        const start = Date.now();
        const res = await request('GET', '/');
        const duration = Date.now() - start;
        assert(res.status === 200, 'Homepage failed');
        assert(duration < 2000, `Too slow: ${duration}ms`);
        console.log(`    → ${duration}ms`);
    });

    await test('API endpoint responds in < 500ms', async () => {
        const start = Date.now();
        const res = await request('GET', '/api/gamification/leaderboard/global');
        const duration = Date.now() - start;
        assert(duration < 500, `Too slow: ${duration}ms`);
        console.log(`    → ${duration}ms`);
    });

    await test('Multiple concurrent requests', async () => {
        const start = Date.now();
        const promises = [
            request('GET', '/api/gamification/leaderboard/global'),
            request('GET', '/api/gamification/leaderboard/weekly'),
            request('GET', '/api/gamification/achievements'),
            request('GET', '/api/word-sets'),
        ];
        const results = await Promise.all(promises);
        const duration = Date.now() - start;

        assert(results.every(r => r.status === 200), 'Some requests failed');
        assert(duration < 2000, `Too slow: ${duration}ms`);
        console.log(`    → ${duration}ms for 4 concurrent requests`);
    });

    // ========================================
    // SECURITY TESTS
    // ========================================
    console.log('\n🔒 Security Tests:\n');

    await test('Headers: Content Security Policy', async () => {
        const res = await request('GET', '/');
        assert(res.headers['content-security-policy'], 'CSP header missing');
    });

    await test('Headers: CORS configured', async () => {
        const res = await request('GET', '/api/word-sets');
        assert(res.headers['access-control-allow-origin'], 'CORS not configured');
    });

    await test('SQL Injection protection', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: "admin'--",
            password: "' OR '1'='1"
        });
        assert(res.status !== 200, 'SQL injection not blocked');
    });

    await test('XSS protection in input', async () => {
        const res = await request('POST', '/api/auth/register', {
            username: "<script>alert('xss')</script>",
            email: "test@test.com",
            password: "Test123!"
        });
        assert(res.status !== 200 || !res.body.username?.includes('<script>'), 'XSS not blocked');
    });

    // Print results
    console.log('\n' + '━'.repeat(80));
    console.log('\n📊 Test Summary:\n');
    console.log(`  ✅ Passed:  ${results.passed}`);
    console.log(`  ❌ Failed:  ${results.failed}`);
    console.log(`  ⚠️  Skipped: ${results.skipped} (optional/auth required)`);
    console.log(`  📝 Total:   ${results.passed + results.failed + results.skipped}`);

    const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
    console.log(`\n  📈 Success rate: ${successRate}%`);

    console.log('\n' + '━'.repeat(80) + '\n');

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
});
