const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
    await client.connect();
    
    // Get all tables
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%word%'
        ORDER BY table_name
    `);
    
    console.log('📊 Tables with "word" in name:\n');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check structure of first table
    if (tables.rows.length > 0) {
        const firstTable = tables.rows[0].table_name;
        console.log(`\n🔍 Structure of ${firstTable}:\n`);
        
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [firstTable]);
        
        columns.rows.forEach(c => {
            console.log(`  - ${c.column_name}: ${c.data_type}`);
        });
    }
    
    await client.end();
}

checkStructure().catch(console.error);
