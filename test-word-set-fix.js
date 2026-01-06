// Test word set preview with different native_lang parameters
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

async function testWordSetPreview() {
    console.log('🧪 Testing word set preview endpoint fixes...\n');

    // Get a German word set ID first
    console.log('📋 Fetching German word sets...');
    const setsResponse = await fetch(`${BASE_URL}/api/word-sets?languagePair=de-en`);
    const sets = await setsResponse.json();

    if (!sets || sets.length === 0) {
        console.log('❌ No German word sets found!');
        return;
    }

    const germanSet = sets.find(s => s.source_language === 'german');
    if (!germanSet) {
        console.log('❌ No German word set found in results!');
        console.log('Available sets:', sets.slice(0, 3).map(s => `${s.id}: ${s.source_language}`));
        return;
    }

    console.log(`✅ Found German word set: ID=${germanSet.id}, ${germanSet.title}\n`);

    const testCases = [
        {
            description: 'With native_lang=de (should fallback to English)',
            params: { native_lang: 'de' },
            shouldFail: false
        },
        {
            description: 'With native_lang=en (correct)',
            params: { native_lang: 'en' },
            shouldFail: false
        },
        {
            description: 'With native_lang=ru (should work)',
            params: { native_lang: 'ru' },
            shouldFail: false
        },
        {
            description: 'No parameters (should use default)',
            params: {},
            shouldFail: false
        }
    ];

    for (const testCase of testCases) {
        console.log(`📝 ${testCase.description}`);

        const params = new URLSearchParams(testCase.params);
        const url = `${BASE_URL}/api/word-sets/${germanSet.id}${params.toString() ? '?' + params.toString() : ''}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                if (testCase.shouldFail) {
                    console.log(`   ✅ Expected failure: ${data.error || data.message}`);
                } else {
                    console.log(`   ❌ UNEXPECTED ERROR: ${response.status} - ${data.error || JSON.stringify(data)}`);
                }
            } else {
                if (testCase.shouldFail) {
                    console.log(`   ❌ Should have failed but succeeded!`);
                } else {
                    console.log(`   ✅ SUCCESS`);
                    console.log(`   Source: ${data.source_language}`);
                    console.log(`   Words count: ${data.words?.length || 0}`);
                    if (data.words && data.words.length > 0) {
                        const sample = data.words[0];
                        console.log(`   Sample: ${sample.word} → ${sample.translation || 'NO_TRANSLATION'}`);
                        console.log(`   Example: ${sample.example || 'NO_EXAMPLE'}`);
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ EXCEPTION: ${error.message}`);
        }

        console.log('');
    }

    console.log('\n✅ All tests completed!');
}

testWordSetPreview().catch(console.error);
