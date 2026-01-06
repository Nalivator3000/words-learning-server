const https = require('https');

// Test preview endpoint for a specific set
const setId = 381; // From error logs

const options = {
    hostname: 'words-learning-server-production.up.railway.app',
    port: 443,
    path: `/api/word-sets/${setId}/preview`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log(`Testing preview endpoint for set ${setId}...\n`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response:\n`, JSON.parse(data));
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
