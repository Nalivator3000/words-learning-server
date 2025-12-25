#!/usr/bin/env node
/**
 * Translation Worker for Railway
 * Automatically restarts on crashes, runs translations in batches
 */

require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'scripts', 'translations', 'translate-matrix-parallel.js');
const INTERVAL_HOURS = 6;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

let runCount = 0;
let consecutiveFailures = 0;

console.log('🚀 TRANSLATION WORKER STARTED');
console.log('='.repeat(80));
console.log('⏰ Start time:', new Date().toLocaleString());
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 Database:', process.env.DATABASE_URL ? 'Connected ✅' : 'Not configured ❌');
console.log('⏱️  Interval:', `${INTERVAL_HOURS} hours`);
console.log('🔄 Max retries:', MAX_RETRIES);
console.log('='.repeat(80));
console.log('');

// Check if script exists
if (!fs.existsSync(SCRIPT_PATH)) {
    console.error('❌ FATAL: Translation script not found at:', SCRIPT_PATH);
    process.exit(1);
}

function runTranslationBatch() {
    return new Promise((resolve, reject) => {
        runCount++;
        const startTime = Date.now();

        console.log('\n' + '='.repeat(80));
        console.log(`🚀 BATCH RUN #${runCount}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        console.log(`📊 Consecutive failures: ${consecutiveFailures}/${MAX_RETRIES}`);
        console.log('='.repeat(80));
        console.log('');

        const child = spawn('node', [SCRIPT_PATH], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: process.env.NODE_ENV || 'production'
            }
        });

        // Timeout protection (2 hours max per batch)
        const timeout = setTimeout(() => {
            console.error('\n⏰ TIMEOUT: Batch exceeded 2 hours, killing process...');
            child.kill('SIGTERM');
            setTimeout(() => child.kill('SIGKILL'), 5000); // Force kill after 5s
        }, 2 * 60 * 60 * 1000);

        child.on('close', (code) => {
            clearTimeout(timeout);
            const duration = ((Date.now() - startTime) / 60000).toFixed(1);

            if (code === 0) {
                consecutiveFailures = 0;
                console.log('\n' + '='.repeat(80));
                console.log(`✅ BATCH COMPLETED SUCCESSFULLY`);
                console.log(`⏱️  Duration: ${duration} minutes`);
                console.log(`📈 Total runs: ${runCount}`);
                console.log('='.repeat(80));
                resolve();
            } else {
                consecutiveFailures++;
                console.error('\n' + '='.repeat(80));
                console.error(`❌ BATCH FAILED (Exit code: ${code})`);
                console.error(`⏱️  Duration: ${duration} minutes`);
                console.error(`⚠️  Consecutive failures: ${consecutiveFailures}/${MAX_RETRIES}`);
                console.error('='.repeat(80));
                reject(new Error(`Batch failed with exit code ${code}`));
            }
        });

        child.on('error', (err) => {
            clearTimeout(timeout);
            consecutiveFailures++;
            console.error('\n❌ SPAWN ERROR:', err.message);
            reject(err);
        });

        // Handle termination signals
        const cleanup = (signal) => {
            console.log(`\n⚠️  Received ${signal}, cleaning up...`);
            clearTimeout(timeout);
            child.kill(signal);
        };

        process.once('SIGTERM', () => cleanup('SIGTERM'));
        process.once('SIGINT', () => cleanup('SIGINT'));
    });
}

async function workerLoop() {
    console.log('🔁 Starting worker loop...\n');

    while (true) {
        try {
            // Check if we've exceeded max consecutive failures
            if (consecutiveFailures >= MAX_RETRIES) {
                console.error('\n' + '='.repeat(80));
                console.error('🛑 CRITICAL: Maximum consecutive failures reached');
                console.error(`Failed ${consecutiveFailures} times in a row`);
                console.error('Waiting 30 minutes before next retry...');
                console.error('='.repeat(80));
                consecutiveFailures = 0; // Reset counter
                await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
                continue;
            }

            // Run translation batch
            await runTranslationBatch();

            // Check if all translations are complete
            const progressFile = path.join(__dirname, 'scripts', 'translations', '.translation-progress.json');
            if (fs.existsSync(progressFile)) {
                try {
                    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
                    const completed = progress.completed?.length || 0;

                    console.log(`\n📊 Progress: ${completed}/215 pairs completed`);

                    if (completed >= 215) {
                        console.log('\n' + '='.repeat(80));
                        console.log('🎉 ALL TRANSLATIONS COMPLETE!');
                        console.log(`Total batches run: ${runCount}`);
                        console.log('Worker shutting down...');
                        console.log('='.repeat(80));
                        process.exit(0);
                    }
                } catch (err) {
                    console.warn('⚠️  Could not read progress file:', err.message);
                }
            }

            // Calculate next run time
            const nextRun = new Date(Date.now() + INTERVAL_MS);

            console.log('\n' + '='.repeat(80));
            console.log('⏸️  WAITING FOR NEXT BATCH');
            console.log(`Next run: ${nextRun.toLocaleString()}`);
            console.log(`Interval: ${INTERVAL_HOURS} hours`);
            console.log('='.repeat(80));

            await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));

        } catch (err) {
            console.error('\n⚠️  ERROR IN WORKER LOOP:', err.message);

            if (consecutiveFailures < MAX_RETRIES) {
                console.log(`\n⏳ Retrying in ${RETRY_DELAY_MS / 60000} minutes...`);
                console.log(`Attempt ${consecutiveFailures + 1}/${MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }
}

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('\n💥 UNCAUGHT EXCEPTION:', err);
    console.error('Stack:', err.stack);
    console.error('Worker will attempt to continue...\n');
    consecutiveFailures++;
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 UNHANDLED REJECTION at:', promise);
    console.error('Reason:', reason);
    console.error('Worker will attempt to continue...\n');
    consecutiveFailures++;
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n\n🛑 SIGTERM received, shutting down gracefully...');
    console.log(`Total batches run: ${runCount}`);
    console.log(`Consecutive failures: ${consecutiveFailures}`);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n\n🛑 SIGINT received, shutting down gracefully...');
    console.log(`Total batches run: ${runCount}`);
    console.log(`Consecutive failures: ${consecutiveFailures}`);
    process.exit(0);
});

// Start the worker
workerLoop().catch((err) => {
    console.error('\n💥 FATAL ERROR IN WORKER LOOP:', err);
    console.error('Stack:', err.stack);
    process.exit(1);
});

// Keep alive heartbeat (every 5 minutes)
setInterval(() => {
    console.log(`💓 Heartbeat - Worker alive | Runs: ${runCount} | Failures: ${consecutiveFailures}`);
}, 5 * 60 * 1000);
