const https = require('https');

const options = {
    hostname: 'lexybooster.com',
    port: 443,
    path: '/api/words/counts?userId=50&languagePairId=54',
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
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
