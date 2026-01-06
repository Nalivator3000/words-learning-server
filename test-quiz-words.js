const https = require('https');

// Test getting words for quiz
const options = {
    hostname: 'lexybooster.com',
    port: 443,
    path: '/api/words/random/new/20?userId=50&languagePairId=54',
    method: 'GET'
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse:');
        try {
            const parsed = JSON.parse(data);
            console.log(`Found ${parsed.length} words`);
            if (parsed.length > 0) {
                console.log('\nFirst word:');
                console.log(JSON.stringify(parsed[0], null, 2));
            }
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
