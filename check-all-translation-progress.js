#!/usr/bin/env node
/**
 * Check translation progress for ALL planned language pairs
 */

const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 30000
});

// Full translation matrix from translate-matrix-parallel.js
const TRANSLATION_MATRIX = [
    // Phase 1: Complete Big 3 (12 pairs)
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

    // Phase 2: European Languages (39 pairs)
    { phase: 2, source: 'fr', target: 'ar' },
    { phase: 2, source: 'fr', target: 'it' },
    { phase: 2, source: 'fr', target: 'pt' },
    { phase: 2, source: 'fr', target: 'pl' },
    { phase: 2, source: 'fr', target: 'ro' },
    { phase: 2, source: 'fr', target: 'sr' },
    { phase: 2, source: 'fr', target: 'uk' },
    { phase: 2, source: 'fr', target: 'tr' },
    { phase: 2, source: 'fr', target: 'sw' },
    { phase: 2, source: 'fr', target: 'zh' },
    { phase: 2, source: 'fr', target: 'ja' },
    { phase: 2, source: 'fr', target: 'ko' },
    { phase: 2, source: 'fr', target: 'hi' },

    { phase: 2, source: 'it', target: 'ar' },
    { phase: 2, source: 'it', target: 'fr' },
    { phase: 2, source: 'it', target: 'pt' },
    { phase: 2, source: 'it', target: 'pl' },
    { phase: 2, source: 'it', target: 'ro' },
    { phase: 2, source: 'it', target: 'sr' },
    { phase: 2, source: 'it', target: 'uk' },
    { phase: 2, source: 'it', target: 'tr' },
    { phase: 2, source: 'it', target: 'sw' },
    { phase: 2, source: 'it', target: 'zh' },
    { phase: 2, source: 'it', target: 'ja' },
    { phase: 2, source: 'it', target: 'ko' },
    { phase: 2, source: 'it', target: 'hi' },

    { phase: 2, source: 'pt', target: 'ar' },
    { phase: 2, source: 'pt', target: 'fr' },
    { phase: 2, source: 'pt', target: 'it' },
    { phase: 2, source: 'pt', target: 'pl' },
    { phase: 2, source: 'pt', target: 'ro' },
    { phase: 2, source: 'pt', target: 'sr' },
    { phase: 2, source: 'pt', target: 'uk' },
    { phase: 2, source: 'pt', target: 'tr' },
    { phase: 2, source: 'pt', target: 'sw' },
    { phase: 2, source: 'pt', target: 'zh' },
    { phase: 2, source: 'pt', target: 'ja' },
    { phase: 2, source: 'pt', target: 'ko' },
    { phase: 2, source: 'pt', target: 'hi' },

    // Phase 3: Arabic & Chinese (28 pairs)
    { phase: 3, source: 'ar', target: 'de' },
    { phase: 3, source: 'ar', target: 'en' },
    { phase: 3, source: 'ar', target: 'es' },
    { phase: 3, source: 'ar', target: 'fr' },
    { phase: 3, source: 'ar', target: 'it' },
    { phase: 3, source: 'ar', target: 'pt' },
    { phase: 3, source: 'ar', target: 'pl' },
    { phase: 3, source: 'ar', target: 'ro' },
    { phase: 3, source: 'ar', target: 'sr' },
    { phase: 3, source: 'ar', target: 'uk' },
    { phase: 3, source: 'ar', target: 'tr' },
    { phase: 3, source: 'ar', target: 'sw' },
    { phase: 3, source: 'ar', target: 'zh' },
    { phase: 3, source: 'ar', target: 'ja' },
    { phase: 3, source: 'ar', target: 'ko' },
    { phase: 3, source: 'ar', target: 'hi' },

    { phase: 3, source: 'zh', target: 'ar' },
    { phase: 3, source: 'zh', target: 'de' },
    { phase: 3, source: 'zh', target: 'en' },
    { phase: 3, source: 'zh', target: 'es' },
    { phase: 3, source: 'zh', target: 'fr' },
    { phase: 3, source: 'zh', target: 'it' },
    { phase: 3, source: 'zh', target: 'pt' },
    { phase: 3, source: 'zh', target: 'pl' },
    { phase: 3, source: 'zh', target: 'ro' },
    { phase: 3, source: 'zh', target: 'sr' },
    { phase: 3, source: 'zh', target: 'uk' },
    { phase: 3, source: 'zh', target: 'tr' },
    { phase: 3, source: 'zh', target: 'sw' },
    { phase: 3, source: 'zh', target: 'ja' },
    { phase: 3, source: 'zh', target: 'ko' },
    { phase: 3, source: 'zh', target: 'hi' },

    // Phase 4: Russian (17 pairs)
    { phase: 4, source: 'ru', target: 'de' },
    { phase: 4, source: 'ru', target: 'en' },
    { phase: 4, source: 'ru', target: 'es' },
    { phase: 4, source: 'ru', target: 'fr' },
    { phase: 4, source: 'ru', target: 'it' },
    { phase: 4, source: 'ru', target: 'pt' },
    { phase: 4, source: 'ru', target: 'ar' },
    { phase: 4, source: 'ru', target: 'zh' },
    { phase: 4, source: 'ru', target: 'ja' },
    { phase: 4, source: 'ru', target: 'ko' },
    { phase: 4, source: 'ru', target: 'pl' },
    { phase: 4, source: 'ru', target: 'ro' },
    { phase: 4, source: 'ru', target: 'sr' },
    { phase: 4, source: 'ru', target: 'uk' },
    { phase: 4, source: 'ru', target: 'tr' },
    { phase: 4, source: 'ru', target: 'sw' },
    { phase: 4, source: 'ru', target: 'hi' },

    // Phase 5: Eastern European (51 pairs)
    { phase: 5, source: 'pl', target: 'de' },
    { phase: 5, source: 'pl', target: 'en' },
    { phase: 5, source: 'pl', target: 'es' },
    { phase: 5, source: 'pl', target: 'fr' },
    { phase: 5, source: 'pl', target: 'it' },
    { phase: 5, source: 'pl', target: 'pt' },
    { phase: 5, source: 'pl', target: 'ar' },
    { phase: 5, source: 'pl', target: 'zh' },
    { phase: 5, source: 'pl', target: 'ja' },
    { phase: 5, source: 'pl', target: 'ko' },
    { phase: 5, source: 'pl', target: 'ru' },
    { phase: 5, source: 'pl', target: 'ro' },
    { phase: 5, source: 'pl', target: 'sr' },
    { phase: 5, source: 'pl', target: 'uk' },
    { phase: 5, source: 'pl', target: 'tr' },
    { phase: 5, source: 'pl', target: 'sw' },
    { phase: 5, source: 'pl', target: 'hi' },

    { phase: 5, source: 'ro', target: 'de' },
    { phase: 5, source: 'ro', target: 'en' },
    { phase: 5, source: 'ro', target: 'es' },
    { phase: 5, source: 'ro', target: 'fr' },
    { phase: 5, source: 'ro', target: 'it' },
    { phase: 5, source: 'ro', target: 'pt' },
    { phase: 5, source: 'ro', target: 'ar' },
    { phase: 5, source: 'ro', target: 'zh' },
    { phase: 5, source: 'ro', target: 'ja' },
    { phase: 5, source: 'ro', target: 'ko' },
    { phase: 5, source: 'ro', target: 'ru' },
    { phase: 5, source: 'ro', target: 'pl' },
    { phase: 5, source: 'ro', target: 'sr' },
    { phase: 5, source: 'ro', target: 'uk' },
    { phase: 5, source: 'ro', target: 'tr' },
    { phase: 5, source: 'ro', target: 'sw' },
    { phase: 5, source: 'ro', target: 'hi' },

    { phase: 5, source: 'uk', target: 'de' },
    { phase: 5, source: 'uk', target: 'en' },
    { phase: 5, source: 'uk', target: 'es' },
    { phase: 5, source: 'uk', target: 'fr' },
    { phase: 5, source: 'uk', target: 'it' },
    { phase: 5, source: 'uk', target: 'pt' },
    { phase: 5, source: 'uk', target: 'ar' },
    { phase: 5, source: 'uk', target: 'zh' },
    { phase: 5, source: 'uk', target: 'ja' },
    { phase: 5, source: 'uk', target: 'ko' },
    { phase: 5, source: 'uk', target: 'ru' },
    { phase: 5, source: 'uk', target: 'pl' },
    { phase: 5, source: 'uk', target: 'ro' },
    { phase: 5, source: 'uk', target: 'sr' },
    { phase: 5, source: 'uk', target: 'tr' },
    { phase: 5, source: 'uk', target: 'sw' },
    { phase: 5, source: 'uk', target: 'hi' },

    // Phase 6: Asian Languages (51 pairs)
    { phase: 6, source: 'ja', target: 'de' },
    { phase: 6, source: 'ja', target: 'en' },
    { phase: 6, source: 'ja', target: 'es' },
    { phase: 6, source: 'ja', target: 'fr' },
    { phase: 6, source: 'ja', target: 'it' },
    { phase: 6, source: 'ja', target: 'pt' },
    { phase: 6, source: 'ja', target: 'ar' },
    { phase: 6, source: 'ja', target: 'zh' },
    { phase: 6, source: 'ja', target: 'ko' },
    { phase: 6, source: 'ja', target: 'ru' },
    { phase: 6, source: 'ja', target: 'pl' },
    { phase: 6, source: 'ja', target: 'ro' },
    { phase: 6, source: 'ja', target: 'sr' },
    { phase: 6, source: 'ja', target: 'uk' },
    { phase: 6, source: 'ja', target: 'tr' },
    { phase: 6, source: 'ja', target: 'sw' },
    { phase: 6, source: 'ja', target: 'hi' },

    { phase: 6, source: 'ko', target: 'de' },
    { phase: 6, source: 'ko', target: 'en' },
    { phase: 6, source: 'ko', target: 'es' },
    { phase: 6, source: 'ko', target: 'fr' },
    { phase: 6, source: 'ko', target: 'it' },
    { phase: 6, source: 'ko', target: 'pt' },
    { phase: 6, source: 'ko', target: 'ar' },
    { phase: 6, source: 'ko', target: 'zh' },
    { phase: 6, source: 'ko', target: 'ja' },
    { phase: 6, source: 'ko', target: 'ru' },
    { phase: 6, source: 'ko', target: 'pl' },
    { phase: 6, source: 'ko', target: 'ro' },
    { phase: 6, source: 'ko', target: 'sr' },
    { phase: 6, source: 'ko', target: 'uk' },
    { phase: 6, source: 'ko', target: 'tr' },
    { phase: 6, source: 'ko', target: 'sw' },
    { phase: 6, source: 'ko', target: 'hi' },

    { phase: 6, source: 'hi', target: 'de' },
    { phase: 6, source: 'hi', target: 'en' },
    { phase: 6, source: 'hi', target: 'es' },
    { phase: 6, source: 'hi', target: 'fr' },
    { phase: 6, source: 'hi', target: 'it' },
    { phase: 6, source: 'hi', target: 'pt' },
    { phase: 6, source: 'hi', target: 'ar' },
    { phase: 6, source: 'hi', target: 'zh' },
    { phase: 6, source: 'hi', target: 'ja' },
    { phase: 6, source: 'hi', target: 'ko' },
    { phase: 6, source: 'hi', target: 'ru' },
    { phase: 6, source: 'hi', target: 'pl' },
    { phase: 6, source: 'hi', target: 'ro' },
    { phase: 6, source: 'hi', target: 'sr' },
    { phase: 6, source: 'hi', target: 'uk' },
    { phase: 6, source: 'hi', target: 'tr' },
    { phase: 6, source: 'hi', target: 'sw' },

    // Phase 7: Turkish (17 pairs)
    { phase: 7, source: 'tr', target: 'de' },
    { phase: 7, source: 'tr', target: 'en' },
    { phase: 7, source: 'tr', target: 'es' },
    { phase: 7, source: 'tr', target: 'fr' },
    { phase: 7, source: 'tr', target: 'it' },
    { phase: 7, source: 'tr', target: 'pt' },
    { phase: 7, source: 'tr', target: 'ar' },
    { phase: 7, source: 'tr', target: 'zh' },
    { phase: 7, source: 'tr', target: 'ja' },
    { phase: 7, source: 'tr', target: 'ko' },
    { phase: 7, source: 'tr', target: 'ru' },
    { phase: 7, source: 'tr', target: 'pl' },
    { phase: 7, source: 'tr', target: 'ro' },
    { phase: 7, source: 'tr', target: 'sr' },
    { phase: 7, source: 'tr', target: 'uk' },
    { phase: 7, source: 'tr', target: 'sw' },
    { phase: 7, source: 'tr', target: 'hi' }
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
        console.log('📊 COMPLETE TRANSLATION PROGRESS REPORT');
        console.log('='.repeat(80));
        console.log(`Total pairs to check: ${TRANSLATION_MATRIX.length}`);
        console.log('');

        const results = [];
        let processed = 0;

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

            processed++;
            if (processed % 20 === 0) {
                console.log(`Progress: ${processed}/${TRANSLATION_MATRIX.length} checked...`);
            }
        }

        console.log('');

        // Group by phase
        for (let phase = 1; phase <= 7; phase++) {
            const phaseResults = results.filter(r => r.phase === phase);
            const completed = phaseResults.filter(r => r.percent === 100).length;
            const inProgress = phaseResults.filter(r => r.percent > 0 && r.percent < 100).length;
            const pending = phaseResults.filter(r => r.percent === 0).length;

            console.log('');
            console.log(`PHASE ${phase}: ${phaseResults.length} pairs (${completed} done, ${inProgress} in progress, ${pending} pending)`);
            console.log('-'.repeat(80));

            // Show first 10 and last 10 if more than 20
            const toShow = phaseResults.length > 20 ?
                [...phaseResults.slice(0, 10), { spacer: true }, ...phaseResults.slice(-10)] :
                phaseResults;

            for (const r of toShow) {
                if (r.spacer) {
                    console.log('   ... (' + (phaseResults.length - 20) + ' more pairs) ...');
                    continue;
                }

                const bar = '█'.repeat(Math.floor(r.percent / 5)) + '░'.repeat(20 - Math.floor(r.percent / 5));
                const padding = ' '.repeat(6 - (r.source + r.target).length);
                console.log(`${r.status} ${r.source.toUpperCase()}→${r.target.toUpperCase()}${padding} [${bar}] ${r.percent.toFixed(1).padStart(5)}% (${r.translated.toString().padStart(5)}/${r.total})`);
            }
        }

        // Overall stats
        console.log('');
        console.log('='.repeat(80));
        console.log('OVERALL SUMMARY');
        console.log('='.repeat(80));

        for (let phase = 1; phase <= 7; phase++) {
            const phaseResults = results.filter(r => r.phase === phase);
            const completed = phaseResults.filter(r => r.percent === 100).length;
            const inProgress = phaseResults.filter(r => r.percent > 0 && r.percent < 100).length;
            const pending = phaseResults.filter(r => r.percent === 0).length;
            const progressPercent = ((completed / phaseResults.length) * 100).toFixed(1);

            console.log(`Phase ${phase}: ${completed.toString().padStart(3)}/${phaseResults.length} (${progressPercent.padStart(5)}%) | ✅ ${completed} | ⏳ ${inProgress} | ⬜ ${pending}`);
        }

        const totalCompleted = results.filter(r => r.percent === 100).length;
        const totalInProgress = results.filter(r => r.percent > 0 && r.percent < 100).length;
        const totalPending = results.filter(r => r.percent === 0).length;
        const totalPercent = ((totalCompleted / results.length) * 100).toFixed(1);

        console.log('-'.repeat(80));
        console.log(`TOTAL:    ${totalCompleted.toString().padStart(3)}/${results.length} (${totalPercent.padStart(5)}%) | ✅ ${totalCompleted} | ⏳ ${totalInProgress} | ⬜ ${totalPending}`);
        console.log('='.repeat(80));

        // Save detailed results to file
        const fs = require('fs');
        const detailedReport = results.map(r => ({
            phase: r.phase,
            pair: `${r.source}→${r.target}`,
            table: r.tableName,
            translated: r.translated,
            total: r.total,
            percent: r.percent,
            status: r.status
        }));

        fs.writeFileSync(
            'translation-progress-report.json',
            JSON.stringify({
                generated: new Date().toISOString(),
                summary: {
                    total: results.length,
                    completed: totalCompleted,
                    inProgress: totalInProgress,
                    pending: totalPending,
                    percentComplete: totalPercent
                },
                byPhase: Array.from({length: 7}, (_, i) => {
                    const phase = i + 1;
                    const phaseResults = results.filter(r => r.phase === phase);
                    const completed = phaseResults.filter(r => r.percent === 100).length;
                    return {
                        phase,
                        total: phaseResults.length,
                        completed,
                        percentComplete: ((completed / phaseResults.length) * 100).toFixed(1)
                    };
                }),
                pairs: detailedReport
            }, null, 2)
        );

        console.log('\n📄 Detailed report saved to: translation-progress-report.json\n');

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await db.end();
        process.exit(1);
    }
}

checkProgress();
