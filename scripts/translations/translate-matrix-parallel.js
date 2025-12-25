#!/usr/bin/env node
/**
 * Parallel Translation Matrix Builder
 * Runs 3 translation pairs in parallel, then moves to next batch
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env from project root (two levels up from this script)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// All 215 remaining translation pairs organized by phase
const TRANSLATION_MATRIX = [
    // Phase 1: Complete Big 3 (12 pairs) - HIGHEST PRIORITY
    { phase: 1, source: 'de', target: 'ja', priority: 1 },
    { phase: 1, source: 'de', target: 'ko', priority: 1 },
    { phase: 1, source: 'de', target: 'hi', priority: 1 },
    { phase: 1, source: 'de', target: 'tr', priority: 1 },
    { phase: 1, source: 'en', target: 'ja', priority: 1 },
    { phase: 1, source: 'en', target: 'ko', priority: 1 },
    { phase: 1, source: 'en', target: 'hi', priority: 1 },
    { phase: 1, source: 'en', target: 'tr', priority: 1 },
    { phase: 1, source: 'es', target: 'ja', priority: 1 },
    { phase: 1, source: 'es', target: 'ko', priority: 1 },
    { phase: 1, source: 'es', target: 'hi', priority: 1 },
    { phase: 1, source: 'es', target: 'tr', priority: 1 },

    // Phase 2: European Languages (39 pairs)
    // French → All missing
    { phase: 2, source: 'fr', target: 'ar', priority: 2 },
    { phase: 2, source: 'fr', target: 'it', priority: 2 },
    { phase: 2, source: 'fr', target: 'pt', priority: 2 },
    { phase: 2, source: 'fr', target: 'pl', priority: 2 },
    { phase: 2, source: 'fr', target: 'ro', priority: 2 },
    { phase: 2, source: 'fr', target: 'sr', priority: 2 },
    { phase: 2, source: 'fr', target: 'uk', priority: 2 },
    { phase: 2, source: 'fr', target: 'tr', priority: 2 },
    { phase: 2, source: 'fr', target: 'sw', priority: 2 },
    { phase: 2, source: 'fr', target: 'zh', priority: 2 },
    { phase: 2, source: 'fr', target: 'ja', priority: 2 },
    { phase: 2, source: 'fr', target: 'ko', priority: 2 },
    { phase: 2, source: 'fr', target: 'hi', priority: 2 },

    // Italian → All missing
    { phase: 2, source: 'it', target: 'ar', priority: 2 },
    { phase: 2, source: 'it', target: 'fr', priority: 2 },
    { phase: 2, source: 'it', target: 'pt', priority: 2 },
    { phase: 2, source: 'it', target: 'pl', priority: 2 },
    { phase: 2, source: 'it', target: 'ro', priority: 2 },
    { phase: 2, source: 'it', target: 'sr', priority: 2 },
    { phase: 2, source: 'it', target: 'uk', priority: 2 },
    { phase: 2, source: 'it', target: 'tr', priority: 2 },
    { phase: 2, source: 'it', target: 'sw', priority: 2 },
    { phase: 2, source: 'it', target: 'zh', priority: 2 },
    { phase: 2, source: 'it', target: 'ja', priority: 2 },
    { phase: 2, source: 'it', target: 'ko', priority: 2 },
    { phase: 2, source: 'it', target: 'hi', priority: 2 },

    // Portuguese → All missing
    { phase: 2, source: 'pt', target: 'ar', priority: 2 },
    { phase: 2, source: 'pt', target: 'fr', priority: 2 },
    { phase: 2, source: 'pt', target: 'it', priority: 2 },
    { phase: 2, source: 'pt', target: 'pl', priority: 2 },
    { phase: 2, source: 'pt', target: 'ro', priority: 2 },
    { phase: 2, source: 'pt', target: 'sr', priority: 2 },
    { phase: 2, source: 'pt', target: 'uk', priority: 2 },
    { phase: 2, source: 'pt', target: 'tr', priority: 2 },
    { phase: 2, source: 'pt', target: 'sw', priority: 2 },
    { phase: 2, source: 'pt', target: 'zh', priority: 2 },
    { phase: 2, source: 'pt', target: 'ja', priority: 2 },
    { phase: 2, source: 'pt', target: 'ko', priority: 2 },
    { phase: 2, source: 'pt', target: 'hi', priority: 2 },

    // Phase 3: Arabic & Chinese (28 pairs)
    // Arabic → All missing
    { phase: 3, source: 'ar', target: 'de', priority: 3 },
    { phase: 3, source: 'ar', target: 'es', priority: 3 },
    { phase: 3, source: 'ar', target: 'fr', priority: 3 },
    { phase: 3, source: 'ar', target: 'it', priority: 3 },
    { phase: 3, source: 'ar', target: 'pt', priority: 3 },
    { phase: 3, source: 'ar', target: 'pl', priority: 3 },
    { phase: 3, source: 'ar', target: 'ro', priority: 3 },
    { phase: 3, source: 'ar', target: 'sr', priority: 3 },
    { phase: 3, source: 'ar', target: 'uk', priority: 3 },
    { phase: 3, source: 'ar', target: 'tr', priority: 3 },
    { phase: 3, source: 'ar', target: 'sw', priority: 3 },
    { phase: 3, source: 'ar', target: 'zh', priority: 3 },
    { phase: 3, source: 'ar', target: 'ja', priority: 3 },
    { phase: 3, source: 'ar', target: 'ko', priority: 3 },
    { phase: 3, source: 'ar', target: 'hi', priority: 3 },

    // Chinese → All missing
    { phase: 3, source: 'zh', target: 'ar', priority: 3 },
    { phase: 3, source: 'zh', target: 'fr', priority: 3 },
    { phase: 3, source: 'zh', target: 'it', priority: 3 },
    { phase: 3, source: 'zh', target: 'pt', priority: 3 },
    { phase: 3, source: 'zh', target: 'pl', priority: 3 },
    { phase: 3, source: 'zh', target: 'ro', priority: 3 },
    { phase: 3, source: 'zh', target: 'sr', priority: 3 },
    { phase: 3, source: 'zh', target: 'uk', priority: 3 },
    { phase: 3, source: 'zh', target: 'tr', priority: 3 },
    { phase: 3, source: 'zh', target: 'sw', priority: 3 },
    { phase: 3, source: 'zh', target: 'ja', priority: 3 },
    { phase: 3, source: 'zh', target: 'ko', priority: 3 },
    { phase: 3, source: 'zh', target: 'hi', priority: 3 },

    // Phase 4: Russian (17 pairs)
    { phase: 4, source: 'ru', target: 'de', priority: 4 },
    { phase: 4, source: 'ru', target: 'en', priority: 4 },
    { phase: 4, source: 'ru', target: 'es', priority: 4 },
    { phase: 4, source: 'ru', target: 'fr', priority: 4 },
    { phase: 4, source: 'ru', target: 'it', priority: 4 },
    { phase: 4, source: 'ru', target: 'pt', priority: 4 },
    { phase: 4, source: 'ru', target: 'ar', priority: 4 },
    { phase: 4, source: 'ru', target: 'zh', priority: 4 },
    { phase: 4, source: 'ru', target: 'ja', priority: 4 },
    { phase: 4, source: 'ru', target: 'ko', priority: 4 },
    { phase: 4, source: 'ru', target: 'pl', priority: 4 },
    { phase: 4, source: 'ru', target: 'ro', priority: 4 },
    { phase: 4, source: 'ru', target: 'sr', priority: 4 },
    { phase: 4, source: 'ru', target: 'uk', priority: 4 },
    { phase: 4, source: 'ru', target: 'tr', priority: 4 },
    { phase: 4, source: 'ru', target: 'sw', priority: 4 },
    { phase: 4, source: 'ru', target: 'hi', priority: 4 },

    // Phase 5: Eastern European (51 pairs)
    // Polish → All
    { phase: 5, source: 'pl', target: 'de', priority: 5 },
    { phase: 5, source: 'pl', target: 'en', priority: 5 },
    { phase: 5, source: 'pl', target: 'es', priority: 5 },
    { phase: 5, source: 'pl', target: 'fr', priority: 5 },
    { phase: 5, source: 'pl', target: 'it', priority: 5 },
    { phase: 5, source: 'pl', target: 'pt', priority: 5 },
    { phase: 5, source: 'pl', target: 'ar', priority: 5 },
    { phase: 5, source: 'pl', target: 'zh', priority: 5 },
    { phase: 5, source: 'pl', target: 'ja', priority: 5 },
    { phase: 5, source: 'pl', target: 'ko', priority: 5 },
    { phase: 5, source: 'pl', target: 'ru', priority: 5 },
    { phase: 5, source: 'pl', target: 'ro', priority: 5 },
    { phase: 5, source: 'pl', target: 'sr', priority: 5 },
    { phase: 5, source: 'pl', target: 'uk', priority: 5 },
    { phase: 5, source: 'pl', target: 'tr', priority: 5 },
    { phase: 5, source: 'pl', target: 'sw', priority: 5 },
    { phase: 5, source: 'pl', target: 'hi', priority: 5 },

    // Romanian → All
    { phase: 5, source: 'ro', target: 'de', priority: 5 },
    { phase: 5, source: 'ro', target: 'en', priority: 5 },
    { phase: 5, source: 'ro', target: 'es', priority: 5 },
    { phase: 5, source: 'ro', target: 'fr', priority: 5 },
    { phase: 5, source: 'ro', target: 'it', priority: 5 },
    { phase: 5, source: 'ro', target: 'pt', priority: 5 },
    { phase: 5, source: 'ro', target: 'ar', priority: 5 },
    { phase: 5, source: 'ro', target: 'zh', priority: 5 },
    { phase: 5, source: 'ro', target: 'ja', priority: 5 },
    { phase: 5, source: 'ro', target: 'ko', priority: 5 },
    { phase: 5, source: 'ro', target: 'ru', priority: 5 },
    { phase: 5, source: 'ro', target: 'pl', priority: 5 },
    { phase: 5, source: 'ro', target: 'sr', priority: 5 },
    { phase: 5, source: 'ro', target: 'uk', priority: 5 },
    { phase: 5, source: 'ro', target: 'tr', priority: 5 },
    { phase: 5, source: 'ro', target: 'sw', priority: 5 },
    { phase: 5, source: 'ro', target: 'hi', priority: 5 },

    // Ukrainian → All
    { phase: 5, source: 'uk', target: 'de', priority: 5 },
    { phase: 5, source: 'uk', target: 'en', priority: 5 },
    { phase: 5, source: 'uk', target: 'es', priority: 5 },
    { phase: 5, source: 'uk', target: 'fr', priority: 5 },
    { phase: 5, source: 'uk', target: 'it', priority: 5 },
    { phase: 5, source: 'uk', target: 'pt', priority: 5 },
    { phase: 5, source: 'uk', target: 'ar', priority: 5 },
    { phase: 5, source: 'uk', target: 'zh', priority: 5 },
    { phase: 5, source: 'uk', target: 'ja', priority: 5 },
    { phase: 5, source: 'uk', target: 'ko', priority: 5 },
    { phase: 5, source: 'uk', target: 'ru', priority: 5 },
    { phase: 5, source: 'uk', target: 'pl', priority: 5 },
    { phase: 5, source: 'uk', target: 'ro', priority: 5 },
    { phase: 5, source: 'uk', target: 'sr', priority: 5 },
    { phase: 5, source: 'uk', target: 'tr', priority: 5 },
    { phase: 5, source: 'uk', target: 'sw', priority: 5 },
    { phase: 5, source: 'uk', target: 'hi', priority: 5 },

    // Phase 6: Asian Languages (51 pairs)
    // Japanese → All
    { phase: 6, source: 'ja', target: 'de', priority: 6 },
    { phase: 6, source: 'ja', target: 'en', priority: 6 },
    { phase: 6, source: 'ja', target: 'es', priority: 6 },
    { phase: 6, source: 'ja', target: 'fr', priority: 6 },
    { phase: 6, source: 'ja', target: 'it', priority: 6 },
    { phase: 6, source: 'ja', target: 'pt', priority: 6 },
    { phase: 6, source: 'ja', target: 'ar', priority: 6 },
    { phase: 6, source: 'ja', target: 'zh', priority: 6 },
    { phase: 6, source: 'ja', target: 'ko', priority: 6 },
    { phase: 6, source: 'ja', target: 'ru', priority: 6 },
    { phase: 6, source: 'ja', target: 'pl', priority: 6 },
    { phase: 6, source: 'ja', target: 'ro', priority: 6 },
    { phase: 6, source: 'ja', target: 'sr', priority: 6 },
    { phase: 6, source: 'ja', target: 'uk', priority: 6 },
    { phase: 6, source: 'ja', target: 'tr', priority: 6 },
    { phase: 6, source: 'ja', target: 'sw', priority: 6 },
    { phase: 6, source: 'ja', target: 'hi', priority: 6 },

    // Korean → All
    { phase: 6, source: 'ko', target: 'de', priority: 6 },
    { phase: 6, source: 'ko', target: 'en', priority: 6 },
    { phase: 6, source: 'ko', target: 'es', priority: 6 },
    { phase: 6, source: 'ko', target: 'fr', priority: 6 },
    { phase: 6, source: 'ko', target: 'it', priority: 6 },
    { phase: 6, source: 'ko', target: 'pt', priority: 6 },
    { phase: 6, source: 'ko', target: 'ar', priority: 6 },
    { phase: 6, source: 'ko', target: 'zh', priority: 6 },
    { phase: 6, source: 'ko', target: 'ja', priority: 6 },
    { phase: 6, source: 'ko', target: 'ru', priority: 6 },
    { phase: 6, source: 'ko', target: 'pl', priority: 6 },
    { phase: 6, source: 'ko', target: 'ro', priority: 6 },
    { phase: 6, source: 'ko', target: 'sr', priority: 6 },
    { phase: 6, source: 'ko', target: 'uk', priority: 6 },
    { phase: 6, source: 'ko', target: 'tr', priority: 6 },
    { phase: 6, source: 'ko', target: 'sw', priority: 6 },
    { phase: 6, source: 'ko', target: 'hi', priority: 6 },

    // Hindi → All
    { phase: 6, source: 'hi', target: 'de', priority: 6 },
    { phase: 6, source: 'hi', target: 'en', priority: 6 },
    { phase: 6, source: 'hi', target: 'es', priority: 6 },
    { phase: 6, source: 'hi', target: 'fr', priority: 6 },
    { phase: 6, source: 'hi', target: 'it', priority: 6 },
    { phase: 6, source: 'hi', target: 'pt', priority: 6 },
    { phase: 6, source: 'hi', target: 'ar', priority: 6 },
    { phase: 6, source: 'hi', target: 'zh', priority: 6 },
    { phase: 6, source: 'hi', target: 'ja', priority: 6 },
    { phase: 6, source: 'hi', target: 'ko', priority: 6 },
    { phase: 6, source: 'hi', target: 'ru', priority: 6 },
    { phase: 6, source: 'hi', target: 'pl', priority: 6 },
    { phase: 6, source: 'hi', target: 'ro', priority: 6 },
    { phase: 6, source: 'hi', target: 'sr', priority: 6 },
    { phase: 6, source: 'hi', target: 'uk', priority: 6 },
    { phase: 6, source: 'hi', target: 'tr', priority: 6 },
    { phase: 6, source: 'hi', target: 'sw', priority: 6 },

    // Phase 7: Turkish (17 pairs)
    { phase: 7, source: 'tr', target: 'de', priority: 7 },
    { phase: 7, source: 'tr', target: 'en', priority: 7 },
    { phase: 7, source: 'tr', target: 'es', priority: 7 },
    { phase: 7, source: 'tr', target: 'fr', priority: 7 },
    { phase: 7, source: 'tr', target: 'it', priority: 7 },
    { phase: 7, source: 'tr', target: 'pt', priority: 7 },
    { phase: 7, source: 'tr', target: 'ar', priority: 7 },
    { phase: 7, source: 'tr', target: 'zh', priority: 7 },
    { phase: 7, source: 'tr', target: 'ja', priority: 7 },
    { phase: 7, source: 'tr', target: 'ko', priority: 7 },
    { phase: 7, source: 'tr', target: 'ru', priority: 7 },
    { phase: 7, source: 'tr', target: 'pl', priority: 7 },
    { phase: 7, source: 'tr', target: 'ro', priority: 7 },
    { phase: 7, source: 'tr', target: 'sr', priority: 7 },
    { phase: 7, source: 'tr', target: 'uk', priority: 7 },
    { phase: 7, source: 'tr', target: 'sw', priority: 7 },
    { phase: 7, source: 'tr', target: 'hi', priority: 7 }
];

const PARALLEL_LIMIT = 3; // Run 3 pairs in parallel
const PROGRESS_FILE = path.join(__dirname, '.translation-progress.json');

function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('⚠️  Could not load progress file:', err.message);
    }
    return { completed: [], failed: [] };
}

function saveProgress(progress) {
    try {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch (err) {
        console.error('⚠️  Could not save progress:', err.message);
    }
}

// Convert language code to full name
const CODE_TO_NAME = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'it': 'italian', 'pl': 'polish', 'pt': 'portuguese',
    'ro': 'romanian', 'sr': 'serbian', 'tr': 'turkish', 'uk': 'ukrainian',
    'ar': 'arabic', 'sw': 'swahili', 'zh': 'chinese', 'hi': 'hindi',
    'ja': 'japanese', 'ko': 'korean'
};

function runTranslation(source, target) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'translate-pair-v2.js');
        const startTime = Date.now();

        // Convert codes to full names
        const sourceName = CODE_TO_NAME[source] || source;
        const targetName = CODE_TO_NAME[target] || target;

        console.log(`🔄 Starting: ${source.toUpperCase()} → ${target.toUpperCase()}`);

        // Pass environment variables to child process
        const env = { ...process.env };

        const child = spawn('node', [scriptPath, sourceName, targetName], {
            stdio: 'inherit',
            shell: true,
            env: env
        });

        child.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 60000).toFixed(1);

            if (code === 0) {
                console.log(`✅ Completed: ${source.toUpperCase()} → ${target.toUpperCase()} (${duration}m)\n`);
                resolve({ source, target, duration, success: true });
            } else {
                console.log(`❌ Failed: ${source.toUpperCase()} → ${target.toUpperCase()} (code ${code})\n`);
                reject({ source, target, duration, code, success: false });
            }
        });

        child.on('error', (err) => {
            console.error(`❌ Error: ${source.toUpperCase()} → ${target.toUpperCase()}:`, err.message);
            reject({ source, target, error: err.message, success: false });
        });
    });
}

async function runBatch(pairs) {
    const promises = pairs.map(pair => runTranslation(pair.source, pair.target));
    return Promise.allSettled(promises);
}

async function main() {
    console.log('🎯 PARALLEL TRANSLATION MATRIX BUILDER');
    console.log('='.repeat(80));
    console.log(`⏰ Start time: ${new Date().toLocaleString()}`);
    console.log(`📊 Total pairs to translate: ${TRANSLATION_MATRIX.length}`);
    console.log(`⚡ Parallel workers: ${PARALLEL_LIMIT}`);
    console.log('='.repeat(80));
    console.log('');

    const progress = loadProgress();
    const completedPairs = new Set(progress.completed.map(p => `${p.source}→${p.target}`));

    // Filter out already completed pairs
    const remainingPairs = TRANSLATION_MATRIX.filter(pair =>
        !completedPairs.has(`${pair.source}→${pair.target}`)
    );

    console.log(`✅ Already completed: ${progress.completed.length} pairs`);
    console.log(`⏳ Remaining: ${remainingPairs.length} pairs`);
    console.log('');

    if (remainingPairs.length === 0) {
        console.log('🎉 ALL TRANSLATIONS COMPLETE!');
        return;
    }

    const totalBatches = Math.ceil(remainingPairs.length / PARALLEL_LIMIT);
    let currentBatch = 0;
    let totalCompleted = progress.completed.length;
    let totalFailed = progress.failed.length;

    for (let i = 0; i < remainingPairs.length; i += PARALLEL_LIMIT) {
        currentBatch++;
        const batch = remainingPairs.slice(i, i + PARALLEL_LIMIT);

        console.log('='.repeat(80));
        console.log(`📦 BATCH ${currentBatch}/${totalBatches}`);
        console.log(`Pairs in this batch: ${batch.map(p => `${p.source}→${p.target}`).join(', ')}`);
        console.log('='.repeat(80));
        console.log('');

        const results = await runBatch(batch);

        // Update progress
        results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                progress.completed.push(result.value);
                totalCompleted++;
            } else {
                progress.failed.push({ ...batch[idx], error: result.reason });
                totalFailed++;
            }
        });

        saveProgress(progress);

        console.log('');
        console.log('📊 PROGRESS UPDATE');
        console.log('-'.repeat(80));
        console.log(`Batch ${currentBatch}/${totalBatches} complete`);
        console.log(`✅ Total completed: ${totalCompleted}/${TRANSLATION_MATRIX.length}`);
        console.log(`❌ Total failed: ${totalFailed}`);
        console.log(`📈 Overall progress: ${((totalCompleted / TRANSLATION_MATRIX.length) * 100).toFixed(1)}%`);
        console.log('');

        // Small delay between batches to avoid overwhelming the API
        if (i + PARALLEL_LIMIT < remainingPairs.length) {
            console.log('⏸️  Waiting 10 seconds before next batch...\n');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    console.log('='.repeat(80));
    console.log('🎉 TRANSLATION MATRIX BUILDER COMPLETE');
    console.log('='.repeat(80));
    console.log(`⏰ End time: ${new Date().toLocaleString()}`);
    console.log(`✅ Successfully completed: ${totalCompleted}/${TRANSLATION_MATRIX.length} pairs`);
    console.log(`❌ Failed: ${totalFailed} pairs`);

    if (totalFailed > 0) {
        console.log('');
        console.log('❌ Failed pairs:');
        progress.failed.forEach(p => console.log(`   - ${p.source}→${p.target}`));
    }

    console.log('='.repeat(80));
}

main().catch(console.error);
