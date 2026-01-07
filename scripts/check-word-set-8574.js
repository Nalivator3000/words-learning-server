const https = require('https');

const hostname = 'words-learning-server-production.up.railway.app';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve(responseData);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function checkWordSet() {
    try {
        console.log('🔍 Checking word set 8574\n');

        // Get word set info
        const sets = await makeRequest('/api/word-sets?languagePair=en-es');
        const set8574 = sets.find(s => s.id === 8574);

        if (!set8574) {
            console.log('❌ Word set 8574 not found');
            return;
        }

        console.log('📋 Word Set Info:');
        console.log(`   ID: ${set8574.id}`);
        console.log(`   Title: ${set8574.title}`);
        console.log(`   Source Language: ${set8574.source_language}`);
        console.log(`   Target Language: ${set8574.target_language || 'N/A'}`);
        console.log(`   Level: ${set8574.level}`);
        console.log(`   Theme: ${set8574.theme}`);
        console.log(`   Word Count: ${set8574.word_count}`);
        console.log();

        // Get preview of words from this set
        const preview = await makeRequest(`/api/word-sets/${8574}/preview?limit=5`);

        console.log('📚 First 5 words from set 8574:');
        console.log('Preview response:', JSON.stringify(preview, null, 2));

        if (Array.isArray(preview)) {
            preview.forEach((word, index) => {
                console.log(`\n${index + 1}. Word: "${word.word}"`);
                console.log(`   Translation: "${word.translation || 'MISSING'}"`);
                console.log(`   Example: "${word.example || 'N/A'}"`);
                console.log(`   Example Translation: "${word.example_translation || 'N/A'}"`);
            });
        }

        console.log('\n⚠️  PROBLEM IDENTIFIED:');
        console.log('   This word set contains English words (source_language: english)');
        console.log('   But user 62 is learning en→es (English → Spanish)');
        console.log('   The user should be learning SPANISH words with English translations');
        console.log('   Instead, they got ENGLISH words with no translations!\n');
        console.log('💡 SOLUTION:');
        console.log('   The import logic needs to check if word_set.source_language matches');
        console.log('   the user\'s TARGET language (to_lang), not their source language (from_lang)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkWordSet();
