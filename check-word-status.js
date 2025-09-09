// Check word statuses in database
const baseUrl = 'https://words-learning-server-production.up.railway.app';

async function checkWordStatuses() {
    console.log('🔍 Checking word statuses in database...\n');
    
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
            
            const { token } = await loginResponse.json();
            
            // Get words
            const wordsResponse = await fetch(`${baseUrl}/api/words`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (wordsResponse.status === 200) {
                const words = await wordsResponse.json();
                console.log(`📚 Total words: ${words.length}`);
                
                // Count by status
                const statusCount = {};
                words.forEach(word => {
                    statusCount[word.status] = (statusCount[word.status] || 0) + 1;
                });
                
                console.log('📊 Status distribution:');
                console.table(statusCount);
                
                // Show a few sample words
                console.log('📝 Sample words:');
                words.slice(0, 5).forEach(word => {
                    console.log(`  - ${word.word} → ${word.translation} (${word.status})`);
                });
                
                // Check if there are studying words
                const studyingWords = words.filter(w => w.status === 'studying');
                console.log(`\n🎯 Words available for studying: ${studyingWords.length}`);
                
                if (studyingWords.length === 0) {
                    console.log('⚠️ NO WORDS WITH "studying" STATUS FOUND!');
                    console.log('💡 This explains why exercises cannot start.');
                    
                    // Show what statuses exist
                    const uniqueStatuses = [...new Set(words.map(w => w.status))];
                    console.log('📋 Available statuses:', uniqueStatuses.join(', '));
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

checkWordStatuses().then(() => {
    console.log('✅ Word status check completed');
}).catch(error => {
    console.error('❌ Check failed:', error.message);
});