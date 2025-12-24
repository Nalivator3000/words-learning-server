const https = require('https');

const BASE_URL = 'mainline.proxy.rlwy.net:54625';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL.split(':')[0],
            port: BASE_URL.split(':')[1],
            path: path,
            method: 'GET',
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function test() {
    console.log('🔍 Testing ru→de collections API\n');
    console.log('='.repeat(70));

    // Test 1: Get all collections for de→ru (German for Russian speakers)
    console.log('\n1️⃣ GET /api/word-lists?from_lang=de&to_lang=ru');
    console.log('-'.repeat(70));

    const collections = await makeRequest('/api/word-lists?from_lang=de&to_lang=ru');
    console.log(`✅ Found ${collections.length} collections`);

    if (collections.length > 0) {
        console.log('\nFirst 3 collections:');
        collections.slice(0, 3).forEach((col, i) => {
            console.log(`   ${i + 1}. [${col.difficulty_level}] ${col.name}`);
            console.log(`      Words: ${col.word_count} | Topic: ${col.topic || 'N/A'}`);
        });
    }

    // Test 2: Get details of first collection with Russian translations
    if (collections.length > 0) {
        const firstId = collections[0].id;
        console.log(`\n2️⃣ GET /api/word-lists/${firstId}?native_lang=ru`);
        console.log('-'.repeat(70));

        const collectionDetails = await makeRequest(`/api/word-lists/${firstId}?native_lang=ru`);
        console.log(`✅ Collection: ${collectionDetails.name}`);
        console.log(`   Total words: ${collectionDetails.words ? collectionDetails.words.length : 0}`);

        if (collectionDetails.words && collectionDetails.words.length > 0) {
            console.log('\nFirst 3 words with Russian translations:');
            collectionDetails.words.slice(0, 3).forEach((word, i) => {
                console.log(`   ${i + 1}. ${word.word || word.source_word} → ${word.translation || word.native_translation || 'N/A'}`);
            });
        }
    }

    // Test 3: Test filters
    console.log('\n3️⃣ GET /api/word-lists?from_lang=de&to_lang=ru&difficulty=A1');
    console.log('-'.repeat(70));

    const a1Collections = await makeRequest('/api/word-lists?from_lang=de&to_lang=ru&difficulty=A1');
    console.log(`✅ Found ${a1Collections.length} A1-level collections`);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 API test complete!\n');
}

test().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
