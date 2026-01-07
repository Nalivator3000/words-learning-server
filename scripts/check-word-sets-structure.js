const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    await client.connect();
    
    const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'word_sets'
        ORDER BY ordinal_position
    `);
    
    console.log('📊 word_sets structure:\n');
    cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    
    console.log('\n📚 Sample:\n');
    const sample = await client.query(`SELECT * FROM word_sets LIMIT 2`);
    console.log(sample.rows);
    
    await client.end();
}

check().catch(console.error);
