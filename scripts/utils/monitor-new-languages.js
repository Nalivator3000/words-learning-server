#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MONITOR_LOG = 'logs/new-languages-monitor.log';

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(MONITOR_LOG, logMessage + '\n');
}

async function checkStatus() {
    try {
        log('\n' + '='.repeat(80));
        log('🔍 Checking New Languages Translation Status...');

        const languages = [
            { code: 'pt', name: 'Portuguese', emoji: '🇵🇹', table: 'source_words_portuguese' },
            { code: 'it', name: 'Italian', emoji: '🇮🇹', table: 'source_words_italian' },
            { code: 'ar', name: 'Arabic', emoji: '🇸🇦', table: 'source_words_arabic' },
            { code: 'tr', name: 'Turkish', emoji: '🇹🇷', table: 'source_words_turkish' }
        ];

        let totalWords = 0;
        let totalTranslated = 0;
        let allComplete = true;

        for (const lang of languages) {
            try {
                const totalResult = await db.query(`SELECT COUNT(*) FROM ${lang.table}`);
                const total = parseInt(totalResult.rows[0].count);
                totalWords += total * 4; // 4 target languages each

                log(`\n${lang.emoji} ${lang.name.toUpperCase()} (${total} words):`);

                const targets = ['ru', 'de', 'en', 'es'];
                for (const target of targets) {
                    const tableName = `target_translations_${target === 'ru' ? 'russian' : target === 'de' ? 'german' : target === 'en' ? 'english' : 'spanish'}_from_${lang.code}`;

                    try {
                        const result = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
                        const count = parseInt(result.rows[0].count);
                        const percentage = Math.round((count / total) * 100);
                        totalTranslated += count;

                        if (percentage === 100) {
                            log(`   ✅ ${lang.code.toUpperCase()} → ${target.toUpperCase()}: ${count}/${total} (100%)`);
                        } else if (count > 0) {
                            log(`   🔄 ${lang.code.toUpperCase()} → ${target.toUpperCase()}: ${count}/${total} (${percentage}%)`);
                            allComplete = false;
                        } else {
                            log(`   ⏳ ${lang.code.toUpperCase()} → ${target.toUpperCase()}: 0/${total} (0%)`);
                            allComplete = false;
                        }
                    } catch (error) {
                        log(`   ❌ ${lang.code.toUpperCase()} → ${target.toUpperCase()}: Not exists`);
                        allComplete = false;
                    }
                }
            } catch (error) {
                log(`   ❌ ${lang.name}: Source table not exists`);
                allComplete = false;
            }
        }

        log(`\n📊 Total: ${totalTranslated}/${totalWords} (${Math.round((totalTranslated / totalWords) * 100)}%)`);

        if (fs.existsSync('logs/new-languages-status.json')) {
            const status = JSON.parse(fs.readFileSync('logs/new-languages-status.json', 'utf8'));
            log(`\n📝 Current: ${status.pairName || 'Unknown'} - ${status.progress || 'N/A'} - ETA: ${status.eta || 'N/A'}`);
        }

        if (allComplete) {
            log('\n🎉 ALL 16 PAIRS COMPLETED! Stopping monitor.');
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
    log('🚀 New Languages Auto-monitor started!\n');
    await checkStatus();
    setInterval(checkStatus, CHECK_INTERVAL);
}

monitor().catch(err => {
    log(`❌ Crashed: ${err.message}`);
    db.end();
    process.exit(1);
});
