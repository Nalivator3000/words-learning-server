const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Known source vocabularies
const EXPECTED_SOURCES = ['de', 'en', 'es', 'pt', 'fr', 'it', 'ar', 'zh'];

// All target languages we support
const ALL_LANGUAGES = [
    'de', 'en', 'es', 'pt', 'fr', 'it', 'ar', 'zh', 'ja', 'ko',
    'ru', 'pl', 'ro', 'sr', 'uk', 'tr', 'sw', 'hi'
];

async function checkPlannedPairs() {
    try {
        console.log('📋 TRANSLATION PAIRS COMPLETION CHECK');
        console.log('='.repeat(80));
        console.log('');

        // Get actual tables
        const actualTables = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE tablename LIKE 'target_translations_%'
            AND schemaname = 'public'
        `);

        const actualPairs = new Set();
        actualTables.rows.forEach(row => {
            let source = 'de';
            let target = row.tablename.replace('target_translations_', '');

            if (row.tablename.includes('_from_')) {
                const parts = row.tablename.replace('target_translations_', '').split('_from_');
                target = parts[0];
                source = parts[1];
            }

            actualPairs.add(`${source}→${target}`);
        });

        console.log(`✅ Found ${actualPairs.size} translation pairs in database\n`);

        // Calculate expected pairs for each source
        console.log('📊 EXPECTED VS ACTUAL BY SOURCE LANGUAGE:');
        console.log('='.repeat(80));

        let totalExpected = 0;
        let totalActual = 0;
        const missingPairs = [];

        for (const source of EXPECTED_SOURCES) {
            const possibleTargets = ALL_LANGUAGES.filter(t => t !== source);
            const expected = possibleTargets.length;
            totalExpected += expected;

            let actual = 0;
            const missing = [];

            for (const target of possibleTargets) {
                const pair = `${source}→${target}`;
                if (actualPairs.has(pair)) {
                    actual++;
                } else {
                    missing.push(target);
                }
            }

            totalActual += actual;

            const status = actual === expected ? '✅' : '⚠️';
            const percent = ((actual / expected) * 100).toFixed(1);

            console.log(`${status} ${source.toUpperCase()}: ${actual}/${expected} pairs (${percent}%)`);

            if (missing.length > 0) {
                console.log(`   Missing: ${missing.join(', ').toUpperCase()}`);
                missing.forEach(t => missingPairs.push(`${source}→${t}`));
            }
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('📈 OVERALL COMPLETION');
        console.log('='.repeat(80));
        console.log(`Total expected pairs: ${totalExpected}`);
        console.log(`Total actual pairs: ${totalActual}`);
        console.log(`Completion: ${((totalActual / totalExpected) * 100).toFixed(1)}%`);
        console.log('');

        if (missingPairs.length > 0) {
            console.log(`❌ MISSING PAIRS (${missingPairs.length}):`);
            console.log('-'.repeat(80));
            missingPairs.forEach(p => console.log(`  - ${p}`));
            console.log('');
            console.log('⚠️  TRANSLATIONS NOT COMPLETE - MORE WORK NEEDED');
        } else {
            console.log('🎉 ALL PLANNED TRANSLATION PAIRS COMPLETED!');
        }

        console.log('');
        console.log('='.repeat(80));

        await db.end();
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err);
        process.exit(1);
    }
}

checkPlannedPairs();
