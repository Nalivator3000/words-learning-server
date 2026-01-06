// Test word set preview endpoint with different language configurations
const fetch = require('node-fetch');

const BASE_URL = process.env.RAILWAY_URL || 'https://words-learning-server-production.up.railway.app';

async function testWordSetPreview() {
    console.log('🧪 Testing word set preview endpoint...\n');

    // Test user 61 (en-de, so native_lang=de but source should be de, target should be en)
    const testCases = [
        {
            description: 'User 61 with native_lang=de (should fallback to English)',
            setId: 1, // Assume this is a German A1 set
            params: { native_lang: 'de' },
            expectedTargetLang: 'english'
        },
        {
            description: 'User 61 with native_lang=en (correct)',
            setId: 1,
            params: { native_lang: 'en' },
            expectedTargetLang: 'english'
        },
        {
            description: 'No native_lang parameter (should use default)',
            setId: 1,
            params: {},
            expectedTargetLang: 'english'
        }
    ];

    for (const testCase of testCases) {
        console.log(`📝 ${testCase.description}`);

        const params = new URLSearchParams(testCase.params);
        const url = `${BASE_URL}/api/word-sets/${testCase.setId}${params.toString() ? '?' + params.toString() : ''}`;

        console.log(`   URL: ${url}`);

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                console.log(`   ❌ ERROR: ${response.status} - ${JSON.stringify(data)}`);
            } else {
                console.log(`   ✅ SUCCESS`);
                console.log(`   Source: ${data.source_language}`);
                console.log(`   Words count: ${data.words?.length || 0}`);
                if (data.words && data.words.length > 0) {
                    console.log(`   Sample: ${data.words[0].word} → ${data.words[0].translation}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ EXCEPTION: ${error.message}`);
        }

        console.log('');
    }
}

testWordSetPreview().catch(console.error);
