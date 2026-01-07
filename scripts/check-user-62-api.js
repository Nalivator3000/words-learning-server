const https = require('https');

const hostname = 'words-learning-server-production.up.railway.app';
const userId = 62;
const languagePairId = 66; // en-es pair

console.log('🔍 Checking User 62 Data via API\n');

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

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

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function checkUser() {
    try {
        // Get user's words
        console.log(`📚 Fetching words for user ${userId} with language pair ${languagePairId}...\n`);
        const words = await makeRequest(`/api/words?userId=${userId}&languagePairId=${languagePairId}`);

        if (!Array.isArray(words)) {
            console.log('Response:', words);
            return;
        }

        console.log(`Total words: ${words.length}\n`);

        // Check for language mismatches (assuming user is learning Spanish from English)
        const expectedLearning = 'es';
        const expectedKnown = 'en';

        const mismatches = words.filter(w =>
            w.learning_language !== expectedLearning ||
            w.known_language !== expectedKnown
        );

        if (mismatches.length > 0) {
            console.log(`⚠️  Found ${mismatches.length} words with LANGUAGE MISMATCH:\n`);
            mismatches.forEach(w => {
                console.log(`Word ID ${w.id}:`);
                console.log(`  - Word: "${w.word}" (lang: ${w.learning_language}, expected: ${expectedLearning})`);
                console.log(`  - Translation: "${w.translation}" (lang: ${w.known_language}, expected: ${expectedKnown})`);
                console.log(`  - Status: ${w.status}`);
                console.log();
            });
        } else {
            console.log('✅ All words have correct language codes (es/en)\n');
        }

        // Check for Cyrillic characters (Russian text)
        const russianWords = words.filter(w =>
            (w.word && w.word.match(/[а-яА-ЯёЁ]/)) ||
            (w.translation && w.translation.match(/[а-яА-ЯёЁ]/))
        );

        if (russianWords.length > 0) {
            console.log(`🔍 Found ${russianWords.length} words containing Cyrillic/Russian characters:\n`);
            russianWords.forEach(w => {
                console.log(`Word ID ${w.id}:`);
                console.log(`  - Word: "${w.word}" (${w.learning_language})`);
                console.log(`  - Translation: "${w.translation}" (${w.known_language})`);
                console.log(`  - Status: ${w.status}`);
                console.log();
            });
        } else {
            console.log('✅ No Russian/Cyrillic characters found\n');
        }

        // Show words that would appear in quiz (new and studying)
        const quizWords = words
            .filter(w => w.status === 'new' || w.status === 'studying')
            .sort((a, b) => {
                if (!a.next_review) return -1;
                if (!b.next_review) return 1;
                return new Date(a.next_review) - new Date(b.next_review);
            })
            .slice(0, 10);

        console.log(`\n🎯 First 10 words that would appear in quiz:\n`);
        quizWords.forEach((w, index) => {
            console.log(`${index + 1}. Word ID ${w.id}:`);
            console.log(`   - Word: "${w.word}" (${w.learning_language})`);
            console.log(`   - Translation: "${w.translation}" (${w.known_language})`);
            console.log(`   - Status: ${w.status}`);

            if (w.learning_language !== expectedLearning || w.known_language !== expectedKnown) {
                console.log(`   ⚠️  LANGUAGE MISMATCH!`);
            }
            console.log();
        });

        console.log('✅ Analysis complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUser();
