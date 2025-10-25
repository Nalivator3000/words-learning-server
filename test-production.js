/**
 * Production API Tests - FluentFlow
 * Tests critical endpoints with demo account
 */

const https = require('https');

const BASE_URL = 'https://words-learning-server-copy-production.up.railway.app';
const DEMO_USER = { email: 'demo@fluentflow.app', password: 'DemoPassword123!' };

let results = { passed: 0, failed: 0, tests: [] };
let userId = null;

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const req = https.request(url, {
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
    console.log('\n🧪 FluentFlow Production Tests\n');

    // Auth
    console.log('📝 Authentication:');
    await test('Login', async () => {
        const res = await request('POST', '/api/auth/login', DEMO_USER);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        userId = res.body.user.id;
        console.log(`    → User ID: ${userId}`);
    });

    await test('Invalid login', async () => {
        const res = await request('POST', '/api/auth/login', { ...DEMO_USER, password: 'wrong' });
        if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // User Data
    console.log('\n📊 User Data:');
    await test('Language pairs', async () => {
        const res = await request('GET', `/api/users/${userId}/language-pairs`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!Array.isArray(res.body)) throw new Error('Not an array');
        console.log(`    → ${res.body.length} pair(s)`);
    });

    await test('Gamification stats', async () => {
        const res = await request('GET', `/api/gamification/stats/${userId}`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        console.log(`    → Level ${res.body.level}, ${res.body.total_xp} XP`);
    });

    await test('Achievements', async () => {
        const res = await request('GET', `/api/gamification/achievements/${userId}`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        console.log(`    → ${res.body.length} achievement(s)`);
    });

    // Leaderboard
    console.log('\n🏅 Leaderboard:');
    await test('Global leaderboard', async () => {
        const res = await request('GET', '/api/gamification/leaderboard/global');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        console.log(`    → ${res.body.length} user(s)`);
    });

    await test('Weekly leaderboard', async () => {
        const res = await request('GET', '/api/gamification/leaderboard/weekly');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // Analytics
    console.log('\n📈 Analytics:');
    await test('Progress analytics', async () => {
        const res = await request('GET', `/api/analytics/progress/${userId}`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    await test('Daily goals', async () => {
        const res = await request('GET', `/api/gamification/daily-goals/${userId}`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // Health
    console.log('\n💓 Health:');
    await test('Server health', async () => {
        const res = await request('GET', '/');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // Results
    const total = results.passed + results.failed;
    const rate = ((results.passed / total) * 100).toFixed(1);

    console.log('\n' + '━'.repeat(50));
    console.log(`\n✅ Passed: ${results.passed}/${total}`);
    console.log(`❌ Failed: ${results.failed}/${total}`);
    console.log(`📈 Success: ${rate}%\n`);
    console.log('━'.repeat(50) + '\n');

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
