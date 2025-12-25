#!/usr/bin/env node
/**
 * Retry Failed Translation Pairs
 * Completes only incomplete and empty translations
 */

const { spawn } = require('child_process');
const path = require('path');

// Only incomplete and empty pairs that need work
const RETRY_QUEUE = [
    // Priority 1: Almost complete (>90%)
    { source: 'french', target: 'german', priority: 1, remaining: 1 },
    { source: 'arabic', target: 'russian', priority: 1, remaining: 8 },
    { source: 'portuguese', target: 'spanish', priority: 1, remaining: 3 },
    { source: 'chinese', target: 'spanish', priority: 1, remaining: 723 },

    // Priority 2: Partially complete (50-90%)
    { source: 'chinese', target: 'english', priority: 2, remaining: 1466 },
    { source: 'spanish', target: 'italian', priority: 2, remaining: 1784 },
    { source: 'arabic', target: 'german', priority: 2, remaining: 4755 },

    // Priority 3: Nearly empty (<10%)
    { source: 'spanish', target: 'portuguese', priority: 3, remaining: 9878 },

    // Priority 4: Empty pairs
    { source: 'spanish', target: 'polish', priority: 4, remaining: 9972 },
    { source: 'spanish', target: 'romanian', priority: 4, remaining: 9972 },
    { source: 'spanish', target: 'serbian', priority: 4, remaining: 9972 },
    { source: 'spanish', target: 'swahili', priority: 4, remaining: 9972 },
    { source: 'spanish', target: 'turkish', priority: 4, remaining: 9972 },
    { source: 'spanish', target: 'ukrainian', priority: 4, remaining: 9972 }
];

function runTranslation(source, target) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'translate-pair-v2.js');
        const startTime = Date.now();

        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔄 Retrying: ${source.toUpperCase()} → ${target.toUpperCase()}`);
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

async function retryFailedPairs() {
    console.log('\n🔄 RETRY FAILED TRANSLATION PAIRS');
    console.log('='.repeat(80));
    console.log(`📝 Pairs to retry: ${RETRY_QUEUE.length}`);
    console.log(`⏰ Start time: ${new Date().toLocaleString()}\n`);

    // Group by priority
    const byPriority = {};
    RETRY_QUEUE.forEach(pair => {
        if (!byPriority[pair.priority]) byPriority[pair.priority] = [];
        byPriority[pair.priority].push(pair);
    });

    console.log('📊 Retry queue breakdown:');
    for (const [priority, pairs] of Object.entries(byPriority).sort()) {
        const totalWords = pairs.reduce((sum, p) => sum + p.remaining, 0);
        console.log(`   Priority ${priority}: ${pairs.length} pairs (~${totalWords.toLocaleString()} words)`);
    }

    console.log('\n' + '='.repeat(80));

    const results = [];
    const overallStart = Date.now();
    let completed = 0;
    let failed = 0;

    for (const pair of RETRY_QUEUE) {
        const result = await runTranslation(pair.source, pair.target);
        results.push(result);

        if (result.success) {
            completed++;
        } else {
            failed++;
        }

        // Progress update
        const progress = ((results.length / RETRY_QUEUE.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);

        console.log(`\n📊 Progress: ${results.length}/${RETRY_QUEUE.length} (${progress}%)`);
        console.log(`⏱️  Elapsed: ${elapsed} minutes`);
        console.log(`✅ Completed: ${completed} | ❌ Failed: ${failed}\n`);
    }

    // Final summary
    const totalTime = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);

    console.log('\n\n' + '='.repeat(80));
    console.log('🎉 RETRY QUEUE COMPLETED');
    console.log('='.repeat(80));
    console.log(`\n⏰ End time: ${new Date().toLocaleString()}`);
    console.log(`⏱️  Total time: ${totalTime} minutes (${(totalTime / 60).toFixed(1)} hours)`);
    console.log(`\n✅ Successfully completed: ${completed}/${RETRY_QUEUE.length}`);
    console.log(`❌ Failed: ${failed}/${RETRY_QUEUE.length}`);

    if (failed > 0) {
        console.log(`\n❌ Failed pairs:`);
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.source} → ${r.target}`);
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

retryFailedPairs().catch(err => {
    console.error('❌ Retry manager error:', err);
    process.exit(1);
});
