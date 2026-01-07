const https = require('https');

// Test deleting a word via API
const wordId = 1449; // Replace with actual word ID
const hostname = 'words-learning-server-production.up.railway.app';

console.log(`Testing DELETE /api/words/${wordId}`);

const options = {
  hostname: hostname,
  port: 443,
  path: `/api/words/${wordId}`,
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
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

req.end();