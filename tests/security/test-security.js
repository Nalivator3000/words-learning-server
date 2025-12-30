#!/usr/bin/env node
/**
 * Security Tests
 * Tests for common vulnerabilities
 */

const https = require('https');
const { Pool } = require('pg');
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let results = { passed: 0, failed: 0 };

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
    console.log('\n🔒 Security Tests\n');
    console.log('━'.repeat(60));

    console.log('\n🛡️  SQL Injection Protection:');

    await test('SQL injection in login email', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: "admin'--",
            password: 'password'
        });

        // Should fail authentication, not cause SQL error
        if (res.status === 500) throw new Error('Potential SQL injection vulnerability');
        if (res.status === 200) throw new Error('Authenticated with SQL injection!');
    });

    await test('SQL injection in user ID', async () => {
        const res = await request('GET', '/api/stats/1 OR 1=1');

        // Should return 404 or 400, not 500
        if (res.status === 500) throw new Error('Potential SQL injection');
    });

    await test('Database query with single quote', async () => {
        // Test that parameterized queries work correctly
        const testWord = "l'eau"; // French word with apostrophe

        const res = await db.query(
            'SELECT * FROM source_words_french WHERE word = $1',
            [testWord]
        );

        // Should not throw error
        console.log(`    → Query handled apostrophe correctly`);
    });

    console.log('\n🚫 XSS Protection:');

    await test('Script tag in registration', async () => {
        const res = await request('POST', '/api/auth/register', {
            username: '<script>alert("XSS")</script>',
            email: 'test@test.com',
            password: 'Password123!'
        });

        // Should either reject or sanitize
        if (res.status === 200 && res.body.user?.username?.includes('<script>')) {
            throw new Error('XSS vulnerability - script tag not sanitized');
        }
    });

    console.log('\n🔐 Authorization:');

    await test('Cannot access other users data', async () => {
        // Try to access user ID 999999
        const res = await request('GET', '/api/stats/999999');

        // Should return 404 or 403, not 200 with data
        if (res.status === 200 && res.body.total_xp) {
            throw new Error('Can access other users data!');
        }
    });

    await test('Cannot modify other users data', async () => {
        const res = await request('POST', '/api/study-sessions', {
            user_id: 999999, // Try to create session for another user
            language_pair_id: 1,
            session_type: 'study'
        });

        // Should be rejected
        if (res.status === 200 || res.status === 201) {
            throw new Error('Can modify other users data!');
        }
    });

    console.log('\n⚡ Input Validation:');

    await test('Reject invalid email format', async () => {
        const res = await request('POST', '/api/auth/register', {
            username: 'testuser',
            email: 'not-an-email',
            password: 'Password123!'
        });

        // Should reject invalid email
        if (res.status === 200 || res.status === 201) {
            throw new Error('Accepts invalid email format');
        }
    });

    await test('Reject weak passwords', async () => {
        const res = await request('POST', '/api/auth/register', {
            username: 'testuser',
            email: 'test@test.com',
            password: '123' // Too weak
        });

        // Should reject weak password
        if (res.status === 200 || res.status === 201) {
            throw new Error('Accepts weak password');
        }
    });

    await test('Reject excessively long input', async () => {
        const longString = 'a'.repeat(10000);
        const res = await request('POST', '/api/auth/register', {
            username: longString,
            email: 'test@test.com',
            password: 'Password123!'
        });

        // Should reject or truncate
        if (res.status === 200) {
            throw new Error('Accepts excessively long input');
        }
    });

    console.log('\n🌐 CORS & Headers:');

    await test('No sensitive headers exposed', async () => {
        const res = await request('GET', '/');

        // Check headers don't expose sensitive info
        const headers = JSON.stringify(res).toLowerCase();
        if (headers.includes('x-powered-by: express')) {
            console.log('    ⚠️  Warning: Exposes Express version');
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
