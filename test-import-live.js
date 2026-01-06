const https = require('https');

const data = JSON.stringify({
    userId: 50,
    languagePairId: 54
});

const options = {
    hostname: 'lexybooster.com',
    port: 443,
    path: '/api/word-sets/5/import',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse:');
        try {
            console.log(JSON.stringify(JSON.parse(responseData), null, 2));
        } catch (e) {
            console.log(responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
