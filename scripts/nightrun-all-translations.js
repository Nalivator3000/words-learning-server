#!/usr/bin/env node
/**
 * NIGHT RUN: Translate all vocabulary to all target languages
 *
 * This script runs translation scripts overnight to populate translations.
 *
 * Current database status:
 * - German (source): 10,540 words
 * - English (source): 9,974 words
 * - Spanish (source): 9,972 words
 *
 * Translation plan:
 * 1. English → Russian (9,974 words) - ~17 min
 * 2. Spanish → Russian (9,972 words) - ~17 min
 * 3. German → Spanish (10,540 words) - ~18 min
 * 4. German → Italian (10,540 words) - ~18 min
 * 5. German → French (10,540 words) - ~18 min
 * 6. German → Polish (10,540 words) - ~18 min
 * 7. German → Portuguese (10,540 words) - ~18 min
 * 8. German → Romanian (10,540 words) - ~18 min
 * 9. German → Serbian (10,540 words) - ~18 min
 * 10. German → Turkish (10,540 words) - ~18 min
 * 11. German → Ukrainian (10,540 words) - ~18 min
 * 12. German → Arabic (10,540 words) - ~18 min
 * 13. German → Swahili (10,540 words) - ~18 min
 *
 * Total: ~4 hours (with 100ms delay between translations + processing time)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SCRIPTS_DIR = path.join(__dirname);
const LOG_FILE = path.join(__dirname, '..', 'nightrun-log.txt');

// List of scripts to run in order
const SCRIPTS = [
    {
        name: 'Translate English → Russian (ru→en pair)',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-english-to-russian.js'),
        estimatedTime: '17 min',
        critical: true
    },
    {
        name: 'Translate Spanish → Russian (ru→es pair)',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-spanish-to-russian.js'),
        estimatedTime: '17 min',
        critical: true
    },
    {
        name: 'Translate German → Spanish',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-spanish.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Italian',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-italian.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → French',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-french.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Polish',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-polish.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Portuguese',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-portuguese.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Romanian',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-romanian.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Serbian',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-serbian.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Turkish',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-turkish.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Ukrainian',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-ukrainian.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Arabic',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-arabic.js'),
        estimatedTime: '18 min',
        critical: false
    },
    {
        name: 'Translate German → Swahili',
        path: path.join(SCRIPTS_DIR, 'translations', 'translate-all-to-swahili.js'),
        estimatedTime: '18 min',
        critical: false
    }
];

// Log function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

// Run a single script
function runScript(script) {
    return new Promise((resolve, reject) => {
        log(`\n${'='.repeat(80)}`);
        log(`📝 Starting: ${script.name}`);
        log(`⏱️  Estimated time: ${script.estimatedTime}`);
        log(`📂 Script: ${script.path}`);
        log(`${'='.repeat(80)}\n`);

        const startTime = Date.now();

        const child = spawn('node', [script.path], {
            stdio: 'inherit',
            cwd: path.dirname(script.path)
        });

        child.on('close', (code) => {
            const duration = Math.round((Date.now() - startTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;

            if (code === 0) {
                log(`\n✅ ${script.name} - COMPLETED in ${minutes}m ${seconds}s\n`);
                resolve({ success: true, script, duration });
            } else {
                log(`\n❌ ${script.name} - FAILED (exit code ${code}) after ${minutes}m ${seconds}s\n`);
                if (script.critical) {
                    reject(new Error(`Critical script failed: ${script.name}`));
                } else {
                    resolve({ success: false, script, duration, code });
                }
            }
        });

        child.on('error', (err) => {
            log(`\n❌ ${script.name} - ERROR: ${err.message}\n`);
            if (script.critical) {
                reject(err);
            } else {
                resolve({ success: false, script, error: err.message });
            }
        });
    });
}

// Main function
async function runAllScripts() {
    const overallStartTime = Date.now();

    log('\n🚀 NIGHT RUN: Starting batch translation\n');
    log(`📅 Started at: ${new Date().toLocaleString()}`);
    log(`📊 Total scripts to run: ${SCRIPTS.length}`);
    log(`⏱️  Estimated total time: ~4 hours\n`);

    const results = [];

    for (let i = 0; i < SCRIPTS.length; i++) {
        const script = SCRIPTS[i];
        log(`\n[${i + 1}/${SCRIPTS.length}] Running: ${script.name}`);

        try {
            const result = await runScript(script);
            results.push(result);

            // Add delay between scripts to avoid rate limiting
            if (i < SCRIPTS.length - 1) {
                log('\n⏸️  Waiting 30 seconds before next script...\n');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        } catch (error) {
            log(`\n🛑 Critical error, stopping batch: ${error.message}\n`);
            break;
        }
    }

    // Summary
    const overallDuration = Math.round((Date.now() - overallStartTime) / 1000);
    const hours = Math.floor(overallDuration / 3600);
    const minutes = Math.floor((overallDuration % 3600) / 60);

    log('\n' + '='.repeat(80));
    log('📊 NIGHT RUN SUMMARY');
    log('='.repeat(80));
    log(`\n⏱️  Total time: ${hours}h ${minutes}m`);
    log(`📅 Completed at: ${new Date().toLocaleString()}\n`);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log(`✅ Successful: ${successful}`);
    log(`❌ Failed: ${failed}`);
    log(`📊 Total: ${results.length}\n`);

    // Detailed results
    log('Detailed Results:');
    results.forEach((result, i) => {
        const status = result.success ? '✅' : '❌';
        const duration = Math.round(result.duration / 60);
        log(`  ${status} ${result.script.name} - ${duration}m`);
    });

    log('\n' + '='.repeat(80));
    log(`📝 Full log saved to: ${LOG_FILE}`);
    log('='.repeat(80) + '\n');

    if (failed > 0) {
        log('⚠️  Some scripts failed. Check the log for details.\n');
        process.exit(1);
    } else {
        log('🎉 All scripts completed successfully!\n');
        process.exit(0);
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    log(`\n💥 Unhandled error: ${error.message}\n`);
    log(error.stack);
    process.exit(1);
});

// Run
runAllScripts().catch(error => {
    log(`\n💥 Fatal error: ${error.message}\n`);
    log(error.stack);
    process.exit(1);
});
