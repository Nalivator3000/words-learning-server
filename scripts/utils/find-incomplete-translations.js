#!/usr/bin/env node
/**
 * Find Incomplete Translation Pairs
 * Identifies which translation tables need to be filled
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Source languages and their expected counts
const SOURCE_LANGUAGES = {
    'german': { code: 'de', count: 8076, table: 'source_words_german' },
    'english': { code: 'en', count: 9974, table: 'source_words_english' },
    'spanish': { code: 'es', count: 9972, table: 'source_words_spanish' },
    'french': { code: 'fr', count: 9332, table: 'source_words_french' },
    'chinese': { code: 'zh', count: 10000, table: 'source_words_chinese' },
    'portuguese': { code: 'pt', count: 10000, table: 'source_words_portuguese' },
    'italian': { code: 'it', count: 10000, table: 'source_words_italian' },
    'arabic': { code: 'ar', count: 10000, table: 'source_words_arabic' },
    'turkish': { code: 'tr', count: 10000, table: 'source_words_turkish' }
};

async function findIncompletePairs() {
    console.log('\n🔍 INCOMPLETE TRANSLATION PAIRS FINDER');
    console.log('='.repeat(80));

    // Get all translation tables
    const tablesResult = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'target_translations_%'
        ORDER BY table_name
    `);

    const incomplete = [];
    const complete = [];
    const empty = [];

    for (const row of tablesResult.rows) {
        const tableName = row.table_name;

        // Determine source language and expected count
        let sourceLang = 'german';
        let expectedCount = 8076;

        if (tableName.includes('_from_en')) {
            sourceLang = 'english';
            expectedCount = 9974;
        } else if (tableName.includes('_from_es')) {
            sourceLang = 'spanish';
            expectedCount = 9972;
        } else if (tableName.includes('_from_fr')) {
            sourceLang = 'french';
            expectedCount = 9332;
        } else if (tableName.includes('_from_zh')) {
            sourceLang = 'chinese';
            expectedCount = 10000;
        } else if (tableName.includes('_from_pt')) {
            sourceLang = 'portuguese';
            expectedCount = 10000;
        } else if (tableName.includes('_from_it')) {
            sourceLang = 'italian';
            expectedCount = 10000;
        } else if (tableName.includes('_from_ar')) {
            sourceLang = 'arabic';
            expectedCount = 10000;
        } else if (tableName.includes('_from_tr')) {
            sourceLang = 'turkish';
            expectedCount = 10000;
        }

        // Get count
        const countResult = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);
        const progress = ((count / expectedCount) * 100).toFixed(1);

        const targetLang = tableName
            .replace('target_translations_', '')
            .replace('_from_en', '')
            .replace('_from_es', '')
            .replace('_from_fr', '')
            .replace('_from_zh', '')
            .replace('_from_pt', '')
            .replace('_from_it', '')
            .replace('_from_ar', '')
            .replace('_from_tr', '');

        const pair = {
            tableName,
            source: sourceLang,
            target: targetLang,
            count,
            expected: expectedCount,
            progress: parseFloat(progress)
        };

        if (count === 0) {
            empty.push(pair);
        } else if (count < expectedCount) {
            incomplete.push(pair);
        } else {
            complete.push(pair);
        }
    }

    // Report
    console.log(`\n✅ COMPLETE PAIRS (${complete.length})`);
    console.log('-'.repeat(80));
    complete.forEach(p => {
        console.log(`  ${p.source.toUpperCase().padEnd(10)} → ${p.target.toUpperCase().padEnd(10)} ${p.count.toLocaleString().padStart(6)}`);
    });

    console.log(`\n🔄 INCOMPLETE PAIRS (${incomplete.length})`);
    console.log('-'.repeat(80));
    incomplete.forEach(p => {
        console.log(`  ${p.source.toUpperCase().padEnd(10)} → ${p.target.toUpperCase().padEnd(10)} ${p.count.toLocaleString().padStart(6)} / ${p.expected.toLocaleString()} (${p.progress}%)`);
    });

    console.log(`\n⏳ EMPTY PAIRS (${empty.length})`);
    console.log('-'.repeat(80));
    empty.forEach(p => {
        console.log(`  ${p.source.toUpperCase().padEnd(10)} → ${p.target.toUpperCase().padEnd(10)} 0 / ${p.expected.toLocaleString()}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Complete: ${complete.length}`);
    console.log(`Incomplete: ${incomplete.length}`);
    console.log(`Empty: ${empty.length}`);
    console.log(`Total: ${tablesResult.rows.length}`);
    console.log('\n💡 NEXT STEPS:');

    if (incomplete.length > 0) {
        console.log('\n🔄 Resume incomplete translations:');
        incomplete.slice(0, 5).forEach(p => {
            const cmd = `node scripts/translations/translate-pair-v2.js ${p.source} ${p.target}`;
            console.log(`   ${cmd}`);
        });
    }

    if (empty.length > 0) {
        console.log('\n⏳ Start empty translations:');
        empty.slice(0, 5).forEach(p => {
            const cmd = `node scripts/translations/translate-pair-v2.js ${p.source} ${p.target}`;
            console.log(`   ${cmd}`);
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    await db.end();
}

findIncompletePairs().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
