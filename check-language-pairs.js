// Check language pair IDs in database
const baseUrl = 'https://words-learning-server-production.up.railway.app';

async function checkLanguagePairs() {
    console.log('🔍 Checking language pair IDs in database...\n');
    
    // Test users (from server-postgres.js)
    const testUsers = [
        { email: 'root', password: 'root' },
        { email: 'Kate', password: '1' },
        { email: 'Mike', password: '1' }
    ];

    for (const user of testUsers) {
        try {
            console.log(`👤 Checking user: ${user.email}`);
            
            // Login
            const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            
            if (loginResponse.status !== 200) {
                console.log(`❌ Login failed for ${user.email}:`, loginResponse.status);
                continue;
            }
            
            const { token, user: userData } = await loginResponse.json();
            console.log(`✅ Logged in as: ${userData.name}`);
            console.log(`🔧 User language pairs:`, userData.languagePairs?.map(lp => lp.id) || ['none']);
            
            // Get ALL words without status filter
            const wordsResponse = await fetch(`${baseUrl}/api/words`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (wordsResponse.status === 200) {
                const words = await wordsResponse.json();
                console.log(`📚 Total words: ${words.length}`);
                
                if (words.length > 0) {
                    // Check unique language_pair_ids in words
                    const uniqueLangPairs = [...new Set(words.map(w => w.language_pair_id))];
                    console.log(`🌍 Unique language_pair_ids in words:`, uniqueLangPairs);
                    
                    // Show count by language_pair_id
                    const langPairCount = {};
                    words.forEach(word => {
                        const pairId = word.language_pair_id || 'null';
                        langPairCount[pairId] = (langPairCount[pairId] || 0) + 1;
                    });
                    
                    console.log('📊 Words by language_pair_id:');
                    console.table(langPairCount);
                    
                    // Show sample words with their language_pair_id
                    console.log('📝 Sample words:');
                    words.slice(0, 3).forEach(word => {
                        console.log(`  - ${word.word}: language_pair_id=${word.language_pair_id}, status=${word.status}`);
                    });
                    
                    // Test specific query with languagePairId filter
                    const currentUserPairId = userData.languagePairs?.[0]?.id;
                    if (currentUserPairId) {
                        console.log(`\n🧪 Testing query with user's languagePairId: ${currentUserPairId}`);
                        const testResponse = await fetch(`${baseUrl}/api/words?status=studying&languagePairId=${currentUserPairId}`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (testResponse.status === 200) {
                            const filteredWords = await testResponse.json();
                            console.log(`🔍 Words with languagePairId=${currentUserPairId} and status=studying: ${filteredWords.length}`);
                        }
                        
                        // Test query without languagePairId filter
                        console.log(`\n🧪 Testing query WITHOUT languagePairId filter:`);
                        const testResponse2 = await fetch(`${baseUrl}/api/words?status=studying`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (testResponse2.status === 200) {
                            const filteredWords2 = await testResponse2.json();
                            console.log(`🔍 Words with status=studying (no pair filter): ${filteredWords2.length}`);
                        }
                    }
                }
                
            } else {
                console.log(`❌ Failed to get words for ${user.email}:`, wordsResponse.status);
            }
            
            console.log(''); // Empty line between users
            
        } catch (error) {
            console.log(`❌ Error checking ${user.email}:`, error.message);
        }
    }
}

checkLanguagePairs().then(() => {
    console.log('✅ Language pair check completed');
}).catch(error => {
    console.error('❌ Check failed:', error.message);
});