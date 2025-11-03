// Quick API test script for new features
// Run: node scripts/test-features-api.js

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 1; // Replace with real test user

console.log('🧪 Testing Features API...\n');
console.log(`API URL: ${API_URL}`);
console.log(`Test User ID: ${TEST_USER_ID}\n`);

async function testEndpoint(name, url, options = {}) {
    try {
        console.log(`Testing: ${name}`);
        console.log(`  URL: ${url}`);

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            console.log(`  ✅ Status: ${response.status}`);
            console.log(`  📊 Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...\n');
            return { success: true, data };
        } else {
            console.log(`  ❌ Status: ${response.status}`);
            console.log(`  Error:`, data.message || data.error || 'Unknown error\n');
            return { success: false, error: data };
        }
    } catch (error) {
        console.log(`  ❌ Request failed: ${error.message}\n`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('DAILY CHALLENGES API');
    console.log('='.repeat(60) + '\n');

    await testEndpoint(
        'Get Daily Challenges',
        `${API_URL}/api/challenges/daily/${TEST_USER_ID}`
    );

    console.log('='.repeat(60));
    console.log('STREAK FREEZE API');
    console.log('='.repeat(60) + '\n');

    await testEndpoint(
        'Get Active Freezes',
        `${API_URL}/api/streak-freeze/${TEST_USER_ID}`
    );

    await testEndpoint(
        'Get Freeze History',
        `${API_URL}/api/streak-freeze/${TEST_USER_ID}/history`
    );

    console.log('='.repeat(60));
    console.log('BUG REPORTS API');
    console.log('='.repeat(60) + '\n');

    await testEndpoint(
        'Get User Bug Reports',
        `${API_URL}/api/bugs/user/${TEST_USER_ID}?limit=5`
    );

    console.log('='.repeat(60));
    console.log('GAMIFICATION API (for reward updates)');
    console.log('='.repeat(60) + '\n');

    await testEndpoint(
        'Get Gamification Stats',
        `${API_URL}/api/gamification/${TEST_USER_ID}`
    );

    console.log('\n✅ API testing complete!');
    console.log('\n📝 Note: Some endpoints may fail if test user doesn\'t exist or has no data.');
    console.log('   This is expected behavior. Focus on checking:');
    console.log('   1. Endpoints return valid JSON');
    console.log('   2. No 500 errors');
    console.log('   3. Error messages are descriptive');
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
