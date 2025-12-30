#!/usr/bin/env node
/**
 * Production UI Testing Script
 * Tests the live website at lexybooster.com
 */

const https = require('https');

const BASE_URL = 'https://lexybooster.com';

// Simple HTTP client for testing
function httpGet(path) {
    return new Promise((resolve, reject) => {
        https.get(`${BASE_URL}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', reject);
    });
}

async function testHomePage() {
    console.log('\n📄 Testing Home Page...');
    const res = await httpGet('/');

    if (res.statusCode === 200) {
        console.log('   ✅ Status: 200 OK');

        // Check for key elements
        const checks = [
            { name: 'Title tag', pattern: /<title>.*<\/title>/ },
            { name: 'Body content', pattern: /<body/ },
            { name: 'JavaScript', pattern: /<script/ },
            { name: 'CSS', pattern: /<link.*stylesheet/ }
        ];

        for (const check of checks) {
            if (check.pattern.test(res.body)) {
                console.log(`   ✅ ${check.name} found`);
            } else {
                console.log(`   ❌ ${check.name} missing`);
            }
        }
    } else {
        console.log(`   ❌ Status: ${res.statusCode}`);
    }
}

async function testAPI() {
    console.log('\n🔌 Testing API Endpoints...');

    const endpoints = [
        '/api/languages',
        '/api/word-sets',
        '/api/health'
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await httpGet(endpoint);
            if (res.statusCode === 200) {
                console.log(`   ✅ ${endpoint}: 200 OK`);

                // Try to parse JSON
                try {
                    const data = JSON.parse(res.body);
                    if (Array.isArray(data)) {
                        console.log(`      📊 Returned ${data.length} items`);
                    } else if (data.success !== undefined) {
                        console.log(`      📊 Success: ${data.success}`);
                    }
                } catch (e) {
                    console.log(`      ⚠️  Not JSON format`);
                }
            } else {
                console.log(`   ❌ ${endpoint}: ${res.statusCode}`);
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint}: ${error.message}`);
        }
    }
}

async function testStaticAssets() {
    console.log('\n📦 Testing Static Assets...');

    const assets = [
        '/css/styles.css',
        '/js/app.js',
        '/manifest.json'
    ];

    for (const asset of assets) {
        try {
            const res = await httpGet(asset);
            if (res.statusCode === 200) {
                console.log(`   ✅ ${asset}: ${(res.body.length / 1024).toFixed(1)} KB`);
            } else {
                console.log(`   ❌ ${asset}: ${res.statusCode}`);
            }
        } catch (error) {
            console.log(`   ❌ ${asset}: ${error.message}`);
        }
    }
}

async function main() {
    console.log('\n🌐 LexyBooster Production UI Tests');
    console.log('═'.repeat(80));
    console.log(`URL: ${BASE_URL}`);
    console.log('═'.repeat(80));

    try {
        await testHomePage();
        await testAPI();
        await testStaticAssets();

        console.log('\n═'.repeat(80));
        console.log('✅ UI Tests Completed!\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();
