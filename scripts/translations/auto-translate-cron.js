#!/usr/bin/env node
/**
 * Auto Translation Cron Job
 * Runs translation matrix builder every N hours
 * Runs progress monitor every hour
 * Usage: node auto-translate-cron.js [interval_hours]
 */

const { spawn } = require('child_process');
const path = require('path');

const INTERVAL_HOURS = parseInt(process.argv[2]) || 6; // Default: every 6 hours
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;
const MONITOR_INTERVAL_MS = 60 * 60 * 1000; // Monitor every hour

console.log('🤖 AUTO TRANSLATION CRON JOB STARTED');
console.log('='.repeat(80));
console.log(`⏰ Start time: ${new Date().toLocaleString()}`);
console.log(`⏱️  Translation interval: Every ${INTERVAL_HOURS} hours`);
console.log(`📊 Monitor interval: Every hour`);
console.log(`🔁 Mode: Continuous (will run indefinitely)`);
console.log('='.repeat(80));
console.log('');

let runCount = 0;
let monitorCount = 0;

function runTranslationBatch() {
    return new Promise((resolve, reject) => {
        runCount++;

        console.log('\n' + '='.repeat(80));
        console.log(`🚀 TRANSLATION RUN #${runCount}`);
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

function runMonitor() {
    return new Promise((resolve, reject) => {
        monitorCount++;

        console.log('\n' + '='.repeat(80));
        console.log(`📊 PROGRESS MONITOR #${monitorCount}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        console.log('='.repeat(80));
        console.log('');

        const monitorPath = path.join(__dirname, '..', '..', 'monitor-with-history.js');
        const child = spawn('node', [monitorPath], {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Monitor completed successfully');
                resolve();
            } else {
                console.error(`\n⚠️  Monitor exited with code ${code}`);
                resolve(); // Don't fail on monitor errors
            }
        });

        child.on('error', (err) => {
            console.error('\n⚠️  Monitor error:', err);
            resolve(); // Don't fail on monitor errors
        });
    });
}

async function cronLoop() {
    let lastMonitorTime = 0;

    while (true) {
        try {
            // Run translation batch
            await runTranslationBatch();

            // Run monitor immediately after translation
            await runMonitor();
            lastMonitorTime = Date.now();

            // Calculate next run time
            const nextTranslationRun = new Date(Date.now() + INTERVAL_MS);
            const nextMonitorRun = new Date(lastMonitorTime + MONITOR_INTERVAL_MS);

            console.log('');
            console.log('='.repeat(80));
            console.log(`⏸️  WAITING UNTIL NEXT RUN`);
            console.log(`Next translation: ${nextTranslationRun.toLocaleString()} (in ${INTERVAL_HOURS} hours)`);
            console.log(`Next monitor: ${nextMonitorRun.toLocaleString()} (in 1 hour)`);
            console.log('='.repeat(80));

            // Wait and run monitor every hour
            const hourlyChecks = INTERVAL_HOURS;
            for (let i = 0; i < hourlyChecks; i++) {
                await new Promise(resolve => setTimeout(resolve, MONITOR_INTERVAL_MS));

                // Run monitor if not the last iteration (last one will be run after translation)
                if (i < hourlyChecks - 1) {
                    await runMonitor();
                }
            }

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
    console.log(`Translation runs completed: ${runCount}`);
    console.log(`Monitor runs completed: ${monitorCount}`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Received SIGTERM. Shutting down gracefully...');
    console.log(`Translation runs completed: ${runCount}`);
    console.log(`Monitor runs completed: ${monitorCount}`);
    process.exit(0);
});

// Start the cron loop
cronLoop().catch(err => {
    console.error('Fatal error in cron loop:', err);
    process.exit(1);
});
