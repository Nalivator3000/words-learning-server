/**
 * Test script to verify quiz progress tracking fix
 * Tests that updateWordProgress works without translation columns
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'https://words-learning-server-production.up.railway.app';
const TEST_USER = {
    email: 'demo@fluentflow.app',
    password: 'demo123'
};

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = protocol.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testQuizProgressFix() {
    console.log('🧪 Testing quiz progress fix...\n');

    try {
        // Step 1: Login
        console.log('1️⃣ Logging in as demo user...');
        const loginResponse = await makeRequest(`${BASE_URL}/api/login`, {
            method: 'POST',
            body: TEST_USER
        });

        if (loginResponse.status !== 200 || !loginResponse.data.userId) {
            console.error('❌ Login failed:', loginResponse.data);
            return;
        }

        const userId = loginResponse.data.userId;
        const token = loginResponse.headers['set-cookie']?.find(c => c.startsWith('sessionToken='));
        console.log('✅ Logged in successfully. User ID:', userId);

        // Step 2: Get user's language pairs
        console.log('\n2️⃣ Getting language pairs...');
        const pairsResponse = await makeRequest(`${BASE_URL}/api/language-pairs?userId=${userId}`, {
            headers: token ? { Cookie: token } : {}
        });

        if (!pairsResponse.data || pairsResponse.data.length === 0) {
            console.error('❌ No language pairs found');
            return;
        }

        const languagePair = pairsResponse.data[0];
        console.log(`✅ Found language pair: ${languagePair.from_lang} → ${languagePair.to_lang} (ID: ${languagePair.id})`);

        // Step 3: Get a word to quiz
        console.log('\n3️⃣ Getting a word to quiz...');
        const wordsResponse = await makeRequest(
            `${BASE_URL}/api/words?userId=${userId}&languagePairId=${languagePair.id}&limit=1`,
            { headers: token ? { Cookie: token } : {} }
        );

        if (!wordsResponse.data || wordsResponse.data.length === 0) {
            console.error('❌ No words found');
            return;
        }

        const word = wordsResponse.data[0];
        console.log(`✅ Got word: "${word.word}" (ID: ${word.id})`);

        // Step 4: Update progress (simulate quiz answer)
        console.log('\n4️⃣ Simulating quiz answer (correct multiple choice)...');
        const progressResponse = await makeRequest(`${BASE_URL}/api/words/${word.id}/progress`, {
            method: 'PUT',
            headers: token ? { Cookie: token } : {},
            body: {
                userId: userId,
                languagePairId: languagePair.id,
                correct: true,
                questionType: 'multipleChoice'
            }
        });

        if (progressResponse.status !== 200) {
            console.error('❌ Progress update failed:', progressResponse.data);
            console.error('Status code:', progressResponse.status);
            return;
        }

        console.log('✅ Progress updated successfully!');
        console.log('\n📊 Progress details:');
        console.log(`   Points: ${progressResponse.data.points}/${progressResponse.data.totalPoints} (${progressResponse.data.percentage}%)`);
        console.log(`   Status: ${progressResponse.data.status}`);

        if (progressResponse.data.achievements && progressResponse.data.achievements.length > 0) {
            console.log(`   🏆 New achievements: ${progressResponse.data.achievements.map(a => a.title).join(', ')}`);
        }

        console.log('\n✅ All tests passed! Quiz progress tracking is working correctly.');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error);
    }
}

// Run tests
testQuizProgressFix();
