#!/usr/bin/env node
/**
 * Watch for import completion and auto-launch translation
 */

const { Pool } = require('pg');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const CHECK_INTERVAL = 30 * 1000; // 30 seconds
const LOG_FILE = 'logs/watch-and-translate.log';

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

async function checkImportStatus() {
    try {
        const languages = [
            { code: 'pt', name: 'Portuguese', table: 'source_words_portuguese', expected: 9999 },
            { code: 'it', name: 'Italian', table: 'source_words_italian', expected: 9999 },
            { code: 'ar', name: 'Arabic', table: 'source_words_arabic', expected: 9999 },
            { code: 'tr', name: 'Turkish', table: 'source_words_turkish', expected: 9999 }
        ];

        log('\n🔍 Checking import status...');
        let allComplete = true;

        for (const lang of languages) {
            try {
                const result = await db.query(`SELECT COUNT(*) FROM ${lang.table}`);
                const count = parseInt(result.rows[0].count);

                if (count >= lang.expected) {
                    log(`   ✅ ${lang.name}: ${count} words`);
                } else if (count > 0) {
                    log(`   🔄 ${lang.name}: ${count}/${lang.expected} words (${Math.round(count/lang.expected*100)}%)`);
                    allComplete = false;
                } else {
                    log(`   ⏳ ${lang.name}: Not started`);
                    allComplete = false;
                }
            } catch (error) {
                log(`   ❌ ${lang.name}: Table not exists`);
                allComplete = false;
            }
        }

        if (allComplete) {
            log('\n🎉 ALL IMPORTS COMPLETED!');
            log('🚀 Launching autonomous translation...\n');

            await db.end();

            // Launch translation script
            const cmd = 'node scripts/translations/translate-all-new-languages.js';
            log(`Executing: ${cmd}`);

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    log(`❌ Error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    log(`⚠️ Stderr: ${stderr}`);
                }
                log(`✅ Translation completed!`);
            });

            process.exit(0);
        } else {
            log(`⏰ Checking again in 30 seconds...\n`);
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`);
    }
}

async function watch() {
    log('👀 Watching for import completion...\n');
    await checkImportStatus();
    setInterval(checkImportStatus, CHECK_INTERVAL);
}

watch().catch(err => {
    log(`❌ Crashed: ${err.message}`);
    db.end();
    process.exit(1);
});
