#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const CHECK_INTERVAL = 5 * 60 * 1000;
const MONITOR_LOG = 'logs/auto-monitor.log';

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(MONITOR_LOG, logMessage + '\n');
}

async function checkStatus() {
    try {
        log('\n' + '='.repeat(80));
        log('🔍 Checking Chinese Translation Status...');

        const totalResult = await db.query('SELECT COUNT(*) FROM source_words_chinese');
        const total = parseInt(totalResult.rows[0].count);
        log(`📚 Total Chinese words: ${total}`);

        const pairs = [
            { name: 'ZH → RU', table: 'target_translations_russian_from_zh' },
            { name: 'ZH → DE', table: 'target_translations_german_from_zh' },
            { name: 'ZH → EN', table: 'target_translations_english_from_zh' },
            { name: 'ZH → ES', table: 'target_translations_spanish_from_zh' }
        ];

        let allComplete = true;
        let totalTranslated = 0;

        for (const pair of pairs) {
            try {
                const result = await db.query(`SELECT COUNT(*) FROM ${pair.table}`);
                const count = parseInt(result.rows[0].count);
                const percentage = Math.round((count / total) * 100);
                totalTranslated += count;

                if (percentage === 100) {
                    log(`   ✅ ${pair.name}: ${count}/${total} (100%)`);
                } else if (count > 0) {
                    log(`   🔄 ${pair.name}: ${count}/${total} (${percentage}%)`);
                    allComplete = false;
                } else {
                    log(`   ⏳ ${pair.name}: 0/${total} (0%)`);
                    allComplete = false;
                }
            } catch (error) {
                log(`   ❌ ${pair.name}: Not exists`);
                allComplete = false;
            }
        }

        log(`\n📊 Total: ${totalTranslated}/${total * 4} (${Math.round((totalTranslated / (total * 4)) * 100)}%)`);

        if (fs.existsSync('logs/chinese-translation-status.json')) {
            const status = JSON.parse(fs.readFileSync('logs/chinese-translation-status.json', 'utf8'));
            log(`\n📝 Current: ${status.pairName || 'Unknown'} - ${status.progress || 'N/A'} - ETA: ${status.eta || 'N/A'}`);
        }

        if (allComplete) {
            log('\n🎉 ALL COMPLETED! Stopping monitor.');
            await db.end();
            process.exit(0);
        }

        log(`\n⏰ Next check in 5 minutes...`);
        log('='.repeat(80));
    } catch (error) {
        log(`❌ Error: ${error.message}`);
    }
}

async function monitor() {
    log('🚀 Auto-monitor started!\n');
    await checkStatus();
    setInterval(checkStatus, CHECK_INTERVAL);
}

monitor().catch(err => {
    log(`❌ Crashed: ${err.message}`);
    db.end();
    process.exit(1);
});
