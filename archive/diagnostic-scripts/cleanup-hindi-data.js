#!/usr/bin/env node
/**
 * Clean up Hindi data integrity issues:
 * 1. Remove orphaned translations (old IDs that don't match current source words)
 * 2. Remove invalid word (standalone diacritic character)
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanupHindiData() {
    try {
        console.log('='.repeat(70));
        console.log('🧹 CLEANING UP HINDI DATA');
        console.log('='.repeat(70) + '\n');

        // Step 1: Check current state
        console.log('📊 Current state:');
        const currentWords = await db.query('SELECT COUNT(*) FROM source_words_hindi');
        const currentTrans = await db.query('SELECT COUNT(*) FROM target_translations_english_from_hi');
        const orphaned = await db.query(`
            SELECT COUNT(*) as count
            FROM target_translations_english_from_hi t
            WHERE NOT EXISTS (
                SELECT 1 FROM source_words_hindi s
                WHERE s.id = t.source_word_id
            )
        `);
        const invalidWord = await db.query(`SELECT COUNT(*) FROM source_words_hindi WHERE word = 'ँ'`);

        console.log(`  Source words: ${currentWords.rows[0].count}`);
        console.log(`  Translations: ${currentTrans.rows[0].count}`);
        console.log(`  Orphaned translations: ${orphaned.rows[0].count}`);
        console.log(`  Invalid words ('ँ'): ${invalidWord.rows[0].count}\n`);

        // Step 2: Delete orphaned translations
        if (parseInt(orphaned.rows[0].count) > 0) {
            console.log(`🗑️  Deleting ${orphaned.rows[0].count} orphaned translations...`);

            const deleteResult = await db.query(`
                DELETE FROM target_translations_english_from_hi
                WHERE NOT EXISTS (
                    SELECT 1 FROM source_words_hindi
                    WHERE id = source_word_id
                )
            `);

            console.log(`   ✅ Deleted ${deleteResult.rowCount} orphaned translations\n`);
        } else {
            console.log('✅ No orphaned translations to delete\n');
        }

        // Step 3: Delete invalid word
        if (parseInt(invalidWord.rows[0].count) > 0) {
            console.log(`🗑️  Deleting invalid word 'ँ'...`);

            // First, remove from word sets
            const wordIdResult = await db.query(`SELECT id FROM source_words_hindi WHERE word = 'ँ'`);
            if (wordIdResult.rows.length > 0) {
                const wordId = wordIdResult.rows[0].id;

                // Delete from word_set_items
                const deletedItems = await db.query(`
                    DELETE FROM word_set_items
                    WHERE word_id = $1
                `, [wordId]);
                console.log(`   Removed from ${deletedItems.rowCount} word sets`);

                // Delete from source_words_hindi
                const deletedWord = await db.query(`
                    DELETE FROM source_words_hindi
                    WHERE word = 'ँ'
                `);
                console.log(`   ✅ Deleted ${deletedWord.rowCount} invalid word\n`);
            }
        } else {
            console.log('✅ No invalid words to delete\n');
        }

        // Step 4: Verify final state
        console.log('='.repeat(70));
        console.log('VERIFICATION');
        console.log('='.repeat(70) + '\n');

        const finalWords = await db.query('SELECT COUNT(*) FROM source_words_hindi');
        const finalTrans = await db.query('SELECT COUNT(*) FROM target_translations_english_from_hi');
        const finalOrphaned = await db.query(`
            SELECT COUNT(*) as count
            FROM target_translations_english_from_hi t
            WHERE NOT EXISTS (
                SELECT 1 FROM source_words_hindi s
                WHERE s.id = t.source_word_id
            )
        `);
        const noTranslation = await db.query(`
            SELECT COUNT(*) as count
            FROM source_words_hindi s
            WHERE NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_hi t
                WHERE t.source_word_id = s.id
            )
        `);

        console.log('📊 Final state:');
        console.log(`  Source words: ${finalWords.rows[0].count}`);
        console.log(`  Translations: ${finalTrans.rows[0].count}`);
        console.log(`  Orphaned translations: ${finalOrphaned.rows[0].count}`);
        console.log(`  Words without translation: ${noTranslation.rows[0].count}\n`);

        if (parseInt(finalOrphaned.rows[0].count) === 0) {
            console.log('✅ All translations are properly linked!\n');
        } else {
            console.log(`⚠️  Still ${finalOrphaned.rows[0].count} orphaned translations\n`);
        }

        // Step 5: Show statistics by level
        const byLevel = await db.query(`
            SELECT level, COUNT(*) as count
            FROM source_words_hindi
            GROUP BY level
            ORDER BY
                CASE level
                    WHEN 'A1' THEN 1
                    WHEN 'A2' THEN 2
                    WHEN 'B1' THEN 3
                    WHEN 'B2' THEN 4
                    WHEN 'C1' THEN 5
                    WHEN 'C2' THEN 6
                END
        `);

        console.log('📈 Words by level:');
        byLevel.rows.forEach(row => {
            console.log(`   ${row.level}: ${row.count} words`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('✅ CLEANUP COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

cleanupHindiData();
