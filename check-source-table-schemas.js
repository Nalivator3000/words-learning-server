const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSourceTableSchemas() {
    console.log('=== Checking All Source Table Schemas ===\n');

    // Get all source_words tables
    const tablesResult = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'source_words_%'
        ORDER BY table_name
    `);

    for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        console.log(`\n--- Table: ${tableName} ---`);

        // Get columns
        const columnsResult = await db.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);

        console.log('Columns:');
        columnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // Check for example column specifically
        const hasExample = columnsResult.rows.some(col => col.column_name === 'example');
        console.log(`Has 'example' column: ${hasExample}`);
    }

    await db.end();
}

checkSourceTableSchemas().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
