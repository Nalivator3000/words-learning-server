#!/usr/bin/env node
/**
 * Remove duplicate words from vocabulary tables
 * Keeps only the first occurrence (lowest ID)
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function removeDuplicates(tableName) {
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`🧹 Cleaning: ${tableName}`);
    console.log('━'.repeat(60));

    try {
        // Start transaction
        await db.query('BEGIN');

        // Count duplicates before
        const beforeCount = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`📊 Total rows before: ${beforeCount.rows[0].count}`);

        // Find duplicates
        const duplicates = await db.query(`
            SELECT word, COUNT(*) as count
            FROM ${tableName}
            GROUP BY word
            HAVING COUNT(*) > 1
        `);

        if (duplicates.rows.length === 0) {
            console.log('✅ No duplicates found!\n');
            await db.query('ROLLBACK');
            return { removed: 0, kept: parseInt(beforeCount.rows[0].count) };
        }

        console.log(`\n🔍 Found ${duplicates.rows.length} words with duplicates`);

        // Delete duplicates, keeping only the row with minimum ID
        const deleteResult = await db.query(`
            DELETE FROM ${tableName}
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY word ORDER BY id) as row_num
                    FROM ${tableName}
                ) as ranked
                WHERE row_num > 1
            )
        `);

        const removed = deleteResult.rowCount;

        // Count after
        const afterCount = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        const kept = parseInt(afterCount.rows[0].count);

        console.log(`\n✅ Removed: ${removed} duplicate rows`);
        console.log(`✅ Kept: ${kept} unique words`);
        console.log(`📊 Total rows after: ${kept}`);

        // Verify no duplicates remain
        const verify = await db.query(`
            SELECT COUNT(*) FROM (
                SELECT word
                FROM ${tableName}
                GROUP BY word
                HAVING COUNT(*) > 1
            ) as dupes
        `);

        const remaining = parseInt(verify.rows[0].count);
        if (remaining === 0) {
            console.log(`✅ Verification: No duplicates remain!`);
            await db.query('COMMIT');
            console.log('✅ Transaction committed\n');
            return { removed, kept };
        } else {
            console.log(`❌ Verification failed: ${remaining} duplicates still exist!`);
            await db.query('ROLLBACK');
            console.log('❌ Transaction rolled back\n');
            throw new Error('Duplicates remain after cleanup');
        }

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(`❌ Error cleaning ${tableName}:`, error.message);
        throw error;
    }
}

async function cleanupAll() {
    console.log('\n🧹 DUPLICATE WORDS CLEANUP\n');
    console.log('This will remove all duplicate words, keeping only the first occurrence.\n');

    const results = {
        total_removed: 0,
        total_kept: 0
    };

    const tables = [
        'source_words_german',
        'source_words_english',
        'source_words_spanish',
        'source_words_french'
    ];

    for (const table of tables) {
        try {
            const result = await removeDuplicates(table);
            results.total_removed += result.removed;
            results.total_kept += result.kept;
        } catch (error) {
            console.error(`Failed to clean ${table}, stopping...`);
            throw error;
        }
    }

    console.log('═'.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Total removed: ${results.total_removed} duplicate rows`);
    console.log(`✅ Total kept: ${results.total_kept} unique words`);
    console.log('═'.repeat(60) + '\n');

    await db.end();
}

cleanupAll().catch(err => {
    console.error('❌ Cleanup failed:', err);
    db.end();
    process.exit(1);
});
