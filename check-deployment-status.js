// Monitor deployment status
const fetch = require('node-fetch');

let checkCount = 0;
const maxChecks = 30; // Check for 5 minutes (30 * 10 seconds)

async function checkDeployment() {
    checkCount++;
    console.log(`\n[${checkCount}/${maxChecks}] Checking deployment status...`);

    try {
        // Test API with limit=100
        const response = await fetch('https://lexybooster.com/api/words?userId=61&languagePairId=65&limit=100&status=studying');
        const words = await response.json();

        console.log(`API returned: ${words.length} words`);

        if (words.length === 50) {
            console.log('❌ OLD CODE - Fix not deployed yet');
            console.log('   Waiting for Railway to deploy...\n');

            if (checkCount < maxChecks) {
                setTimeout(checkDeployment, 10000); // Check again in 10 seconds
            } else {
                console.log('⏰ Timeout reached. Deployment taking longer than expected.');
                console.log('   Check Railway dashboard for errors.');
            }
        } else if (words.length >= 100) {
            console.log('✅ NEW CODE DEPLOYED!');
            console.log(`   API now returns ${words.length} words with limit=100`);
            console.log('\n🎉 All fixes are live! User should now see all words in Statistics.');

            // Show sample German translations
            console.log('\n🇩🇪 Sample German translations:');
            words.slice(0, 5).forEach((w, i) => {
                console.log(`   ${i+1}. ${w.word} → ${w.translation || '[NO TRANSLATION]'}`);
            });
        } else {
            console.log(`⚠️  Unexpected: ${words.length} words returned`);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (checkCount < maxChecks) {
            setTimeout(checkDeployment, 10000);
        }
    }
}

console.log('🚀 Starting deployment monitor...');
console.log('   Checking https://lexybooster.com every 10 seconds');
console.log('   Press Ctrl+C to stop\n');

checkDeployment();
