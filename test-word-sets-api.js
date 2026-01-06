const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function test() {
    const BASE_URL = 'https://words-learning-server-production.up.railway.app';
    const url = `${BASE_URL}/api/word-sets?languagePair=en-de&level=A2`;
    
    console.log('Testing:', url);
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('\nFound', data.length, 'word sets');
    console.log('\nFirst 3 sets:');
    data.slice(0, 3).forEach(set => {
        console.log(`  ID ${set.id}: "${set.title}" - source_language: ${set.source_language}, word_count: ${set.word_count}`);
    });
}

test().catch(console.error);
