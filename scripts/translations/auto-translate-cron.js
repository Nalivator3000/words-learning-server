#!/usr/bin/env node
/**
 * Auto Translation Cron Job
 * Runs translation matrix builder every N hours
 * Usage: node auto-translate-cron.js [interval_hours]
 */

const { spawn } = require('child_process');
const path = require('path');

const INTERVAL_HOURS = parseInt(process.argv[2]) || 6; // Default: every 6 hours
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

console.log('🤖 AUTO TRANSLATION CRON JOB STARTED');
console.log('='.repeat(80));
console.log(`⏰ Start time: ${new Date().toLocaleString()}`);
console.log(`⏱️  Run interval: Every ${INTERVAL_HOURS} hours`);
console.log(`🔁 Mode: Continuous (will run indefinitely)`);
console.log('='.repeat(80));
console.log('');

let runCount = 0;

function runTranslationBatch() {
    return new Promise((resolve, reject) => {
        runCount++;

        console.log('\n' + '='.repeat(80));
        console.log(`🚀 RUN #${runCount}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        console.log('='.repeat(80));
        console.log('');

        const scriptPath = path.join(__dirname, 'translate-matrix-parallel.js');
        const child = spawn('node', [scriptPath], {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Translation batch completed successfully');
                resolve();
            } else {
                console.error(`\n❌ Translation batch failed with code ${code}`);
                reject(new Error(`Exit code ${code}`));
            }
        });

        child.on('error', (err) => {
            console.error('\n❌ Translation batch error:', err);
            reject(err);
        });
    });
}

async function cronLoop() {
    while (true) {
        try {
            await runTranslationBatch();

            // Calculate next run time
            const nextRun = new Date(Date.now() + INTERVAL_MS);

            console.log('');
            console.log('='.repeat(80));
            console.log(`⏸️  WAITING UNTIL NEXT RUN`);
            console.log(`Next run scheduled at: ${nextRun.toLocaleString()}`);
            console.log(`Sleeping for ${INTERVAL_HOURS} hours...`);
            console.log('='.repeat(80));

            await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));

        } catch (err) {
            console.error('\n⚠️  Error in cron loop:', err.message);
            console.log('Waiting 30 minutes before retry...');
            await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Received SIGINT. Shutting down gracefully...');
    console.log(`Total runs completed: ${runCount}`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Received SIGTERM. Shutting down gracefully...');
    console.log(`Total runs completed: ${runCount}`);
    process.exit(0);
});

// Start the cron loop
cronLoop().catch(err => {
    console.error('Fatal error in cron loop:', err);
    process.exit(1);
});
