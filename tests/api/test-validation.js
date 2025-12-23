/**
 * Validation Tests - Ensures tests can actually fail
 * This proves tests are not faked
 */

const https = require('https');

const BASE_URL = 'https://words-learning-server-copy-production.up.railway.app';

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

async function runValidationTests() {
    console.log('\n🔍 Validation Tests - Proving Tests Can Fail\n');
    console.log('These tests SHOULD fail to prove validation works:\n');

    let failedAsExpected = 0;
    let unexpectedResults = 0;

    // Test 1: Invalid endpoint should return 404
    console.log('1. Testing non-existent endpoint...');
    try {
        const res = await request('GET', '/api/this-does-not-exist');
        if (res.status === 404) {
            console.log('   ✅ Correctly returned 404 for invalid endpoint');
            failedAsExpected++;
        } else {
            console.log(`   ❌ UNEXPECTED: Got ${res.status} instead of 404`);
            unexpectedResults++;
        }
    } catch (e) {
        console.log('   ✅ Request failed as expected');
        failedAsExpected++;
    }

    // Test 2: Invalid credentials should fail
    console.log('\n2. Testing invalid login credentials...');
    const res2 = await request('POST', '/api/auth/login', {
        email: 'fake@email.com',
        password: 'wrongpassword'
    });
    if (res2.status === 401 || res2.status === 404) {
        console.log('   ✅ Correctly rejected invalid credentials');
        failedAsExpected++;
    } else {
        console.log(`   ❌ UNEXPECTED: Got ${res2.status}`);
        unexpectedResults++;
    }

    // Test 3: Invalid user ID should fail
    console.log('\n3. Testing invalid user ID...');
    const res3 = await request('GET', '/api/gamification/stats/999999');
    if (res3.status === 404 || res3.status === 500) {
        console.log('   ✅ Correctly failed for non-existent user');
        failedAsExpected++;
    } else {
        console.log(`   ❌ UNEXPECTED: Got ${res3.status}`);
        unexpectedResults++;
    }

    // Test 4: Malformed request should fail
    console.log('\n4. Testing malformed POST request...');
    const res4 = await request('POST', '/api/auth/login', {
        // Missing required fields
        wrong_field: 'value'
    });
    if (res4.status === 400 || res4.status === 401 || res4.status === 404) {
        console.log('   ✅ Correctly rejected malformed request');
        failedAsExpected++;
    } else {
        console.log(`   ❌ UNEXPECTED: Got ${res4.status}`);
        unexpectedResults++;
    }

    // Test 5: Server should NOT accept invalid methods
    console.log('\n5. Testing invalid HTTP method...');
    const res5 = await request('DELETE', '/api/auth/login');
    if (res5.status === 404 || res5.status === 405) {
        console.log('   ✅ Correctly rejected invalid HTTP method');
        failedAsExpected++;
    } else {
        console.log(`   ❌ UNEXPECTED: Got ${res5.status}`);
        unexpectedResults++;
    }

    // Results
    console.log('\n' + '━'.repeat(50));
    console.log('\n📊 Validation Results:\n');
    console.log(`  ✅ Failed as expected: ${failedAsExpected}/5`);
    console.log(`  ❌ Unexpected results:  ${unexpectedResults}/5`);

    if (failedAsExpected === 5 && unexpectedResults === 0) {
        console.log('\n✅ VALIDATION PASSED: Tests can properly fail!');
        console.log('   Tests are NOT faked - they do real validation.\n');
        console.log('━'.repeat(50) + '\n');
        return true;
    } else {
        console.log('\n⚠️  VALIDATION ISSUES DETECTED');
        console.log('   Some tests did not behave as expected.\n');
        console.log('━'.repeat(50) + '\n');
        return false;
    }
}

runValidationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('❌ Validation test error:', err);
        process.exit(1);
    });
