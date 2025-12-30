#!/usr/bin/env node
/**
 * Real-time Translation Progress Monitor
 * Shows detailed progress for all ongoing translations
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// All translation table patterns
const TRANSLATION_TABLES = [
    // German source (main tables)
    'target_translations_russian',
    'target_translations_english',
    'target_translations_polish',
    'target_translations_romanian',
    'target_translations_serbian',
    'target_translations_ukrainian',
    'target_translations_arabic',
    'target_translations_swahili',
    'target_translations_turkish',
    'target_translations_portuguese',
    'target_translations_italian',
    'target_translations_spanish',

    // English source
    'target_translations_russian_from_en',
    'target_translations_german_from_en',
    'target_translations_spanish_from_en',
    'target_translations_french_from_en',

    // Portuguese source
    'target_translations_russian_from_pt',
    'target_translations_german_from_pt',
    'target_translations_english_from_pt',
    'target_translations_spanish_from_pt',

    // Italian source
    'target_translations_russian_from_it',
    'target_translations_german_from_it',
    'target_translations_english_from_it',
    'target_translations_spanish_from_it',

    // Arabic source
    'target_translations_russian_from_ar',
    'target_translations_german_from_ar',
    'target_translations_english_from_ar',
    'target_translations_spanish_from_ar',

    // Turkish source
    'target_translations_russian_from_tr',
    'target_translations_german_from_tr',
    'target_translations_english_from_tr',
    'target_translations_spanish_from_tr'
];

async function checkTableExists(tableName) {
    const result = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
        )
    `, [tableName]);
    return result.rows[0].exists;
}

async function getTableCount(tableName) {
    try {
        const result = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        return parseInt(result.rows[0].count);
    } catch (error) {
        return 0;
    }
}

async function monitorProgress() {
    console.log('\n📊 TRANSLATION PROGRESS MONITOR');
    console.log('='.repeat(80));
    console.log(`⏰ ${new Date().toLocaleString()}\n`);

    const results = {
        germanSource: [],
        englishSource: [],
        portugueseSource: [],
        italianSource: [],
        arabicSource: [],
        turkishSource: []
    };

    let totalTranslations = 0;

    // Check German source translations (main tables)
    console.log('🇩🇪 GERMAN SOURCE TRANSLATIONS (8,076 words)');
    console.log('-'.repeat(80));
    for (const table of TRANSLATION_TABLES.slice(0, 12)) {
        const count = await getTableCount(table);
        const target = table.replace('target_translations_', '').toUpperCase();
        const progress = ((count / 8076) * 100).toFixed(1);
        const status = count >= 8076 ? '✅' : count > 0 ? '🔄' : '⏳';

        console.log(`${status} ${target.padEnd(12)} ${count.toLocaleString().padStart(6)} / 8,076   (${progress}%)`);
        results.germanSource.push({ target, count, total: 8076 });
        totalTranslations += count;
    }

    // Check English source translations
    console.log('\n🇬🇧 ENGLISH SOURCE TRANSLATIONS (9,974 words)');
    console.log('-'.repeat(80));
    const enTables = TRANSLATION_TABLES.filter(t => t.includes('_from_en'));
    for (const table of enTables) {
        const exists = await checkTableExists(table);
        if (exists) {
            const count = await getTableCount(table);
            const target = table.replace('target_translations_', '').replace('_from_en', '').toUpperCase();
            const progress = ((count / 9974) * 100).toFixed(1);
            const status = count >= 9974 ? '✅' : count > 0 ? '🔄' : '⏳';

            console.log(`${status} ${target.padEnd(12)} ${count.toLocaleString().padStart(6)} / 9,974   (${progress}%)`);
            results.englishSource.push({ target, count, total: 9974 });
            totalTranslations += count;
        }
    }

    // Check Portuguese source translations
    console.log('\n🇵🇹 PORTUGUESE SOURCE TRANSLATIONS (10,000 words)');
    console.log('-'.repeat(80));
    const ptTables = TRANSLATION_TABLES.filter(t => t.includes('_from_pt'));
    for (const table of ptTables) {
        const exists = await checkTableExists(table);
        if (exists) {
            const count = await getTableCount(table);
            const target = table.replace('target_translations_', '').replace('_from_pt', '').toUpperCase();
            const progress = ((count / 10000) * 100).toFixed(1);
            const status = count >= 10000 ? '✅' : count > 0 ? '🔄' : '⏳';

            console.log(`${status} ${target.padEnd(12)} ${count.toLocaleString().padStart(6)} / 10,000  (${progress}%)`);
            results.portugueseSource.push({ target, count, total: 10000 });
            totalTranslations += count;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 OVERALL STATISTICS');
    console.log('='.repeat(80));
    console.log(`\nTotal Translations in Database: ${totalTranslations.toLocaleString()}`);
    console.log(`German Source Pairs Complete: ${results.germanSource.filter(r => r.count >= r.total).length}/12`);
    console.log(`English Source Pairs Created: ${results.englishSource.length}`);
    console.log(`Portuguese Source Pairs Created: ${results.portugueseSource.length}`);

    // Estimate completion
    const germanComplete = results.germanSource.filter(r => r.count >= r.total).length;
    const germanProgress = (germanComplete / 12 * 100).toFixed(1);

    console.log(`\n🎯 German→All Progress: ${germanProgress}% (${germanComplete}/12 complete)`);

    console.log('\n' + '='.repeat(80) + '\n');

    await db.end();
}

monitorProgress().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
