#!/usr/bin/env node
/**
 * One-time translation script
 * Run this manually when you want to process translations
 * Usage: node start-translations-once.js
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'scripts', 'translations', 'translate-matrix-parallel.js');

console.log('🚀 STARTING ONE-TIME TRANSLATION BATCH');
console.log('='.repeat(80));
console.log('⏰ Started at:', new Date().toLocaleString());
console.log('🔗 Database:', process.env.DATABASE_URL ? 'Connected ✅' : 'Not configured ❌');
console.log('📝 Script:', SCRIPT_PATH);
console.log('='.repeat(80));
console.log('');

const startTime = Date.now();

const child = spawn('node', [SCRIPT_PATH], {
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production'
    }
});

child.on('close', (code) => {
    const duration = ((Date.now() - startTime) / 60000).toFixed(1);

    console.log('');
    console.log('='.repeat(80));
    if (code === 0) {
        console.log('✅ TRANSLATION BATCH COMPLETED SUCCESSFULLY');
    } else {
        console.log(`❌ TRANSLATION BATCH FAILED (Exit code: ${code})`);
    }
    console.log(`⏱️  Total duration: ${duration} minutes`);
    console.log('='.repeat(80));

    process.exit(code);
});

child.on('error', (err) => {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ ERROR:', err.message);
    console.error('='.repeat(80));
    process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => {
    console.log('\n⚠️  Received SIGTERM, stopping...');
    child.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('\n⚠️  Received SIGINT (Ctrl+C), stopping...');
    child.kill('SIGINT');
});
