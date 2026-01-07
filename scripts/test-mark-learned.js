const https = require('https');

// Test marking word as learned via API
const wordId = 1450; // Replace with actual word ID
const hostname = 'words-learning-server-production.up.railway.app';

console.log(`Testing PUT /api/words/${wordId}/status`);

const postData = JSON.stringify({
  status: 'learned'
});

const options = {
  hostname: hostname,
  port: 443,
  path: `/api/words/${wordId}/status`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(postData);
req.end();
