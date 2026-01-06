// Quick script to test login API
const https = require('https');
const http = require('http');

function testLogin() {
  const postData = JSON.stringify({
    email: 'test.de.en@lexibooster.test',
    password: 'test123'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing login API...');

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));

        if (parsed.user) {
          console.log('\n✅ Login successful!');
          console.log('User ID:', parsed.user.id);
          console.log('User name:', parsed.user.name);
        } else {
          console.log('\n❌ Login failed');
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(postData);
  req.end();
}

testLogin();
