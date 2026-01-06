/**
 * Test script to verify Hindi word sets are returned with correct translations
 * Usage: node test-hindi-word-sets-api.js
 */

const BASE_URL = process.env.API_URL || 'https://words-learning-server-production.up.railway.app';

async function testHindiWordSets() {
    console.log('🧪 Testing Hindi → English word sets API\n');

    // Test 1: Get word sets for Hindi language pair
    console.log('📋 Test 1: Fetching Hindi word sets (hi-en)');
    const wordSetsUrl = `${BASE_URL}/api/word-sets?languagePair=hi-en`;
    console.log(`   URL: ${wordSetsUrl}`);

    const setsResponse = await fetch(wordSetsUrl);
    if (!setsResponse.ok) {
        console.error(`❌ Failed to fetch word sets: ${setsResponse.status}`);
        return;
    }

    const wordSets = await setsResponse.json();
    console.log(`✅ Found ${wordSets.length} word sets\n`);

    if (wordSets.length === 0) {
        console.log('⚠️  No word sets found for hi-en pair');
        return;
    }

    // Test 2: Get details of first word set with Hindi words
    const firstSet = wordSets[0];
    console.log(`📖 Test 2: Fetching details for "${firstSet.title || firstSet.name}"`);
    console.log(`   Set ID: ${firstSet.id}`);
    console.log(`   Source language: ${firstSet.source_language}`);

    const setDetailsUrl = `${BASE_URL}/api/word-sets/${firstSet.id}?native_lang=en`;
    console.log(`   URL: ${setDetailsUrl}`);

    const detailsResponse = await fetch(setDetailsUrl);
    if (!detailsResponse.ok) {
        console.error(`❌ Failed to fetch word set details: ${detailsResponse.status}`);
        const errorText = await detailsResponse.text();
        console.error(`   Error: ${errorText}`);
        return;
    }

    const wordSetDetails = await detailsResponse.json();
    console.log(`✅ Loaded ${wordSetDetails.words?.length || 0} words\n`);

    if (!wordSetDetails.words || wordSetDetails.words.length === 0) {
        console.log('⚠️  No words found in word set');
        return;
    }

    // Test 3: Verify translations are in Hindi (not Russian)
    console.log('🔍 Test 3: Checking word translations (first 5 words)');
    console.log('   Expected: Hindi words, English translations');
    console.log('   Verifying: No Russian characters (а-я, А-Я)\n');

    const firstWords = wordSetDetails.words.slice(0, 5);
    let russianDetected = false;

    firstWords.forEach((word, index) => {
        const hasRussianInWord = /[а-яА-Я]/.test(word.word || '');
        const hasRussianInTranslation = /[а-яА-Я]/.test(word.translation || '');
        const hasHindiInWord = /[\u0900-\u097F]/.test(word.word || '');

        console.log(`   ${index + 1}. Word: "${word.word}" → Translation: "${word.translation}"`);

        if (hasRussianInWord) {
            console.log(`      ❌ ERROR: Word contains Russian characters!`);
            russianDetected = true;
        }
        if (hasRussianInTranslation) {
            console.log(`      ❌ ERROR: Translation contains Russian characters!`);
            russianDetected = true;
        }
        if (hasHindiInWord) {
            console.log(`      ✅ Hindi script detected in word`);
        }
    });

    console.log('');
    if (russianDetected) {
        console.log('❌ TEST FAILED: Russian characters detected in Hindi word set!');
    } else {
        console.log('✅ TEST PASSED: No Russian characters detected');
    }
}

// Run tests
testHindiWordSets().catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
});
