#!/usr/bin/env node
/**
 * Safe Worker Starter
 * Checks if auto-translate is already running before starting
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOCK_FILE = path.join(__dirname, '.worker-lock');
const PROGRESS_FILE = path.join(__dirname, 'scripts', 'translations', '.translation-progress.json');
const HISTORY_FILE = path.join(__dirname, '.translation-progress-history.json');

console.log('🔍 WORKER STARTER - Safety Check');
console.log('='.repeat(80));

// Check if lock file exists
if (fs.existsSync(LOCK_FILE)) {
    try {
        const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        const lockAge = Date.now() - new Date(lockData.timestamp).getTime();
        const lockAgeMinutes = (lockAge / 60000).toFixed(1);

        console.log('⚠️  Lock file found!');
        console.log(`   Created: ${new Date(lockData.timestamp).toLocaleString()}`);
        console.log(`   Age: ${lockAgeMinutes} minutes`);
        console.log(`   PID: ${lockData.pid}`);

        // If lock is older than 30 minutes, consider it stale
        if (lockAge > 30 * 60 * 1000) {
            console.log('🧹 Lock file is stale (>30 min), removing...');
            fs.unlinkSync(LOCK_FILE);
        } else {
            console.log('\n❌ Worker appears to be running already!');
            console.log('   If you\'re sure it\'s not running, delete the lock file:');
            console.log(`   rm ${LOCK_FILE}`);
            console.log('\n💡 Or wait 30 minutes for automatic cleanup');
            process.exit(1);
        }
    } catch (err) {
        console.log('⚠️  Corrupted lock file, removing...');
        fs.unlinkSync(LOCK_FILE);
    }
}

// Check progress from database
console.log('\n📊 Checking translation progress...');
exec('node monitor-with-history.js', { timeout: 30000 }, (error, stdout) => {
    if (stdout) {
        // Extract progress info
        const lines = stdout.split('\n');
        const progressLines = lines.filter(line =>
            line.includes('AR→') || line.includes('ZH→') || line.includes('Average rate')
        );

        console.log('\nCurrent status:');
        progressLines.slice(0, 5).forEach(line => console.log('  ' + line.trim()));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ All checks passed! Starting worker...');
    console.log('='.repeat(80));
    console.log('');

    // Create lock file
    const lockData = {
        timestamp: new Date().toISOString(),
        pid: process.pid,
        command: 'auto-translate-cron.js'
    };
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2));

    // Start the worker
    const workerPath = path.join(__dirname, 'scripts', 'translations', 'auto-translate-cron.js');
    const child = spawn('node', [workerPath, '6'], {
        stdio: 'inherit',
        detached: false
    });

    // Clean up lock file on exit
    const cleanup = () => {
        console.log('\n🧹 Cleaning up lock file...');
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
        }
    };

    process.on('SIGINT', () => {
        cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        cleanup();
        process.exit(0);
    });

    child.on('exit', (code) => {
        cleanup();
        console.log(`\n👋 Worker exited with code ${code}`);
        process.exit(code);
    });
});
