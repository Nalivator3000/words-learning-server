const https = require('https');

const options = {
    hostname: 'words-learning-server-production.up.railway.app',
    port: 443,
    path: '/api/health',
    method: 'GET'
};

console.log('Checking Railway deployment status...\n');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            console.log('Health check:', json);
        } catch {
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
