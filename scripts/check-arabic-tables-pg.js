const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkArabicTables() {
    try {
        console.log('Checking Arabic-related tables in PostgreSQL...\n');

        // Check all tables related to Arabic
        const arabicTables = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND (tablename LIKE '%arabic%' OR tablename LIKE '%_ar%')
            ORDER BY tablename
        `);

        console.log('Arabic-related tables:');
        if (arabicTables.rows.length === 0) {
            console.log('  (none found)');
        } else {
            arabicTables.rows.forEach(t => console.log(`  - ${t.tablename}`));
        }

        // Check all source_words tables
        console.log('\nAll source_words_* tables:');
        const sourceTables = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'source_words_%'
            ORDER BY tablename
        `);
        sourceTables.rows.forEach(t => console.log(`  - ${t.tablename}`));

        // Check all target_translations tables
        console.log('\nAll target_translations_* tables:');
        const targetTables = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'target_translations_%'
            ORDER BY tablename
        `);
        targetTables.rows.forEach(t => console.log(`  - ${t.tablename}`));

        // Check if target_translations_english_from_ar exists
        const checkTable = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'target_translations_english_from_ar'
        `);

        console.log('\nChecking target_translations_english_from_ar:');
        if (checkTable.rows.length === 0) {
            console.log('  ❌ Table does NOT exist');

            // Check if we can create it based on a template
            const templateCheck = await db.query(`
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename LIKE 'target_translations_english_from_%'
                ORDER BY tablename
                LIMIT 1
            `);

            if (templateCheck.rows.length > 0) {
                console.log(`  ℹ️  Found template table: ${templateCheck.rows[0].tablename}`);

                // Get the structure of the template table
                const structure = await db.query(`
                    SELECT column_name, data_type, character_maximum_length, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `, [templateCheck.rows[0].tablename]);

                console.log('\n  Template table structure:');
                structure.rows.forEach(col => {
                    console.log(`    - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
                });
            }
        } else {
            console.log('  ✓ Table exists');
        }

        // Check if source_words_arabic exists
        console.log('\nChecking source_words_arabic:');
        const sourceCheck = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'source_words_arabic'
        `);

        if (sourceCheck.rows.length === 0) {
            console.log('  ❌ Table does NOT exist');
        } else {
            console.log('  ✓ Table exists');

            // Count words in Arabic
            const count = await db.query(`SELECT COUNT(*) FROM source_words_arabic`);
            console.log(`  Words count: ${count.rows[0].count}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
    }
}

checkArabicTables();
