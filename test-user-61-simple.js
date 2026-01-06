// Simple test for user 61 word set preview
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

async function test() {
    console.log('🧪 Testing user 61 scenario: de-en user viewing German word sets\n');

    // Get German word sets for de-en language pair
    console.log('📋 Step 1: Fetching word sets for de-en...');
    const setsUrl = `${BASE_URL}/api/word-sets?languagePair=de-en`;
    console.log(`   URL: ${setsUrl}`);

    const setsResponse = await fetch(setsUrl);
    const sets = await setsResponse.json();

    console.log(`   ✅ Found ${sets.length} word sets\n`);

    if (sets.length === 0) {
        console.log('❌ No sets found!');
        return;
    }

    // Pick first German set
    const set = sets[0];
    console.log(`📖 Step 2: Viewing word set "${set.title}" (ID: ${set.id})`);
    console.log(`   Source language: ${set.source_language}\n`);

    // Test 1: Without native_lang parameter (should work)
    console.log('Test 1: No native_lang parameter');
    await testPreview(set.id, null);

    // Test 2: With native_lang=de (the bug case - should now fallback to English)
    console.log('\nTest 2: With native_lang=de (user 61\'s toLanguage)');
    await testPreview(set.id, 'de');

    // Test 3: With native_lang=en (correct case)
    console.log('\nTest 3: With native_lang=en (correct)');
    await testPreview(set.id, 'en');

    console.log('\n✅ All tests completed!');
}

async function testPreview(setId, nativeLang) {
    const url = nativeLang
        ? `${BASE_URL}/api/word-sets/${setId}?native_lang=${nativeLang}`
        : `${BASE_URL}/api/word-sets/${setId}`;

    console.log(`   URL: ${url}`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ❌ ERROR ${response.status}: ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log(`   ✅ SUCCESS`);
        console.log(`   Words loaded: ${data.words?.length || 0}`);

        if (data.words && data.words.length > 0) {
            const sample = data.words[0];
            console.log(`   Sample: "${sample.word}" → "${sample.translation || 'NO_TRANSLATION'}"`);
        }
    } catch (error) {
        console.log(`   ❌ EXCEPTION: ${error.message}`);
    }
}

test().catch(console.error);
