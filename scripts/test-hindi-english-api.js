const axios = require('axios');

async function testAPI() {
    const baseURL = process.env.API_URL || 'http://localhost:3001';

    console.log('🧪 Testing Hindi → English API endpoint\n');

    try {
        // Test with user 87 (test.hi.en@lexibooster.test) - Hindi → English
        // Language pair ID 91
        const url = `${baseURL}/api/words?userId=87&languagePairId=91&status=studying&limit=10`;

        console.log(`📡 Calling: ${url}\n`);

        const response = await axios.get(url);

        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Data received: ${response.data.length} words\n`);

        if (response.data.length > 0) {
            console.log('First word:');
            const word = response.data[0];
            console.log(`   - word: ${word.word}`);
            console.log(`   - translation: ${word.translation}`);
            console.log(`   - example: ${word.example || '(empty)'}`);
            console.log(`   - example_translation: ${word.example_translation || '(empty)'}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log(`   ${JSON.stringify(error.response.data)}`);
        }
    }
}

testAPI();
