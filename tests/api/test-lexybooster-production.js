#!/usr/bin/env node
/**
 * LexiBooster Production API Tests
 * Tests actual production endpoints on lexybooster.com
 */

const https = require('https');
require('dotenv').config();

const BASE_URL = 'https://lexybooster.com';
let results = { passed: 0, failed: 0 };

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    await sleep(1000); // Rate limit delay
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function request(method, path, data = null, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);

        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            timeout: options.timeout || 10000
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
    console.log('\n🌐 LexiBooster Production API Tests\n');
    console.log('━'.repeat(60));
    console.log(`📍 Testing: ${BASE_URL}\n`);

    console.log('🔍 Public Endpoints:\n');

    await test('Homepage loads', async () => {
        const res = await request('GET', '/');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('Leaderboard (Global)', async () => {
        const res = await request('GET', '/api/gamification/leaderboard/global');
        assert(res.status === 200 || res.status === 401, `Expected 200 or 401, got ${res.status}`);
        if (res.status === 200) {
            assert(Array.isArray(res.body), 'Expected array response');
            console.log(`    → ${res.body.length} users`);
        }
    });

    await test('Leaderboard (Weekly)', async () => {
        const res = await request('GET', '/api/gamification/leaderboard/weekly');
        assert(res.status === 200 || res.status === 401, `Expected 200 or 401, got ${res.status}`);
        if (res.status === 200) {
            assert(Array.isArray(res.body), 'Expected array response');
            console.log(`    → ${res.body.length} users this week`);
        }
    });

    await test('Achievements list', async () => {
        const res = await request('GET', '/api/gamification/achievements');
        assert(res.status === 200 || res.status === 401, `Expected 200 or 401, got ${res.status}`);
        if (res.status === 200) {
            assert(Array.isArray(res.body), 'Expected array response');
            console.log(`    → ${res.body.length} achievements`);
        }
    });

    await test('Word sets list', async () => {
        const res = await request('GET', '/api/word-sets');
        assert(res.status === 200 || res.status === 401, `Expected 200 or 401, got ${res.status}`);
        if (res.status === 200) {
            assert(Array.isArray(res.body), 'Expected array response');
            console.log(`    → ${res.body.length} word sets`);
        }
    });

    console.log('\n🔐 Authentication Tests:\n');

    await test('Login with test credentials', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'TestPassword123!'
        });
        // Should return 401 (invalid credentials) or 200 (if test user exists)
        assert([200, 401, 400].includes(res.status), `Unexpected status: ${res.status}`);
        console.log(`    → Status: ${res.status}`);
    });

    await test('Google auth endpoint exists', async () => {
        const res = await request('GET', '/auth/google');
        // Should redirect to Google OAuth
        assert([302, 200, 401].includes(res.status), `Unexpected status: ${res.status}`);
    });

    console.log('\n📊 Data Integrity Tests:\n');

    await test('Database connection', async () => {
        // Try to access an endpoint that requires DB
        const res = await request('GET', '/api/word-sets');
        assert(res.status !== 500, 'Server error - DB connection issue');
        assert(res.status !== 503, 'Service unavailable - DB down');
    });

    await test('CORS headers present', async () => {
        const res = await request('OPTIONS', '/api/word-sets');
        assert(res.headers['access-control-allow-origin'] !== undefined, 'CORS headers missing');
    });

    console.log('\n🚀 Performance Tests:\n');

    await test('Homepage loads < 2s', async () => {
        const start = Date.now();
        const res = await request('GET', '/');
        const duration = Date.now() - start;
        assert(res.status === 200, 'Homepage failed to load');
        assert(duration < 2000, `Too slow: ${duration}ms`);
        console.log(`    → ${duration}ms`);
    });

    await test('API response < 1s', async () => {
        const start = Date.now();
        const res = await request('GET', '/api/gamification/leaderboard/global');
        const duration = Date.now() - start;
        assert(duration < 1000, `Too slow: ${duration}ms`);
        console.log(`    → ${duration}ms`);
    });

    console.log('\n🔒 Security Tests:\n');

    await test('Security headers present', async () => {
        const res = await request('GET', '/');
        assert(res.headers['content-security-policy'] !== undefined, 'CSP missing');
        assert(res.headers['x-content-type-options'] !== undefined ||
               res.headers['content-type-options'] !== undefined, 'X-Content-Type-Options missing');
    });

    await test('SQL injection protection', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: "admin'--",
            password: "' OR '1'='1"
        });
        assert(res.status === 400 || res.status === 401, 'SQL injection not blocked');
    });

    await test('XSS protection', async () => {
        const res = await request('POST', '/api/auth/register', {
            username: "<script>alert('xss')</script>",
            email: "test@test.com",
            password: "Test123!"
        });
        // Should reject or sanitize
        assert(res.status !== 200 || !res.body.username?.includes('<script>'), 'XSS not blocked');
    });

    // Print results
    console.log('\n' + '━'.repeat(60));
    console.log(`\n✅ Passed: ${results.passed}/${results.passed + results.failed}`);
    console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);
    console.log(`📊 Success rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    console.log('━'.repeat(60) + '\n');

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
});
