/**
 * Check POS column status across all source_words tables
 */

const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkPosColumns() {
    try {
        console.log('🔍 Checking POS columns in all source_words tables...\n');

        // Get all source_words tables
        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE 'source_words_%'
            ORDER BY table_name
        `);

        console.log(`Found ${tables.rows.length} source_words tables\n`);

        for (const table of tables.rows) {
            const tableName = table.table_name;

            // Check if pos column exists
            const colCheck = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1 AND column_name = 'pos'
            `, [tableName]);

            const hasPos = colCheck.rows.length > 0;

            if (hasPos) {
                const col = colCheck.rows[0];
                console.log(`✅ ${tableName}`);
                console.log(`   - Type: ${col.data_type}`);
                console.log(`   - Nullable: ${col.is_nullable}`);
            } else {
                console.log(`❌ ${tableName} - NO POS COLUMN`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

checkPosColumns();
