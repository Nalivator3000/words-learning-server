const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
    await client.connect();
    
    // Check source_words_english structure
    console.log('🔍 Structure of source_words_english:\n');
    const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'source_words_english'
        ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(c => {
        console.log(`  - ${c.column_name}: ${c.data_type}`);
    });
    
    // Get sample words
    console.log('\n📚 Sample words from source_words_english:\n');
    const words = await client.query(`
        SELECT * FROM source_words_english 
        LIMIT 10
    `);
    
    words.rows.forEach(w => {
        console.log(`  - ID ${w.id}: "${w.word}"`);
    });
    
    await client.end();
}

checkStructure().catch(console.error);
