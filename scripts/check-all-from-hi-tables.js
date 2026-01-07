const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Checking all *_from_hi tables\n');

    // Get all tables with _from_hi suffix
    const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%_from_hi'
        ORDER BY table_name
    `);

    for (const row of tables.rows) {
        console.log(`\n📋 ${row.table_name}:`);
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            AND column_name LIKE '%example%'
            ORDER BY ordinal_position
        `, [row.table_name]);

        if (columns.rows.length > 0) {
            columns.rows.forEach(c => {
                console.log(`   - ${c.column_name}: ${c.data_type}`);
            });
        } else {
            console.log('   ❌ No example columns');
        }
    }

    await client.end();
}

debug().catch(console.error);
