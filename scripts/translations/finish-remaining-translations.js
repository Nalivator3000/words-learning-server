#!/usr/bin/env node
/**
 * Finish Remaining Translation Pairs
 * Completes the last 7 translation pairs
 */

const { spawn } = require('child_process');
const path = require('path');

// Remaining translation queue in priority order
const TRANSLATION_QUEUE = [
    // Priority 1: Nearly complete (1 word left!)
    { source: 'arabic', target: 'russian', priority: 1, remaining: 1 },

    // Priority 2: Incomplete (68% done)
    { source: 'spanish', target: 'polish', priority: 2, remaining: 3140 },

    // Priority 3: Empty Spanish pairs
    { source: 'spanish', target: 'romanian', priority: 3, expected: 9972 },
    { source: 'spanish', target: 'serbian', priority: 3, expected: 9972 },
    { source: 'spanish', target: 'swahili', priority: 3, expected: 9972 },
    { source: 'spanish', target: 'turkish', priority: 3, expected: 9972 },
    { source: 'spanish', target: 'ukrainian', priority: 3, expected: 9972 }
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
    console.log('\n🎯 FINISHING REMAINING TRANSLATION PAIRS');
    console.log('='.repeat(80));
    console.log(`📝 Total pairs to complete: ${TRANSLATION_QUEUE.length}`);
    console.log(`⏰ Start time: ${new Date().toLocaleString()}\n`);

    // Summary
    const totalWords = TRANSLATION_QUEUE.reduce((sum, pair) =>
        sum + (pair.remaining || pair.expected || 10000), 0
    );

    console.log('📊 Queue breakdown:');
    TRANSLATION_QUEUE.forEach((pair, i) => {
        const words = pair.remaining || pair.expected || 10000;
        console.log(`   ${i + 1}. ${pair.source} → ${pair.target}: ${words.toLocaleString()} words`);
    });
    console.log(`\n   Total words to translate: ${totalWords.toLocaleString()}`);

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
