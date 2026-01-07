/**
 * Find technical acronyms and abbreviations in source words
 * These are words like PDF, PHP, HTTP that shouldn't be in language learning
 */

const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

// Patterns to identify likely acronyms/abbreviations
function isLikelyAcronym(word) {
    if (!word) return false;
    
    const upperWord = word.toUpperCase();
    
    // All uppercase and short (2-5 chars): PDF, PHP, HTTP, URL, API
    if (word === upperWord && word.length >= 2 && word.length <= 5) {
        return true;
    }
    
    // Common tech acronyms
    const techAcronyms = [
        'PDF', 'PHP', 'HTTP', 'HTTPS', 'URL', 'API', 'HTML', 'CSS', 'XML', 'JSON',
        'SQL', 'FTP', 'SSH', 'DNS', 'IP', 'TCP', 'UDP', 'USB', 'CD', 'DVD',
        'RAM', 'ROM', 'CPU', 'GPU', 'SSD', 'HDD', 'OS', 'PC', 'TV', 'GPS'
    ];
    
    return techAcronyms.includes(upperWord);
}

async function findAcronyms() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check all source word tables
        const languages = ['english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian', 'chinese', 'japanese', 'korean', 'hindi', 'arabic'];
        
        for (const lang of languages) {
            const tableName = `source_words_${lang}`;
            
            try {
                console.log(`\n🔍 Checking ${tableName}...\n`);
                
                const result = await client.query(`
                    SELECT id, word, level, pos
                    FROM ${tableName}
                    ORDER BY id
                `);
                
                const acronyms = result.rows.filter(row => isLikelyAcronym(row.word));
                
                if (acronyms.length > 0) {
                    console.log(`❌ Found ${acronyms.length} potential acronyms in ${tableName}:`);
                    acronyms.forEach(row => {
                        console.log(`   - ID ${row.id}: "${row.word}" (level: ${row.level || 'N/A'}, pos: ${row.pos || 'N/A'})`);
                    });
                } else {
                    console.log(`✅ No acronyms found in ${tableName}`);
                }
                
            } catch (err) {
                console.log(`⚠️  Table ${tableName} doesn't exist or error: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
        console.log('\n✅ Database connection closed');
    }
}

findAcronyms();
