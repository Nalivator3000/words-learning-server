const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Looking for Hindi example columns\n');

    // Check all tables that might have Hindi examples
    const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%hindi%'
        ORDER BY table_name
    `);

    console.log('Tables with "hindi" in name:');
    for (const row of tables.rows) {
        console.log(`\n📋 ${row.table_name}:`);
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [row.table_name]);

        columns.rows.forEach(c => {
            console.log(`   - ${c.column_name}: ${c.data_type}`);
        });
    }

    // Check if there's a generic examples table
    console.log('\n\n🔍 Looking for example tables:');
    const exampleTables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%example%'
        ORDER BY table_name
    `);

    if (exampleTables.rows.length > 0) {
        console.log('Found example tables:');
        for (const row of exampleTables.rows) {
            console.log(`\n📋 ${row.table_name}:`);
            const columns = await client.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [row.table_name]);

            columns.rows.forEach(c => {
                console.log(`   - ${c.column_name}: ${c.data_type}`);
            });
        }
    } else {
        console.log('No example tables found');
    }

    await client.end();
}

debug().catch(console.error);
