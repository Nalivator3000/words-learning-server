/**
 * Add POS column to all source_words tables that don't have it
 */

const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addPosColumns() {
    try {
        console.log('🔧 Adding POS columns to all source_words tables...\n');

        // Get all source_words tables
        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE 'source_words_%'
            ORDER BY table_name
        `);

        console.log(`Found ${tables.rows.length} source_words tables\n`);

        let added = 0;
        let skipped = 0;

        for (const table of tables.rows) {
            const tableName = table.table_name;

            // Check if pos column exists
            const colCheck = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = $1 AND column_name = 'pos'
            `, [tableName]);

            if (colCheck.rows.length > 0) {
                console.log(`⏭️  ${tableName} - already has pos column`);
                skipped++;
                continue;
            }

            // Add pos column
            console.log(`🔨 Adding pos column to ${tableName}...`);

            await db.query(`
                ALTER TABLE ${tableName}
                ADD COLUMN pos VARCHAR(50)
            `);

            // Create index
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_${tableName}_pos ON ${tableName}(pos)
            `);

            // Add comment
            await db.query(`
                COMMENT ON COLUMN ${tableName}.pos IS 'Part of speech: noun, verb, adjective, adverb, etc.'
            `);

            console.log(`✅ ${tableName} - pos column added`);
            added++;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Added: ${added}`);
        console.log(`   Skipped (already exists): ${skipped}`);
        console.log(`   Total: ${tables.rows.length}`);
        console.log(`\n✅ All source_words tables now have pos column (nullable)`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

addPosColumns();
