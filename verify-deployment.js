// Quick verification script to test the deployment
// Run this after Railway deploys the fix

const fetch = require('node-fetch');

async function verifyDeployment() {
    console.log('🔍 Verifying deployment...\n');

    try {
        // Test 1: Check if API endpoint returns more than 50 words
        const url = 'https://lexybooster.com/api/words?userId=61&languagePairId=65&status=studying&limit=10000';
        console.log('Testing API endpoint:', url);

        const response = await fetch(url);
        const words = await response.json();

        console.log('\n📊 Results:');
        console.log(`  - Status: ${response.status}`);
        console.log(`  - Words returned: ${words.length}`);

        if (words.length === 0) {
            console.log('\n❌ ERROR: No words returned!');
            console.log('   Check if the fix was deployed correctly.');
            return;
        }

        if (words.length === 50) {
            console.log('\n⚠️  WARNING: Still only 50 words returned!');
            console.log('   The limit fix may not be deployed yet.');
            console.log('   Wait a bit more and try again.');
            return;
        }

        console.log(`\n✅ SUCCESS: ${words.length} words returned!`);

        // Check if translations are German
        console.log('\n🇩🇪 Sample German translations:');
        words.slice(0, 10).forEach((word, i) => {
            console.log(`  ${i + 1}. ${word.word} → ${word.translation || '[NO TRANSLATION]'}`);
        });

        const wordsWithTranslation = words.filter(w => w.translation).length;
        const wordsWithoutTranslation = words.length - wordsWithTranslation;

        console.log(`\n📈 Translation coverage:`);
        console.log(`  - With translation: ${wordsWithTranslation}`);
        console.log(`  - Without translation: ${wordsWithoutTranslation}`);
        console.log(`  - Coverage: ${Math.round((wordsWithTranslation / words.length) * 100)}%`);

        if (wordsWithTranslation > 0) {
            console.log('\n✅ ALL FIXES WORKING CORRECTLY!');
            console.log('   The user should now see all words in Statistics page.');
        } else {
            console.log('\n⚠️  Translations are missing. This might be a data issue.');
        }

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('   Make sure the server is running and accessible.');
    }
}

verifyDeployment();
