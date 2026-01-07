const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    await client.connect();
    
    // Check structure
    const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'word_set_items'
        ORDER BY ordinal_position
    `);
    
    console.log('📊 word_set_items structure:\n');
    cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    
    // Get sample data
    console.log('\n📚 Sample data:\n');
    const sample = await client.query(`SELECT * FROM word_set_items LIMIT 3`);
    console.log(sample.rows);
    
    await client.end();
}

check().catch(console.error);
