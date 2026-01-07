/**
 * Test script to verify the word sets language fix
 */

const https = require('https');

const hostname = 'words-learning-server-production.up.railway.app';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve(responseData);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function testWordSetsFix() {
    console.log('🧪 Testing Word Sets Language Fix\n');
    console.log('════════════════════════════════════════\n');

    const testCases = [
        {
            name: 'User learning Spanish from English',
            from: 'en',
            to: 'es',
            oldCode: 'en-es', // WRONG: would show English sets
            newCode: 'es-en', // CORRECT: shows Spanish sets
            expectedLanguage: 'spanish',
            expectedExample: 'Spanish A1'
        },
        {
            name: 'User learning English from Spanish',
            from: 'es',
            to: 'en',
            oldCode: 'es-en', // WRONG: would show Spanish sets
            newCode: 'en-es', // CORRECT: shows English sets
            expectedLanguage: 'english',
            expectedExample: 'English A1'
        },
        {
            name: 'User learning German from English',
            from: 'en',
            to: 'de',
            oldCode: 'en-de', // WRONG: would show English sets
            newCode: 'de-en', // CORRECT: shows German sets
            expectedLanguage: 'german',
            expectedExample: 'German A1'
        }
    ];

    for (const testCase of testCases) {
        console.log(`📋 Test Case: ${testCase.name}`);
        console.log(`   Language Pair: ${testCase.from} → ${testCase.to}`);
        console.log();

        // Test OLD code (wrong)
        console.log(`   ❌ OLD Code (WRONG): Sending languagePair="${testCase.oldCode}"`);
        try {
            const oldSets = await makeRequest(`/api/word-sets?languagePair=${testCase.oldCode}&limit=3`);
            if (oldSets.length > 0) {
                console.log(`      Returns: ${oldSets[0].source_language} word sets`);
                console.log(`      Example: "${oldSets[0].title}"`);
                if (oldSets[0].source_language !== testCase.expectedLanguage) {
                    console.log(`      ⚠️  WRONG LANGUAGE! Expected ${testCase.expectedLanguage}`);
                }
            } else {
                console.log(`      Returns: No sets found`);
            }
        } catch (error) {
            console.log(`      Error: ${error.message}`);
        }
        console.log();

        // Test NEW code (correct)
        console.log(`   ✅ NEW Code (CORRECT): Sending languagePair="${testCase.newCode}"`);
        try {
            const newSets = await makeRequest(`/api/word-sets?languagePair=${testCase.newCode}&limit=3`);
            if (newSets.length > 0) {
                console.log(`      Returns: ${newSets[0].source_language} word sets`);
                console.log(`      Example: "${newSets[0].title}"`);
                if (newSets[0].source_language === testCase.expectedLanguage) {
                    console.log(`      ✅ CORRECT LANGUAGE!`);
                } else {
                    console.log(`      ❌ STILL WRONG! Expected ${testCase.expectedLanguage}`);
                }
            } else {
                console.log(`      Returns: No sets found`);
            }
        } catch (error) {
            console.log(`      Error: ${error.message}`);
        }

        console.log();
        console.log('────────────────────────────────────────\n');
    }

    console.log('✅ Test complete!\n');
    console.log('Summary:');
    console.log('- OLD code sends: fromLang-toLang (WRONG)');
    console.log('- NEW code sends: toLang-fromLang (CORRECT)');
    console.log('- Frontend fix in: public/word-lists-ui.js:183');
}

testWordSetsFix();
