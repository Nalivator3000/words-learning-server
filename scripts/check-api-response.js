const https = require('https');

const hostname = 'words-learning-server-production.up.railway.app';
const userId = 62;
const languagePairId = 66;

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

async function checkResponse() {
    try {
        console.log('🔍 Checking raw API response for user 62\n');

        const words = await makeRequest(`/api/words?userId=${userId}&languagePairId=${languagePairId}&limit=3`);

        console.log('📦 Raw API Response (first 3 words):\n');
        console.log(JSON.stringify(words, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkResponse();
