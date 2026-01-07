/**
 * Add missing example_native column to Hindi translation table
 */

const { Pool } = require('pg');

async function fixTranslationTable() {
    const dbUrl = process.env.DATABASE_URL;

    const db = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Checking translation table for Hindi...\n');

        // Check what translation table is used
        const tableCheck = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE '%english%from%hi%'
            ORDER BY table_name
        `);

        console.log('Translation tables found:');
        tableCheck.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        const tableName = 'target_translations_english_from_hi';

        // Get columns
        const columns = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);

        console.log(`\nColumns in ${tableName}:`);
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}`);
        });

        // Check if example_native exists
        const hasExampleNative = columns.rows.some(col => col.column_name === 'example_native');

        if (hasExampleNative) {
            console.log('\n✅ Column example_native already exists');
        } else {
            console.log('\n🔨 Adding example_native column...');

            await db.query(`
                ALTER TABLE ${tableName}
                ADD COLUMN example_native TEXT
            `);

            console.log('✅ Column example_native added');
        }

        console.log('\n🎉 Translation table fixed!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

fixTranslationTable();
