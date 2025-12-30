/**
 * API Test Helper
 * Provides common utilities for API testing with rate limiting
 */

const https = require('https');
const http = require('http');

// Rate limit delay between requests (milliseconds)
const RATE_LIMIT_DELAY = 1000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function request(baseUrl, method, path, data = null, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = baseUrl.startsWith('https');
        const protocol = isHttps ? https : http;
        const url = new URL(path, baseUrl);

        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            timeout: options.timeout || 10000
        };

        const req = protocol.request(url, requestOptions, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
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

async function requestWithRetry(baseUrl, method, path, data = null, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await request(baseUrl, method, path, data, options);

            // If rate limited, wait and retry
            if (result.status === 429) {
                if (attempt < maxRetries) {
                    await sleep(retryDelay * attempt); // Exponential backoff
                    continue;
                }
            }

            return result;
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            await sleep(retryDelay);
        }
    }
}

async function testWithRateLimit(name, fn, results) {
    process.stdout.write(`  ${name}... `);
    try {
        await fn();
        console.log('✅');
        results.passed++;
    } catch (e) {
        console.log(`❌ ${e.message}`);
        results.failed++;
    }
    // Rate limit delay after each test
    await sleep(RATE_LIMIT_DELAY);
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

module.exports = {
    request,
    requestWithRetry,
    testWithRateLimit,
    assert,
    sleep,
    RATE_LIMIT_DELAY
};
