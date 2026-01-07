const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Comparing _from_en vs _from_hi table structures\n');

    // Check some _from_en tables
    console.log('📋 Tables with _from_en suffix:');
    const fromEnTables = ['target_translations_german_from_en', 'target_translations_spanish_from_en', 'target_translations_arabic_from_en'];

    for (const tableName of fromEnTables) {
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            AND column_name LIKE '%example%'
            ORDER BY ordinal_position
        `, [tableName]);

        console.log(`\n   ${tableName}:`);
        columns.rows.forEach(c => {
            console.log(`      - ${c.column_name}: ${c.data_type}`);
        });
    }

    // Check corresponding _from_hi tables
    console.log('\n\n📋 Tables with _from_hi suffix:');
    const fromHiTables = ['target_translations_german_from_hi', 'target_translations_spanish_from_hi', 'target_translations_arabic_from_hi'];

    for (const tableName of fromHiTables) {
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            AND column_name LIKE '%example%'
            ORDER BY ordinal_position
        `, [tableName]);

        console.log(`\n   ${tableName}:`);
        columns.rows.forEach(c => {
            console.log(`      - ${c.column_name}: ${c.data_type}`);
        });
    }

    await client.end();
}

debug().catch(console.error);
