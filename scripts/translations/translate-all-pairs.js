#!/usr/bin/env node
/**
 * Master script to translate all necessary language pairs
 * Runs translations sequentially to avoid overwhelming the API
 */

const { spawn } = require('child_process');
const path = require('path');

// Define all translation pairs we need
const TRANSLATION_PAIRS = [
    // French translations (for ru→fr, en→fr language pairs)
    { source: 'french', target: 'russian', priority: 1 },
    { source: 'french', target: 'english', priority: 1 },

    // German to other languages (for de→* pairs)
    { source: 'german', target: 'spanish', priority: 2 },
    { source: 'german', target: 'french', priority: 2 },
    { source: 'german', target: 'italian', priority: 3 },
    { source: 'german', target: 'polish', priority: 3 },
    { source: 'german', target: 'portuguese', priority: 3 },
    { source: 'german', target: 'romanian', priority: 3 },
    { source: 'german', target: 'serbian', priority: 3 },
    { source: 'german', target: 'turkish', priority: 3 },
    { source: 'german', target: 'ukrainian', priority: 3 },
    { source: 'german', target: 'arabic', priority: 4 },
    { source: 'german', target: 'swahili', priority: 4 },

    // English to other languages (for en→* pairs)
    { source: 'english', target: 'spanish', priority: 2 },
    { source: 'english', target: 'french', priority: 2 },
    { source: 'english', target: 'german', priority: 2 },
    { source: 'english', target: 'italian', priority: 3 },
    { source: 'english', target: 'polish', priority: 3 },
    { source: 'english', target: 'portuguese', priority: 3 },
    { source: 'english', target: 'romanian', priority: 3 },
    { source: 'english', target: 'serbian', priority: 3 },
    { source: 'english', target: 'turkish', priority: 3 },
    { source: 'english', target: 'ukrainian', priority: 3 },
    { source: 'english', target: 'arabic', priority: 4 },
    { source: 'english', target: 'swahili', priority: 4 },

    // Spanish to other languages (for es→* pairs)
    { source: 'spanish', target: 'english', priority: 2 },
    { source: 'spanish', target: 'french', priority: 2 },
    { source: 'spanish', target: 'german', priority: 2 },
];

// Sort by priority
TRANSLATION_PAIRS.sort((a, b) => a.priority - b.priority);

function runTranslation(source, target) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'translate-pair-v2.js');
        const child = spawn('node', [scriptPath, source, target], {
            stdio: 'inherit',
            shell: true
        });

        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Translation ${source}→${target} failed with code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

async function runAllTranslations() {
    console.log('🌍 MASTER TRANSLATION SCRIPT');
    console.log('='.repeat(70));
    console.log(`📝 Total translation pairs to process: ${TRANSLATION_PAIRS.length}\n`);

    const startTime = Date.now();
    let completed = 0;
    let failed = 0;

    for (const pair of TRANSLATION_PAIRS) {
        try {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`🔄 [${completed + 1}/${TRANSLATION_PAIRS.length}] Starting: ${pair.source} → ${pair.target}`);
            console.log('='.repeat(70) + '\n');

            await runTranslation(pair.source, pair.target);
            completed++;

        } catch (error) {
            failed++;
            console.error(`\n❌ Failed: ${pair.source} → ${pair.target}`);
            console.error(error.message);

            // Continue with next pair even if one fails
            console.log('\n⏭️  Continuing with next translation pair...\n');
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TRANSLATIONS COMPLETED');
    console.log('='.repeat(70));
    console.log(`✅ Successfully completed: ${completed} pairs`);
    console.log(`❌ Failed: ${failed} pairs`);
    console.log(`⏱️  Total time: ${totalTime} minutes`);
    console.log('='.repeat(70) + '\n');
}

runAllTranslations().catch(err => {
    console.error('❌ Master script failed:', err);
    process.exit(1);
});
