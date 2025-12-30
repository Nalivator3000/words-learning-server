#!/usr/bin/env node
/**
 * Word Lists API Tests
 * Tests after recent bugfixes for native_lang parameter
 */

const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER = { email: 'demo@fluentflow.app', password: 'DemoPassword123!' };

let results = { passed: 0, failed: 0 };
let userId = null;
let languagePairId = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const isHttps = BASE_URL.startsWith('https');
        const protocol = isHttps ? https : require('http');
        const url = new URL(path, BASE_URL);

        const req = protocol.request(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 second timeout
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
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
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
    console.log('\n📋 Word Lists API Tests\n');
    console.log('━'.repeat(60));

    // Setup
    console.log('\n🔧 Setup:');
    await test('Login', async () => {
        const res = await request('POST', '/api/auth/login', TEST_USER);
        if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
        userId = res.body.user.id;
        console.log(`    → User ID: ${userId}`);
    });
    await sleep(1000); // Rate limit delay

    await test('Get language pair', async () => {
        const res = await request('GET', `/api/language-pairs/${userId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        if (!res.body || res.body.length === 0) throw new Error('No language pairs');
        languagePairId = res.body[0].id;
        console.log(`    → Language pair: ${res.body[0].from_lang}→${res.body[0].to_lang}`);
    });
    await sleep(1000); // Rate limit delay

    // Word Lists Tests
    console.log('\n📚 Word Lists:');

    await test('Fetch available word lists', async () => {
        const res = await request('GET', `/api/word-lists?language_pair_id=${languagePairId}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        if (!Array.isArray(res.body)) throw new Error('Response is not an array');
        console.log(`    → Found ${res.body.length} word list(s)`);
    });

    await test('Fetch word list content with correct native_lang', async () => {
        // Get first word list
        const listsRes = await request('GET', `/api/word-lists?language_pair_id=${languagePairId}`);
        if (!listsRes.body || listsRes.body.length === 0) {
            console.log('    → No word lists available, skipping');
            return;
        }

        const wordListId = listsRes.body[0].id;
        const nativeLang = listsRes.body[0].native_lang;

        const res = await request('GET', `/api/word-lists/${wordListId}/words?native_lang=${nativeLang}`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
        if (!Array.isArray(res.body)) throw new Error('Response is not an array');

        // Check that words are not "N/A N/A"
        if (res.body.length > 0) {
            const firstWord = res.body[0];
            if (firstWord.word === 'N/A' || firstWord.translation === 'N/A') {
                throw new Error('Words showing as N/A - native_lang bug not fixed!');
            }
        }

        console.log(`    → ${res.body.length} words, first: "${res.body[0]?.word}" = "${res.body[0]?.translation}"`);
    });

    await test('Filter by CEFR level', async () => {
        const listsRes = await request('GET', `/api/word-lists?language_pair_id=${languagePairId}`);
        if (!listsRes.body || listsRes.body.length === 0) {
            console.log('    → No word lists available, skipping');
            return;
        }

        const wordListId = listsRes.body[0].id;
        const nativeLang = listsRes.body[0].native_lang;

        const res = await request('GET', `/api/word-lists/${wordListId}/words?native_lang=${nativeLang}&level=A1`);
        if (res.status !== 200) throw new Error(`Failed: ${res.status}`);

        // All words should be A1
        const nonA1 = res.body.filter(w => w.level !== 'A1');
        if (nonA1.length > 0) throw new Error(`Found ${nonA1.length} non-A1 words`);

        console.log(`    → ${res.body.length} A1 words`);
    });

    await test('Invalid native_lang parameter', async () => {
        const listsRes = await request('GET', `/api/word-lists?language_pair_id=${languagePairId}`);
        if (!listsRes.body || listsRes.body.length === 0) {
            console.log('    → No word lists available, skipping');
            return;
        }

        const wordListId = listsRes.body[0].id;

        // Try with wrong native_lang
        const res = await request('GET', `/api/word-lists/${wordListId}/words?native_lang=xx`);

        // Should either fail or return empty
        if (res.status === 200 && res.body.length > 0) {
            // Check if it returned garbage
            if (res.body[0].word === 'N/A') {
                throw new Error('Returns N/A for invalid language - bad!');
            }
        }
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
