#!/usr/bin/env node
/**
 * Master Translation Queue Manager
 * Completes all remaining translation pairs in optimal order
 */

const { spawn } = require('child_process');
const path = require('path');

// Translation queue in priority order
const TRANSLATION_QUEUE = [
    // Priority 1: Almost complete (99%+)
    { source: 'french', target: 'german', priority: 1, expected: 9332 },
    { source: 'italian', target: 'german', priority: 1, expected: 10000 },
    { source: 'italian', target: 'russian', priority: 1, expected: 10000 },

    // Priority 2: Continue in-progress Portuguese
    { source: 'portuguese', target: 'spanish', priority: 2, expected: 10000 },

    // Priority 3: Chinese translations (85% complete)
    { source: 'chinese', target: 'english', priority: 3, expected: 10000 },
    { source: 'chinese', target: 'german', priority: 3, expected: 10000 },
    { source: 'chinese', target: 'russian', priority: 3, expected: 10000 },
    { source: 'chinese', target: 'spanish', priority: 3, expected: 10000 },

    // Priority 4: Other incomplete
    { source: 'italian', target: 'english', priority: 4, expected: 10000 },
    { source: 'english', target: 'arabic', priority: 4, expected: 9974 },

    // Priority 5: Spanish translations (empty, but important)
    { source: 'spanish', target: 'arabic', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'italian', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'polish', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'portuguese', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'romanian', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'serbian', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'swahili', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'turkish', priority: 5, expected: 9972 },
    { source: 'spanish', target: 'ukrainian', priority: 5, expected: 9972 },

    // Priority 6: English to Swahili
    { source: 'english', target: 'swahili', priority: 6, expected: 9974 }
];

function runTranslation(source, target) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'translate-pair-v2.js');
        const startTime = Date.now();

        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔄 Starting: ${source.toUpperCase()} → ${target.toUpperCase()}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        console.log('='.repeat(80));

        const child = spawn('node', [scriptPath, source, target], {
            stdio: 'inherit',
            shell: true
        });

        child.on('exit', (code) => {
            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

            if (code === 0) {
                console.log(`\n✅ Completed: ${source} → ${target} (${duration} minutes)\n`);
                resolve({ source, target, duration, success: true });
            } else {
                console.log(`\n❌ Failed: ${source} → ${target} (code ${code})\n`);
                resolve({ source, target, duration, success: false, code });
            }
        });

        child.on('error', (error) => {
            console.error(`\n❌ Error: ${source} → ${target}:`, error.message);
            resolve({ source, target, success: false, error: error.message });
        });
    });
}

async function runQueue() {
    console.log('\n🌍 MASTER TRANSLATION QUEUE');
    console.log('='.repeat(80));
    console.log(`📝 Total pairs in queue: ${TRANSLATION_QUEUE.length}`);
    console.log(`⏰ Start time: ${new Date().toLocaleString()}\n`);

    // Group by priority
    const byPriority = {};
    TRANSLATION_QUEUE.forEach(pair => {
        if (!byPriority[pair.priority]) byPriority[pair.priority] = [];
        byPriority[pair.priority].push(pair);
    });

    console.log('📊 Queue breakdown:');
    for (const [priority, pairs] of Object.entries(byPriority).sort()) {
        console.log(`   Priority ${priority}: ${pairs.length} pairs`);
    }

    console.log('\n' + '='.repeat(80));

    const results = [];
    const overallStart = Date.now();
    let completed = 0;
    let failed = 0;

    for (const pair of TRANSLATION_QUEUE) {
        const result = await runTranslation(pair.source, pair.target);
        results.push(result);

        if (result.success) {
            completed++;
        } else {
            failed++;
        }

        // Progress update
        const progress = ((results.length / TRANSLATION_QUEUE.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);

        console.log(`\n📊 Progress: ${results.length}/${TRANSLATION_QUEUE.length} (${progress}%)`);
        console.log(`⏱️  Elapsed: ${elapsed} minutes`);
        console.log(`✅ Completed: ${completed} | ❌ Failed: ${failed}\n`);
    }

    // Final summary
    const totalTime = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);

    console.log('\n\n' + '='.repeat(80));
    console.log('🎉 TRANSLATION QUEUE COMPLETED');
    console.log('='.repeat(80));
    console.log(`\n⏰ End time: ${new Date().toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime} minutes (${(totalTime / 60).toFixed(1)} hours)`);
    console.log(`\n✅ Successfully completed: ${completed}/${TRANSLATION_QUEUE.length}`);
    console.log(`❌ Failed: ${failed}/${TRANSLATION_QUEUE.length}`);

    if (failed > 0) {
        console.log(`\n❌ Failed pairs:`);
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.source} → ${r.target}`);
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

runQueue().catch(err => {
    console.error('❌ Queue manager error:', err);
    process.exit(1);
});
