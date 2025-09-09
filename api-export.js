// API Export Script - get data through server API
const https = require('https');
const fs = require('fs');

const baseUrl = 'https://words-learning-server-production.up.railway.app';

// Test users (from server-postgres.js)
const testUsers = [
    { email: 'root', password: 'root' },
    { email: 'Kate', password: '1' },
    { email: 'Mike', password: '1' }
];

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data
                    });
                } catch (error) {
                    resolve({ status: res.statusCode, headers: res.headers, data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function exportUserData() {
    console.log('🔍 Starting API export...\n');
    
    const allWords = [];
    const userData = [];
    
    for (const user of testUsers) {
        try {
            console.log(`👤 Processing user: ${user.email}`);
            
            // Login
            const loginResponse = await makeRequest(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            
            if (loginResponse.status !== 200) {
                console.log(`❌ Login failed for ${user.email}:`, loginResponse.status);
                continue;
            }
            
            const { token, user: userInfo } = loginResponse.data;
            console.log(`✅ Logged in as: ${userInfo.name || user.email}`);
            
            // Get user's words
            const wordsResponse = await makeRequest(`${baseUrl}/api/words`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (wordsResponse.status === 200) {
                const words = wordsResponse.data;
                console.log(`📚 Found ${words.length} words`);
                
                // Add user info to each word
                words.forEach(word => {
                    word.user_email = user.email;
                    word.user_name = userInfo.name || user.email;
                });
                
                allWords.push(...words);
                userData.push({
                    email: user.email,
                    name: userInfo.name || user.email,
                    wordCount: words.length
                });
                
                // Show sample words
                if (words.length > 0) {
                    console.log('📝 Sample words:');
                    words.slice(0, 5).forEach(word => {
                        console.log(`  - ${word.word} → ${word.translation} (${word.status})`);
                    });
                }
            } else {
                console.log(`❌ Failed to get words for ${user.email}:`, wordsResponse.status);
            }
            
            // Get stats
            try {
                const statsResponse = await makeRequest(`${baseUrl}/api/stats`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (statsResponse.status === 200) {
                    console.log(`📊 Stats:`, statsResponse.data);
                }
            } catch (error) {
                console.log('❌ Failed to get stats');
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`❌ Error processing ${user.email}:`, error.message);
        }
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`Total users processed: ${userData.length}`);
    console.log(`Total words exported: ${allWords.length}`);
    
    console.table(userData);
    
    // Export to CSV
    if (allWords.length > 0) {
        console.log('\n💾 Exporting to CSV...');
        
        // Create CSV content
        const headers = ['word', 'example', 'translation', 'example_translation', 'status', 'correct_count', 'incorrect_count', 'date_added', 'last_studied', 'user_email', 'user_name'];
        
        const csvContent = [
            headers.join(','),
            ...allWords.map(word => 
                headers.map(header => {
                    const value = word[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');
        
        const csvPath = './api_database_export.csv';
        fs.writeFileSync(csvPath, csvContent);
        console.log(`✅ Database exported to: ${csvPath}`);
        console.log(`📊 Exported ${allWords.length} words from ${userData.length} users`);
        
        // Show word distribution by user
        const distribution = {};
        allWords.forEach(word => {
            distribution[word.user_email] = (distribution[word.user_email] || 0) + 1;
        });
        
        console.log('\n📊 Word distribution:');
        console.table(distribution);
        
        // Show status distribution
        const statusDist = {};
        allWords.forEach(word => {
            statusDist[word.status] = (statusDist[word.status] || 0) + 1;
        });
        
        console.log('\n📈 Status distribution:');
        console.table(statusDist);
    }
}

exportUserData().then(() => {
    console.log('\n✅ API export completed');
}).catch(error => {
    console.error('❌ API export failed:', error.message);
});