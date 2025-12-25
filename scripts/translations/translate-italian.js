#!/usr/bin/env node
/**
 * Autonomous Translation System for Italian
 * Italian → RU, DE, EN, ES (4 pairs)
 */

const { Pool } = require('pg');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const RATE_LIMIT_DELAY = 150;
const MAX_RETRIES = 3;
const LOG_FILE = 'logs/italian-translation.log';
const STATUS_FILE = 'logs/italian-status.json';

const TRANSLATION_PAIRS = [
    { source: 'it', target: 'ru', table: 'target_translations_russian_from_it', sourceTable: 'source_words_italian' },
    { source: 'it', target: 'de', table: 'target_translations_german_from_it', sourceTable: 'source_words_italian' },
    { source: 'it', target: 'en', table: 'target_translations_english_from_it', sourceTable: 'source_words_italian' },
    { source: 'it', target: 'es', table: 'target_translations_spanish_from_it', sourceTable: 'source_words_italian' },
];

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function updateStatus(status) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateText(text, sourceLang, targetLang, retryCount = 0) {
    return new Promise((resolve, reject) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        const req = https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const translation = parsed[0][0][0];
                    resolve(translation);
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.on('error', async (error) => {
            if (retryCount < MAX_RETRIES) {
                await sleep(1000 * (retryCount + 1));
                try {
                    const result = await translateText(text, sourceLang, targetLang, retryCount + 1);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            } else {
                reject(error);
            }
        });
    });
}

async function createTranslationTable(pair) {
    await db.query(`
        CREATE TABLE IF NOT EXISTS ${pair.table} (
            id SERIAL PRIMARY KEY,
            source_word_id INTEGER NOT NULL,
            translation TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_word_id) REFERENCES ${pair.sourceTable}(id) ON DELETE CASCADE,
            UNIQUE(source_word_id)
        )
    `);
}

async function translatePair(pair, pairIndex, totalPairs) {
    log(`\n${'='.repeat(80)}`);
    log(`📚 Pair ${pairIndex + 1}/${totalPairs}: IT → ${pair.target.toUpperCase()}`);
    log('='.repeat(80));

    const startTime = Date.now();

    await createTranslationTable(pair);
    log(`✅ Table created: ${pair.table}`);

    const wordsResult = await db.query(`
        SELECT sw.id, sw.word
        FROM ${pair.sourceTable} sw
        LEFT JOIN ${pair.table} tt ON sw.id = tt.source_word_id
        WHERE tt.id IS NULL
        ORDER BY sw.id
    `);

    const words = wordsResult.rows;
    const totalWords = words.length;

    if (totalWords === 0) {
        log(`✅ All words already translated!`);
        return { translated: 0, errors: 0, time: 0 };
    }

    log(`📝 Words to translate: ${totalWords}`);
    log(`⏱️  Estimated time: ${Math.round(totalWords * RATE_LIMIT_DELAY / 1000 / 60)} minutes`);

    let translated = 0;
    let errors = 0;
    const logInterval = 100;

    for (const word of words) {
        try {
            const translation = await translateText(word.word, pair.source, pair.target);

            await db.query(`
                INSERT INTO ${pair.table} (source_word_id, translation)
                VALUES ($1, $2)
                ON CONFLICT (source_word_id) DO NOTHING
            `, [word.id, translation]);

            translated++;

            if (translated % logInterval === 0) {
                const elapsed = (Date.now() - startTime) / 1000 / 60;
                const rate = translated / elapsed;
                const remaining = totalWords - translated;
                const eta = remaining / rate;

                log(`   ✅ ${translated}/${totalWords} (${elapsed.toFixed(1)}m, ~${eta.toFixed(1)}m left)`);

                updateStatus({
                    currentPair: pairIndex + 1,
                    totalPairs,
                    pairName: `IT → ${pair.target.toUpperCase()}`,
                    progress: `${translated}/${totalWords}`,
                    percentage: Math.round((translated / totalWords) * 100),
                    elapsed: `${elapsed.toFixed(1)}m`,
                    eta: `${eta.toFixed(1)}m`,
                    errors,
                    lastUpdate: new Date().toISOString()
                });
            }

            await sleep(RATE_LIMIT_DELAY);

        } catch (error) {
            errors++;
            if (errors % 10 === 0) {
                log(`   ⚠️  Error ${errors}: ${error.message}`);
            }
        }
    }

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    log(`\n✅ Pair ${pairIndex + 1}/${totalPairs} COMPLETED!`);
    log(`   Translated: ${translated}/${totalWords}`);
    log(`   Errors: ${errors}`);
    log(`   Time: ${totalTime.toFixed(1)} minutes`);

    return { translated, errors, time: totalTime };
}

async function main() {
    log('\n🇮🇹 Italian Autonomous Translation System\n');
    log('═'.repeat(80));
    log('\n📋 Translation pairs:');
    log('   IT → RU, DE, EN, ES (4 pairs)');
    log('   ~10,000 words × 4 = ~40,000 translations');
    log('\n⚙️  Mode: FULLY AUTONOMOUS');
    log('═'.repeat(80));

    const overallStart = Date.now();
    const results = [];

    for (let i = 0; i < TRANSLATION_PAIRS.length; i++) {
        const result = await translatePair(TRANSLATION_PAIRS[i], i, TRANSLATION_PAIRS.length);
        results.push(result);
    }

    const totalTime = (Date.now() - overallStart) / 1000 / 60;
    const totalTranslated = results.reduce((sum, r) => sum + r.translated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    log('\n' + '═'.repeat(80));
    log('✅ ALL ITALIAN PAIRS COMPLETED!');
    log(`\n📊 Summary:`);
    log(`   Total translated: ${totalTranslated}`);
    log(`   Total errors: ${totalErrors}`);
    log(`   Total time: ${totalTime.toFixed(1)} minutes (${(totalTime / 60).toFixed(1)} hours)`);
    log('═'.repeat(80) + '\n');

    updateStatus({
        status: 'COMPLETED',
        totalTranslated,
        totalErrors,
        totalTime: `${totalTime.toFixed(1)} minutes`,
        completedAt: new Date().toISOString()
    });

    await db.end();
}

main().catch(err => {
    log(`❌ CRITICAL ERROR: ${err.message}`);
    updateStatus({
        status: 'ERROR',
        error: err.message,
        timestamp: new Date().toISOString()
    });
    db.end();
    process.exit(1);
});
