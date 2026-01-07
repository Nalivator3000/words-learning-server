const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Checking target_translations_english_from_hi table\n');

    // Check if this table exists
    const tableCheck = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'target_translations_english_from_hi'
    `);

    if (tableCheck.rows.length > 0) {
        console.log('✅ target_translations_english_from_hi exists');

        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'target_translations_english_from_hi'
            ORDER BY ordinal_position
        `);

        console.log('\nColumns:');
        columns.rows.forEach(c => {
            console.log(`   - ${c.column_name}: ${c.data_type}`);
        });
    } else {
        console.log('❌ target_translations_english_from_hi does NOT exist');
    }

    // Check the base target_translations_english table for comparison
    console.log('\n\n🔍 Checking target_translations_english (base table)\n');

    const baseColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'target_translations_english'
        ORDER BY ordinal_position
    `);

    console.log('Columns:');
    baseColumns.rows.forEach(c => {
        console.log(`   - ${c.column_name}: ${c.data_type}`);
    });

    await client.end();
}

debug().catch(console.error);
