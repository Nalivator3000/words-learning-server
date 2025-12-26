#!/usr/bin/env node
/**
 * Translation Progress Checker with Progress Bar
 * Checks status of all planned language pairs
 * Usage: node scripts/utils/check-translation-status.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 20000
});

// All 272 planned language pairs (16 source languages × 17 target languages = 272 pairs)
const PLANNED_PAIRS = {
    // German as source (16 pairs) - baseline
    'german': ['english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // English as source (16 pairs)
    'english': ['german', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Spanish as source (16 pairs)
    'spanish': ['german', 'english', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // French as source (16 pairs)
    'french': ['german', 'english', 'spanish', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Russian as source (16 pairs)
    'russian': ['german', 'english', 'spanish', 'french', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Italian as source (16 pairs)
    'italian': ['german', 'english', 'spanish', 'french', 'russian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Polish as source (16 pairs)
    'polish': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Portuguese as source (16 pairs)
    'portuguese': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Romanian as source (16 pairs)
    'romanian': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Serbian as source (16 pairs)
    'serbian': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Turkish as source (16 pairs)
    'turkish': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Ukrainian as source (16 pairs)
    'ukrainian': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Arabic as source (16 pairs)
    'arabic': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'],

    // Swahili as source (16 pairs)
    'swahili': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'chinese', 'hindi', 'japanese', 'korean'],

    // Chinese as source (16 pairs)
    'chinese': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'hindi', 'japanese', 'korean'],

    // Hindi as source (16 pairs)
    'hindi': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'japanese', 'korean'],

    // Japanese as source (16 pairs)
    'japanese': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'korean'],

    // Korean as source (16 pairs)
    'korean': ['german', 'english', 'spanish', 'french', 'russian', 'italian', 'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian', 'arabic', 'swahili', 'chinese', 'hindi', 'japanese']
};

const LANG_CODES = {
    'german': 'de', 'english': 'en', 'spanish': 'es', 'french': 'fr',
    'russian': 'ru', 'italian': 'it', 'polish': 'pl', 'portuguese': 'pt',
    'romanian': 'ro', 'serbian': 'sr', 'turkish': 'tr', 'ukrainian': 'uk',
    'arabic': 'ar', 'swahili': 'sw', 'chinese': 'zh', 'hindi': 'hi',
    'japanese': 'ja', 'korean': 'ko'
};

const FLAGS = {
    'de': '🇩🇪', 'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷',
    'ru': '🇷🇺', 'it': '🇮🇹', 'pl': '🇵🇱', 'pt': '🇵🇹',
    'ro': '🇷🇴', 'sr': '🇷🇸', 'tr': '🇹🇷', 'uk': '🇺🇦',
    'ar': '🇸🇦', 'sw': '🇰🇪', 'zh': '🇨🇳', 'hi': '🇮🇳',
    'ja': '🇯🇵', 'ko': '🇰🇷'
};

function getTranslationTableName(sourceLang, targetLang) {
    if (sourceLang === 'german') {
        return `target_translations_${targetLang}`;
    } else {
        return `target_translations_${targetLang}_from_${LANG_CODES[sourceLang]}`;
    }
}

function drawProgressBar(current, total, width = 50) {
    const percentage = (current / total) * 100;
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${current}/${total} (${percentage.toFixed(1)}%)`;
}

async function checkTranslationStatus() {
    try {
        console.log('\n' + '═'.repeat(80));
        console.log('📊 TRANSLATION STATUS CHECKER');
        console.log('═'.repeat(80));
        console.log('⏰ Time:', new Date().toLocaleString());
        console.log('═'.repeat(80));

        // Build list of all expected pairs (exclude source = target)
        const allPairs = [];
        for (const [source, targets] of Object.entries(PLANNED_PAIRS)) {
            for (const target of targets) {
                if (source !== target) {
                    allPairs.push({ source, target });
                }
            }
        }

        console.log(`\n📋 Total planned pairs: ${allPairs.length}`);

        // Check each pair
        const completed = [];
        const inProgress = [];
        const notStarted = [];

        for (const pair of allPairs) {
            const tableName = getTranslationTableName(pair.source, pair.target);

            try {
                // Check if table exists
                const tableCheck = await db.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public'
                        AND table_name = $1
                    )
                `, [tableName]);

                if (!tableCheck.rows[0].exists) {
                    notStarted.push(pair);
                    continue;
                }

                // Get word count
                const countResult = await db.query(`SELECT COUNT(*) FROM "${tableName}"`);
                const count = parseInt(countResult.rows[0].count);

                if (count >= 8000) {
                    completed.push({ ...pair, count });
                } else if (count > 0) {
                    inProgress.push({ ...pair, count });
                } else {
                    notStarted.push(pair);
                }
            } catch (err) {
                // Table doesn't exist or error
                notStarted.push(pair);
            }
        }

        // Display results
        console.log('\n' + '─'.repeat(80));
        console.log('📈 OVERALL PROGRESS');
        console.log('─'.repeat(80));
        console.log(drawProgressBar(completed.length, allPairs.length, 60));
        console.log('─'.repeat(80));

        console.log(`\n✅ COMPLETED: ${completed.length} pairs`);
        if (completed.length > 0) {
            // Group by source language
            const bySource = {};
            completed.forEach(p => {
                if (!bySource[p.source]) bySource[p.source] = [];
                bySource[p.source].push(p.target);
            });

            for (const [source, targets] of Object.entries(bySource)) {
                const sourceCode = LANG_CODES[source];
                const sourceFlag = FLAGS[sourceCode];
                const targetList = targets.map(t => FLAGS[LANG_CODES[t]]).join(' ');
                console.log(`   ${sourceFlag} ${source}: ${targets.length} pairs → ${targetList}`);
            }
        }

        console.log(`\n🔄 IN PROGRESS: ${inProgress.length} pairs`);
        if (inProgress.length > 0) {
            inProgress.forEach(p => {
                const sourceCode = LANG_CODES[p.source];
                const targetCode = LANG_CODES[p.target];
                const sourceFlag = FLAGS[sourceCode];
                const targetFlag = FLAGS[targetCode];
                const percent = ((p.count / 8076) * 100).toFixed(1);
                console.log(`   ${sourceFlag}→${targetFlag} ${p.source}→${p.target}: ${p.count.toLocaleString()} words (${percent}%)`);
            });
        }

        console.log(`\n⏳ NOT STARTED: ${notStarted.length} pairs`);
        if (notStarted.length > 0 && notStarted.length <= 20) {
            // Group by source language
            const bySource = {};
            notStarted.forEach(p => {
                if (!bySource[p.source]) bySource[p.source] = [];
                bySource[p.source].push(p.target);
            });

            for (const [source, targets] of Object.entries(bySource)) {
                const sourceCode = LANG_CODES[source];
                const sourceFlag = FLAGS[sourceCode];
                const targetList = targets.map(t => FLAGS[LANG_CODES[t]]).join(' ');
                console.log(`   ${sourceFlag} ${source}: ${targets.length} pairs → ${targetList}`);
            }
        } else if (notStarted.length > 20) {
            console.log(`   (Too many to display individually - ${notStarted.length} pairs remaining)`);
        }

        // Time estimation
        const remaining = allPairs.length - completed.length;
        if (remaining > 0) {
            const batchesNeeded = Math.ceil(remaining / 3);
            const hoursNeeded = batchesNeeded * 3; // 3 hours between batches
            const daysNeeded = (hoursNeeded / 24).toFixed(1);

            console.log('\n' + '─'.repeat(80));
            console.log('⏱️  TIME ESTIMATION');
            console.log('─'.repeat(80));
            console.log(`   Remaining pairs: ${remaining}`);
            console.log(`   Batches needed: ${batchesNeeded} (3 pairs per batch)`);
            console.log(`   Estimated time: ~${daysNeeded} days (at 3-hour intervals)`);
            console.log('─'.repeat(80));
        }

        console.log('\n' + '═'.repeat(80));
        console.log('📊 SUMMARY');
        console.log('═'.repeat(80));
        console.log(`   ✅ Completed:   ${completed.length.toString().padStart(3)} pairs`);
        console.log(`   🔄 In Progress: ${inProgress.length.toString().padStart(3)} pairs`);
        console.log(`   ⏳ Not Started: ${notStarted.length.toString().padStart(3)} pairs`);
        console.log(`   📋 Total:       ${allPairs.length.toString().padStart(3)} pairs`);
        console.log('═'.repeat(80));
        console.log('');

        await db.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error(err.stack);
        await db.end();
        process.exit(1);
    }
}

checkTranslationStatus();
