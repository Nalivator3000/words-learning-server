const https = require('https');

// Get detailed word info
const hostname = 'words-learning-server-production.up.railway.app';

console.log('🔍 Getting detailed word information for user 62\n');

const options = {
    hostname: hostname,
    port: 443,
    path: '/api/words?userId=62&languagePairId=66&status=studying&limit=10',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            const words = JSON.parse(data);
            console.log(`✅ Retrieved ${words.length} words\n`);

            words.forEach((word, index) => {
                console.log(`${index + 1}. ${word.word || 'N/A'}`);
                console.log(`   Translation: ${word.translation || '❌ MISSING'}`);
                console.log(`   Example: ${word.example || 'N/A'}`);
                console.log(`   Example Translation: ${word.example_translation || '❌ MISSING'}`);
                console.log(`   Status: ${word.status}`);
                console.log(`   Source ID: ${word.source_word_id}, Progress ID: ${word.progress_id}\n`);
            });
        } else {
            console.error('❌ Error:', res.statusCode);
            console.error(data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
});

req.end();
