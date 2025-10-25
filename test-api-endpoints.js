/**
 * Automated API Testing Script for FluentFlow
 * Tests all critical endpoints with demo account
 */

const https = require('https');

const BASE_URL = 'https://words-learning-server-copy-production.up.railway.app';
const TEST_ACCOUNT = {
    email: 'demo@fluentflow.app',
    password: 'DemoPassword123!'
};

let authToken = null;
let userId = null;
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test function wrapper
async function test(name, testFn) {
    process.stdout.write(`  Testing: ${name}... `);
    try {
        await testFn();
        console.log('✅ PASS');
        testResults.passed++;
        testResults.tests.push({ name, status: 'PASS' });
    } catch (error) {
        console.log('❌ FAIL');
        console.log(`    Error: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({ name, status: 'FAIL', error: error.message });
    }
}

// Assertion helpers
function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual} (Status: ${actual})`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
    console.log('\n🧪 FluentFlow API Testing Suite\n');
    console.log('━'.repeat(60));

    // ========== Authentication Tests ==========
    console.log('\n📝 Authentication Tests:');

    await test('Login with demo account', async () => {
        const res = await makeRequest('POST', '/api/auth/login', TEST_ACCOUNT);
        assertEquals(res.statusCode, 200, 'Login should return 200');
        assertTrue(res.body.user, 'Response should contain user object');
        assertTrue(res.body.user.id, 'User should have ID');

        userId = res.body.user.id;
        authToken = res.headers['set-cookie']?.[0] || null;

        console.log(`    → User ID: ${userId}`);
    });

    await test('Login with invalid password', async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            email: TEST_ACCOUNT.email,
            password: 'WrongPassword123!'
        });
        assertEquals(res.statusCode, 401, 'Should return 401 for invalid password');
    });

    // ========== User Data Tests ==========
    console.log('\n👤 User Data Tests:');

    await test('Fetch user stats', async () => {
        const res = await makeRequest('GET', `/api/stats/${userId}`);
        console.log(`\n    DEBUG: Status ${res.statusCode}, Body:`, res.body);
        assertEquals(res.statusCode, 200, `Should return 200 (got ${res.statusCode})`);
        assertTrue(res.body.total_xp !== undefined, 'Should have total_xp');
        assertTrue(res.body.level !== undefined, 'Should have level');
        assertTrue(res.body.current_streak !== undefined, 'Should have current_streak');

        console.log(`    → Level: ${res.body.level}, XP: ${res.body.total_xp}, Streak: ${res.body.current_streak}`);
    });

    await test('Fetch language pairs', async () => {
        const res = await makeRequest('GET', `/api/language-pairs/${userId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');
        assertTrue(res.body.length > 0, 'Should have at least one language pair');

        console.log(`    → Found ${res.body.length} language pair(s)`);
    });

    // ========== Words Tests ==========
    console.log('\n📚 Words Tests:');

    await test('Fetch all words', async () => {
        const res = await makeRequest('GET', `/api/words/${userId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');
        assertTrue(res.body.length === 50, 'Should have 50 words');

        console.log(`    → Found ${res.body.length} words`);
    });

    await test('Fetch words by language pair', async () => {
        // First get language pair ID
        const pairsRes = await makeRequest('GET', `/api/language-pairs/${userId}`);
        const languagePairId = pairsRes.body[0].id;

        const res = await makeRequest('GET', `/api/words/${userId}?language_pair_id=${languagePairId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');

        console.log(`    → Found ${res.body.length} words for language pair ${languagePairId}`);
    });

    await test('Fetch due words for review', async () => {
        const res = await makeRequest('GET', `/api/words/due/${userId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');

        console.log(`    → Found ${res.body.length} due words`);
    });

    // ========== Study/Review Tests ==========
    console.log('\n🎓 Study/Review Tests:');

    await test('Start study session', async () => {
        const pairsRes = await makeRequest('GET', `/api/language-pairs/${userId}`);
        const languagePairId = pairsRes.body[0].id;

        const res = await makeRequest('POST', '/api/study-sessions', {
            user_id: userId,
            language_pair_id: languagePairId,
            session_type: 'study'
        });

        // Should return 200 or 201
        assertTrue(res.statusCode === 200 || res.statusCode === 201, 'Should return 200 or 201');

        console.log(`    → Study session created`);
    });

    // ========== Statistics Tests ==========
    console.log('\n📊 Statistics Tests:');

    await test('Fetch learning progress', async () => {
        const res = await makeRequest('GET', `/api/stats/progress/${userId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(res.body !== null, 'Should return data');

        console.log(`    → Progress data retrieved`);
    });

    await test('Fetch activity heatmap', async () => {
        const res = await makeRequest('GET', `/api/stats/heatmap/${userId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');

        console.log(`    → Heatmap data retrieved (${res.body.length} days)`);
    });

    // ========== Achievements Tests ==========
    console.log('\n🏆 Achievements Tests:');

    await test('Fetch user achievements', async () => {
        const res = await makeRequest('GET', `/api/achievements/${userId}`);
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');

        console.log(`    → Found ${res.body.length} achievement(s)`);
    });

    // ========== Leaderboard Tests ==========
    console.log('\n🏅 Leaderboard Tests:');

    await test('Fetch global leaderboard', async () => {
        const res = await makeRequest('GET', '/api/leaderboard/global');
        assertEquals(res.statusCode, 200, 'Should return 200');
        assertTrue(Array.isArray(res.body), 'Should return array');

        console.log(`    → Found ${res.body.length} user(s) on leaderboard`);
    });

    // ========== Health Check ==========
    console.log('\n💓 Health Check:');

    await test('Server health check', async () => {
        const res = await makeRequest('GET', '/');
        assertEquals(res.statusCode, 200, 'Server should be up');

        console.log(`    → Server is healthy`);
    });

    // ========== Print Results ==========
    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 Test Results Summary:\n');
    console.log(`  ✅ Passed: ${testResults.passed}`);
    console.log(`  ❌ Failed: ${testResults.failed}`);
    console.log(`  📝 Total:  ${testResults.passed + testResults.failed}`);

    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
    console.log(`  📈 Success Rate: ${successRate}%`);

    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.tests
            .filter(t => t.status === 'FAIL')
            .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }

    console.log('\n' + '━'.repeat(60));
    console.log(testResults.failed === 0 ? '\n✅ All tests passed! 🎉\n' : '\n⚠️  Some tests failed. Please review.\n');

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
