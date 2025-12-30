#!/usr/bin/env node
/**
 * Check for duplicate translations
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTranslationDuplicates() {
    try {
        console.log('🔍 Checking translation tables for duplicates...\n');

        // Check target_translations_russian
        console.log('━'.repeat(60));
        console.log('📚 target_translations_russian (German → Russian)');
        console.log('━'.repeat(60));

        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_german');
        const totalTranslations = await db.query('SELECT COUNT(*) FROM target_translations_russian');

        console.log(`Source words: ${totalWords.rows[0].count}`);
        console.log(`Translations: ${totalTranslations.rows[0].count}`);

        const ratio = (parseInt(totalTranslations.rows[0].count) / parseInt(totalWords.rows[0].count) * 100).toFixed(1);
        console.log(`Ratio: ${ratio}%`);

        // Find duplicates
        const duplicates = await db.query(`
            SELECT source_word_id, COUNT(*) as count
            FROM target_translations_russian
            GROUP BY source_word_id
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 10
        `);

        if (duplicates.rows.length > 0) {
            console.log(`\n❌ Found translations with multiple entries:\n`);
            for (const row of duplicates.rows) {
                // Get the word
                const word = await db.query(
                    'SELECT word FROM source_words_german WHERE id = $1',
                    [row.source_word_id]
                );
                console.log(`  Word ID ${row.source_word_id} ("${word.rows[0]?.word || 'DELETED'}"): ${row.count} translations`);
            }

            // Total count of duplicates
            const totalDupes = await db.query(`
                SELECT COUNT(*) FROM (
                    SELECT source_word_id
                    FROM target_translations_russian
                    GROUP BY source_word_id
                    HAVING COUNT(*) > 1
                ) as dupes
            `);

            const extraRows = await db.query(`
                SELECT SUM(count - 1) as extras FROM (
                    SELECT source_word_id, COUNT(*) as count
                    FROM target_translations_russian
                    GROUP BY source_word_id
                    HAVING COUNT(*) > 1
                ) as dupes
            `);

            console.log(`\n📊 Words with duplicate translations: ${totalDupes.rows[0].count}`);
            console.log(`🗑️  Extra translation rows to remove: ${extraRows.rows[0].extras}`);
        } else {
            console.log('\n✅ No duplicate translations found!');
        }

        console.log('\n' + '━'.repeat(60) + '\n');

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error);
        await db.end();
        process.exit(1);
    }
}

checkTranslationDuplicates();
