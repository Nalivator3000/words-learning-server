const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkStructure() {
    // Check target_translations_english structure
    const result = await db.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'target_translations_english'
        ORDER BY ordinal_position
    `);
    
    console.log('Columns in target_translations_english:');
    result.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    await db.end();
}

checkStructure().catch(console.error);
