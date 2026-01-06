// Check what translation tables exist in the database
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
    console.log('🔍 Checking available translation tables in database...\n');

    try {
        // Get all tables that start with 'target_translations_'
        const result = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'target_translations_%'
            ORDER BY tablename
        `);

        console.log('📊 Found', result.rows.length, 'translation tables:\n');
        result.rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.tablename}`);
        });

        // Also check source_words tables
        console.log('\n🔍 Checking source_words tables...\n');
        const sourceResult = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'source_words_%'
            ORDER BY tablename
        `);

        console.log('📊 Found', sourceResult.rows.length, 'source tables:\n');
        sourceResult.rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.tablename}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
    }
}

checkTables().catch(console.error);
