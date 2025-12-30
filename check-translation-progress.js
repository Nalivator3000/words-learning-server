#!/usr/bin/env node
/**
 * Check translation progress for all planned language pairs
 */

const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 30000
});

// Translation pairs from the matrix
const TRANSLATION_MATRIX = [
    // Phase 1: Big 3
    { phase: 1, source: 'de', target: 'ja' },
    { phase: 1, source: 'de', target: 'ko' },
    { phase: 1, source: 'de', target: 'hi' },
    { phase: 1, source: 'de', target: 'tr' },
    { phase: 1, source: 'en', target: 'ja' },
    { phase: 1, source: 'en', target: 'ko' },
    { phase: 1, source: 'en', target: 'hi' },
    { phase: 1, source: 'en', target: 'tr' },
    { phase: 1, source: 'es', target: 'ja' },
    { phase: 1, source: 'es', target: 'ko' },
    { phase: 1, source: 'es', target: 'hi' },
    { phase: 1, source: 'es', target: 'tr' },
];

const LANG_NAMES = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'it': 'italian', 'pl': 'polish', 'pt': 'portuguese',
    'ro': 'romanian', 'sr': 'serbian', 'tr': 'turkish', 'uk': 'ukrainian',
    'ar': 'arabic', 'sw': 'swahili', 'zh': 'chinese', 'hi': 'hindi',
    'ja': 'japanese', 'ko': 'korean'
};

function getTableName(source, target) {
    const sourceName = LANG_NAMES[source];
    const targetName = LANG_NAMES[target];

    if (source === 'de') {
        return `target_translations_${targetName}`;
    } else {
        return `target_translations_${targetName}_from_${source}`;
    }
}

async function checkProgress() {
    try {
        console.log('📊 TRANSLATION PROGRESS REPORT');
        console.log('='.repeat(80));
        console.log('');

        const results = [];

        for (const pair of TRANSLATION_MATRIX) {
            const sourceName = LANG_NAMES[pair.source];
            const targetName = LANG_NAMES[pair.target];
            const tableName = getTableName(pair.source, pair.target);

            // Check if table exists
            const tableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = $1
                )
            `, [tableName]);

            if (tableCheck.rows[0].exists) {
                const transCount = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
                const sourceCount = await db.query(`SELECT COUNT(*) FROM source_words_${sourceName}`);

                const translated = parseInt(transCount.rows[0].count);
                const total = parseInt(sourceCount.rows[0].count);
                const percent = ((translated / total) * 100).toFixed(1);

                results.push({
                    ...pair,
                    sourceName,
                    targetName,
                    tableName,
                    translated,
                    total,
                    percent: parseFloat(percent),
                    status: percent == 100 ? '✅' : percent > 0 ? '⏳' : '⬜'
                });
            } else {
                const sourceCount = await db.query(`SELECT COUNT(*) FROM source_words_${sourceName}`);
                const total = parseInt(sourceCount.rows[0].count);

                results.push({
                    ...pair,
                    sourceName,
                    targetName,
                    tableName,
                    translated: 0,
                    total,
                    percent: 0,
                    status: '⬜'
                });
            }
        }

        // Group by phase
        console.log('PHASE 1: Big 3 Languages (High Priority)');
        console.log('-'.repeat(80));

        const phase1 = results.filter(r => r.phase === 1);

        for (const r of phase1) {
            const bar = '█'.repeat(Math.floor(r.percent / 5)) + '░'.repeat(20 - Math.floor(r.percent / 5));
            console.log(`${r.status} ${r.source.toUpperCase()} → ${r.target.toUpperCase()}: [${bar}] ${r.percent}% (${r.translated}/${r.total})`);
        }

        const phase1Completed = phase1.filter(r => r.percent === 100).length;
        const phase1InProgress = phase1.filter(r => r.percent > 0 && r.percent < 100).length;
        const phase1Pending = phase1.filter(r => r.percent === 0).length;

        console.log('');
        console.log(`Summary: ${phase1Completed}/12 completed, ${phase1InProgress} in progress, ${phase1Pending} pending`);
        console.log('');

        // Overall stats
        const totalCompleted = results.filter(r => r.percent === 100).length;
        const totalInProgress = results.filter(r => r.percent > 0 && r.percent < 100).length;
        const totalPending = results.filter(r => r.percent === 0).length;

        console.log('='.repeat(80));
        console.log('OVERALL STATUS');
        console.log('='.repeat(80));
        console.log(`✅ Completed: ${totalCompleted}/${results.length}`);
        console.log(`⏳ In Progress: ${totalInProgress}/${results.length}`);
        console.log(`⬜ Pending: ${totalPending}/${results.length}`);
        console.log('');

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await db.end();
        process.exit(1);
    }
}

checkProgress();
