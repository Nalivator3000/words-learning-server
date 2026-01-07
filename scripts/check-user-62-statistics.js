const https = require('https');

// Test user 62 (test.en.es) statistics
const hostname = 'words-learning-server-production.up.railway.app';

console.log('🧪 Testing Statistics API for user 62 (test.en.es@lexibooster.test)\n');

// Test 1: Get word counts
function testWordCounts() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Testing GET /api/words/counts?userId=62&languagePairId=66');

        const options = {
            hostname: hostname,
            port: 443,
            path: '/api/words/counts?userId=62&languagePairId=66',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log(`   ✅ Word counts:`, result);
                    console.log(`   📊 Studying: ${result.studying || result.new || 0}`);
                    console.log(`   📊 Review: ${result.review || 0}`);
                    console.log(`   📊 Learned: ${result.learned || 0}\n`);
                    resolve(result);
                } else {
                    console.log(`   ❌ Error:`, data, '\n');
                    reject(data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('   ❌ Request Error:', error.message, '\n');
            reject(error);
        });

        req.end();
    });
}

// Test 2: Get studying words
function testGetWords(status = 'studying') {
    return new Promise((resolve, reject) => {
        console.log(`2️⃣ Testing GET /api/words?userId=62&languagePairId=66&status=${status}&limit=5`);

        const options = {
            hostname: hostname,
            port: 443,
            path: `/api/words?userId=62&languagePairId=66&status=${status}&limit=5`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log(`   ✅ Retrieved ${result.length} words`);
                    if (result.length > 0) {
                        console.log(`   📝 First word example:`);
                        console.log(`      Word: ${result[0].word} → ${result[0].translation}`);
                        console.log(`      Example: ${result[0].example}`);
                        console.log(`      Example translation: ${result[0].example_translation || 'N/A'}`);
                        console.log(`      Status: ${result[0].status}\n`);
                    }
                    resolve(result);
                } else {
                    console.log(`   ❌ Error:`, data, '\n');
                    reject(data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('   ❌ Request Error:', error.message, '\n');
            reject(error);
        });

        req.end();
    });
}

// Run all tests
async function runTests() {
    try {
        await testWordCounts();
        await testGetWords('studying');
        console.log('✅ All tests passed! Statistics API is working correctly.');
    } catch (error) {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    }
}

runTests();
