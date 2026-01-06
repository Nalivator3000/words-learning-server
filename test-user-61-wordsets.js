// Test user 61 word set access
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://words-learning-server-production.up.railway.app';

async function testUser61() {
    console.log('🧪 Testing user 61 word set access...\n');

    // First, let's check what language pairs are available
    console.log('📋 Fetching available language pairs...');
    const pairsResponse = await fetch(`${BASE_URL}/api/language-pairs`);
    const pairs = await pairsResponse.json();

    const enDePair = pairs.find(p => p.from_lang === 'en' && p.to_lang === 'de');
    const deEnPair = pairs.find(p => p.from_lang === 'de' && p.to_lang === 'en');

    console.log('Available pairs:');
    if (enDePair) console.log(`  en-de: ID=${enDePair.id}`);
    if (deEnPair) console.log(`  de-en: ID=${deEnPair.id}`);
    console.log('');

    // User 61 likely has en-de (learning German from English)
    // Let's test accessing a German word set as user 61

    console.log('📋 Fetching German word sets (as if from user 61)...');
    const setsResponse = await fetch(`${BASE_URL}/api/word-sets?languagePair=en-de`);
    const sets = await setsResponse.json();

    if (!sets || sets.length === 0) {
        console.log('❌ No word sets found for en-de!');
        console.log('Trying de-en instead...');
        const setsResponse2 = await fetch(`${BASE_URL}/api/word-sets?languagePair=de-en`);
        const sets2 = await setsResponse2.json();
        console.log(`Found ${sets2.length} sets for de-en`);

        if (sets2.length > 0) {
            const germanSet = sets2.find(s => s.source_language === 'german');
            if (germanSet) {
                await testWordSetAccess(germanSet.id, 'de');
            }
        }
        return;
    }

    console.log(`✅ Found ${sets.length} word sets for en-de\n`);

    // Find a German source word set
    const germanSet = sets.find(s => s.source_language === 'german');

    if (germanSet) {
        console.log(`Found German set: ${germanSet.title}`);
        await testWordSetAccess(germanSet.id, 'de');
    } else {
        console.log('No German source sets found in en-de results');
    }
}

async function testWordSetAccess(setId, nativeLang) {
    console.log(`\n🔍 Testing access to word set ${setId} with native_lang=${nativeLang}...`);

    const url = `${BASE_URL}/api/word-sets/${setId}?native_lang=${nativeLang}`;
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ ERROR: ${response.status}`);
            console.log(`   Message: ${data.error || JSON.stringify(data)}`);
        } else {
            console.log(`✅ SUCCESS`);
            console.log(`   Source: ${data.source_language}`);
            console.log(`   Title: ${data.title}`);
            console.log(`   Words: ${data.words?.length || 0}`);
            if (data.words && data.words.length > 0) {
                const sample = data.words[0];
                console.log(`   Sample: ${sample.word} → ${sample.translation || 'NO_TRANSLATION'}`);
            }
        }
    } catch (error) {
        console.log(`❌ EXCEPTION: ${error.message}`);
    }
}

testUser61().catch(console.error);
