const https = require('https');

// Test import endpoint with real parameters
const setId = 1; // German A1 General
const userId = 50; // test_de_en user
const languagePairId = 54; // German → English

const postData = JSON.stringify({
    userId: userId,
    languagePairId: languagePairId
});

const options = {
    hostname: 'words-learning-server-production.up.railway.app',
    port: 443,
    path: `/api/word-sets/${setId}/import`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

console.log(`Testing import endpoint...`);
console.log(`Set ID: ${setId}`);
console.log(`User ID: ${userId}`);
console.log(`Language Pair ID: ${languagePairId}\n`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response:\n`);

        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(postData);
req.end();
