// Test production native_lang validation
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function test() {
    const BASE_URL = 'https://words-learning-server-production.up.railway.app';

    // Test English word set with native_lang=de (should show English→German translations)
    console.log('Test 1: English word set 849 with native_lang=de');
    console.log('Expected: English words with German translations\n');

    try {
        const response = await fetch(`${BASE_URL}/api/word-sets/849?native_lang=de`);
        const data = await response.json();

        if (data.error) {
            console.log('❌ ERROR:', data.error);
        } else {
            console.log('✅ Response received');
            console.log('Source language:', data.source_language);
            console.log('Words count:', data.words?.length || 0);
            if (data.words && data.words.length > 0) {
                console.log('First word:', data.words[0]);
            }
        }
    } catch (error) {
        console.log('❌ EXCEPTION:', error.message);
    }

    console.log('\n---\n');

    // Test without native_lang parameter
    console.log('Test 2: Same set without native_lang parameter');
    try {
        const response = await fetch(`${BASE_URL}/api/word-sets/849`);
        const data = await response.json();

        if (data.error) {
            console.log('❌ ERROR:', data.error);
        } else {
            console.log('✅ Response received');
            console.log('Source language:', data.source_language);
            console.log('Words count:', data.words?.length || 0);
            if (data.words && data.words.length > 0) {
                console.log('First word:', data.words[0]);
            }
        }
    } catch (error) {
        console.log('❌ EXCEPTION:', error.message);
    }
}

test().catch(console.error);
