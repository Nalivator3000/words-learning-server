#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function analyzeHindiDataIntegrity() {
    try {
        console.log('='.repeat(70));
        console.log('🔍 HINDI DATA INTEGRITY ANALYSIS');
        console.log('='.repeat(70) + '\n');

        // 1. Check source words
        const sourceWords = await db.query('SELECT COUNT(*) as count FROM source_words_hindi');
        console.log('📝 Source Words (source_words_hindi):', sourceWords.rows[0].count);

        // 2. Check translations
        const translations = await db.query('SELECT COUNT(*) as count FROM target_translations_english_from_hi');
        console.log('🔄 Translations (target_translations_english_from_hi):', translations.rows[0].count);

        // 3. Check orphaned translations (translations without source words)
        const orphaned = await db.query(`
            SELECT COUNT(*) as count
            FROM target_translations_english_from_hi t
            WHERE NOT EXISTS (
                SELECT 1 FROM source_words_hindi s
                WHERE s.id = t.source_word_id
            )
        `);
        console.log('⚠️  Orphaned translations (no matching source word):', orphaned.rows[0].count);

        // 4. Check words without translations
        const noTranslations = await db.query(`
            SELECT COUNT(*) as count
            FROM source_words_hindi s
            WHERE NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_hi t
                WHERE t.source_word_id = s.id
            )
        `);
        console.log('⚠️  Words without translations:', noTranslations.rows[0].count);

        // 5. Sample of orphaned translations
        if (parseInt(orphaned.rows[0].count) > 0) {
            console.log('\n📋 Sample orphaned translations (first 10):');
            const orphanedSample = await db.query(`
                SELECT t.source_word_id, t.translation
                FROM target_translations_english_from_hi t
                WHERE NOT EXISTS (
                    SELECT 1 FROM source_words_hindi s
                    WHERE s.id = t.source_word_id
                )
                LIMIT 10
            `);
            orphanedSample.rows.forEach(r => {
                console.log(`  ID ${r.source_word_id} → ${r.translation}`);
            });
        }

        // 6. Sample of words without translations
        if (parseInt(noTranslations.rows[0].count) > 0) {
            console.log('\n📋 Sample words without translations (first 10):');
            const noTransSample = await db.query(`
                SELECT s.id, s.word, s.level
                FROM source_words_hindi s
                WHERE NOT EXISTS (
                    SELECT 1 FROM target_translations_english_from_hi t
                    WHERE t.source_word_id = s.id
                )
                LIMIT 10
            `);
            noTransSample.rows.forEach(r => {
                console.log(`  ID ${r.id}: ${r.word} (${r.level})`);
            });
        }

        // 7. Check ID ranges
        console.log('\n📊 ID Ranges:');
        const wordIdRange = await db.query('SELECT MIN(id) as min, MAX(id) as max FROM source_words_hindi');
        const transIdRange = await db.query('SELECT MIN(source_word_id) as min, MAX(source_word_id) as max FROM target_translations_english_from_hi');

        console.log('  Source words IDs:', wordIdRange.rows[0].min, '-', wordIdRange.rows[0].max);
        console.log('  Translation IDs:', transIdRange.rows[0].min, '-', transIdRange.rows[0].max);

        // 8. Check word sets
        const wordSets = await db.query(`
            SELECT COUNT(*) as count
            FROM word_sets
            WHERE source_language = 'hindi'
        `);
        console.log('\n📚 Word Sets:', wordSets.rows[0].count);

        const wordSetItems = await db.query(`
            SELECT COUNT(*) as count
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            WHERE ws.source_language = 'hindi'
        `);
        console.log('📊 Word Set Items:', wordSetItems.rows[0].count);

        // 9. Check if word set items reference existing words
        const orphanedItems = await db.query(`
            SELECT COUNT(*) as count
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            WHERE ws.source_language = 'hindi'
            AND NOT EXISTS (
                SELECT 1 FROM source_words_hindi s
                WHERE s.id = wsi.word_id
            )
        `);
        console.log('⚠️  Orphaned word set items:', orphanedItems.rows[0].count);

        console.log('\n' + '='.repeat(70));
        console.log('SUMMARY');
        console.log('='.repeat(70));

        const issues = [];
        if (parseInt(orphaned.rows[0].count) > 0) {
            issues.push(`${orphaned.rows[0].count} orphaned translations`);
        }
        if (parseInt(noTranslations.rows[0].count) > 0) {
            issues.push(`${noTranslations.rows[0].count} words without translations`);
        }
        if (parseInt(orphanedItems.rows[0].count) > 0) {
            issues.push(`${orphanedItems.rows[0].count} orphaned word set items`);
        }

        if (issues.length === 0) {
            console.log('✅ No data integrity issues found!');
        } else {
            console.log('⚠️  Issues found:');
            issues.forEach(issue => console.log(`   - ${issue}`));
        }

        console.log('='.repeat(70) + '\n');

        await db.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await db.end();
    }
}

analyzeHindiDataIntegrity();
