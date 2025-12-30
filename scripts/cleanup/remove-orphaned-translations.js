#!/usr/bin/env node
/**
 * Remove orphaned translations (translations referencing deleted source words)
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const TRANSLATION_PAIRS = [
    { source: 'german', target: 'russian' },
    { source: 'german', target: 'english' },
    { source: 'german', target: 'spanish' },
    { source: 'german', target: 'french' },
    { source: 'german', target: 'italian' },
    { source: 'german', target: 'polish' },
    { source: 'german', target: 'portuguese' },
    { source: 'german', target: 'turkish' },
    { source: 'german', target: 'arabic' },
    { source: 'german', target: 'ukrainian' },
    { source: 'german', target: 'swahili' },
    { source: 'german', target: 'romanian' },
    { source: 'german', target: 'serbian' },
    { source: 'english', target: 'russian' },
    { source: 'english', target: 'german' },
    { source: 'english', target: 'spanish' },
    { source: 'english', target: 'italian' },
    { source: 'english', target: 'polish' },
    { source: 'english', target: 'portuguese' },
    { source: 'english', target: 'turkish' },
    { source: 'english', target: 'arabic' },
    { source: 'english', target: 'ukrainian' },
    { source: 'english', target: 'swahili' },
    { source: 'english', target: 'romanian' },
    { source: 'english', target: 'serbian' },
    { source: 'spanish', target: 'russian' },
    { source: 'spanish', target: 'german' },
    { source: 'spanish', target: 'english' },
];

function getTranslationTableName(sourceLang, targetLang) {
    if (sourceLang === 'german') {
        return `target_translations_${targetLang}`;
    } else if (sourceLang === 'english') {
        return `target_translations_${targetLang}_from_en`;
    } else if (sourceLang === 'spanish') {
        return `target_translations_${targetLang}_from_es`;
    } else if (sourceLang === 'french') {
        return `target_translations_${targetLang}_from_fr`;
    }
}

async function removeOrphanedTranslations() {
    try {
        console.log('🧹 Removing orphaned translations...\n');
        console.log('━'.repeat(60));

        let totalRemoved = 0;

        for (const pair of TRANSLATION_PAIRS) {
            const sourceTable = `source_words_${pair.source}`;
            const translationTable = getTranslationTableName(pair.source, pair.target);

            console.log(`\n📚 ${pair.source} → ${pair.target} (${translationTable}):`);

            // Check for orphaned translations
            const orphanedCount = await db.query(`
                SELECT COUNT(*)
                FROM ${translationTable} tt
                LEFT JOIN ${sourceTable} sw ON tt.source_word_id = sw.id
                WHERE sw.id IS NULL
            `);

            const orphans = parseInt(orphanedCount.rows[0].count);

            if (orphans === 0) {
                console.log('  ✅ No orphaned translations');
                continue;
            }

            console.log(`  🔍 Found ${orphans} orphaned translation(s)`);

            // Delete orphaned translations
            const deleteResult = await db.query(`
                DELETE FROM ${translationTable}
                WHERE source_word_id NOT IN (
                    SELECT id FROM ${sourceTable}
                )
            `);

            const deleted = deleteResult.rowCount;
            console.log(`  ✅ Removed ${deleted} orphaned translation(s)`);
            totalRemoved += deleted;
        }

        // Final summary
        console.log('\n' + '━'.repeat(60));
        console.log('\n📊 CLEANUP SUMMARY:');
        console.log(`  Total orphaned translations removed: ${totalRemoved}`);
        console.log('\n' + '━'.repeat(60) + '\n');

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error);
        await db.end();
        process.exit(1);
    }
}

removeOrphanedTranslations();
