#!/usr/bin/env node
/**
 * Remove duplicate translations from target_translations_* tables
 * Keeps only one translation per source_word_id (the one with lowest ID)
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function removeDuplicateTranslations() {
    try {
        console.log('🧹 Removing duplicate translations...\n');
        console.log('━'.repeat(60));

        // Get all translation tables
        const tablesResult = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'target_translations_%'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} translation tables\n`);

        let totalRemoved = 0;
        let totalProcessed = 0;

        for (const table of tables) {
            console.log(`\n📚 ${table}:`);

            // Check for duplicates
            const duplicatesCheck = await db.query(`
                SELECT COUNT(*) FROM (
                    SELECT source_word_id
                    FROM ${table}
                    GROUP BY source_word_id
                    HAVING COUNT(*) > 1
                ) as dupes
            `);

            const dupeCount = parseInt(duplicatesCheck.rows[0].count);

            if (dupeCount === 0) {
                console.log('  ✅ No duplicates found');
                continue;
            }

            // Count extra rows
            const extrasCount = await db.query(`
                SELECT SUM(count - 1) as extras FROM (
                    SELECT source_word_id, COUNT(*) as count
                    FROM ${table}
                    GROUP BY source_word_id
                    HAVING COUNT(*) > 1
                ) as dupes
            `);

            const extras = parseInt(extrasCount.rows[0].extras);
            console.log(`  🔍 Found ${dupeCount} words with duplicates (${extras} extra rows)`);

            // Start transaction
            await db.query('BEGIN');

            try {
                // Delete duplicates, keeping only the row with minimum ID
                const deleteResult = await db.query(`
                    DELETE FROM ${table}
                    WHERE id IN (
                        SELECT id
                        FROM (
                            SELECT id,
                                   ROW_NUMBER() OVER (PARTITION BY source_word_id ORDER BY id) as row_num
                            FROM ${table}
                        ) as ranked
                        WHERE row_num > 1
                    )
                `);

                const deleted = deleteResult.rowCount;

                // Verify no duplicates remain
                const verify = await db.query(`
                    SELECT COUNT(*) FROM (
                        SELECT source_word_id
                        FROM ${table}
                        GROUP BY source_word_id
                        HAVING COUNT(*) > 1
                    ) as dupes
                `);

                const remaining = parseInt(verify.rows[0].count);

                if (remaining === 0) {
                    await db.query('COMMIT');
                    console.log(`  ✅ Removed ${deleted} duplicate rows`);
                    console.log(`  ✅ Verified: No duplicates remaining`);
                    totalRemoved += deleted;
                    totalProcessed++;
                } else {
                    await db.query('ROLLBACK');
                    console.log(`  ❌ ROLLBACK: Still have ${remaining} duplicates after cleanup`);
                }

            } catch (error) {
                await db.query('ROLLBACK');
                console.log(`  ❌ ROLLBACK: ${error.message}`);
            }
        }

        // Final summary
        console.log('\n' + '━'.repeat(60));
        console.log('\n📊 CLEANUP SUMMARY:');
        console.log(`  Tables processed: ${totalProcessed}/${tables.length}`);
        console.log(`  Total rows removed: ${totalRemoved}`);
        console.log('\n' + '━'.repeat(60) + '\n');

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error);
        await db.end();
        process.exit(1);
    }
}

removeDuplicateTranslations();
