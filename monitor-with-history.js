#!/usr/bin/env node
/**
 * Translation Progress Monitor with History Tracking
 * Tracks translation progress over time and shows trends
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 30000
});

const HISTORY_FILE = path.join(__dirname, '.translation-progress-history.json');

// Key pairs to monitor (Phase 3 - most active)
const MONITOR_PAIRS = [
    { source: 'ar', target: 'tr', total: 10000 },
    { source: 'ar', target: 'sw', total: 10000 },
    { source: 'ar', target: 'zh', total: 10000 },
    { source: 'ar', target: 'ja', total: 10000 },
    { source: 'ar', target: 'ko', total: 10000 },
    { source: 'ar', target: 'hi', total: 10000 },
    { source: 'ar', target: 'en', total: 10000 },
    { source: 'zh', target: 'ar', total: 10000 },
    { source: 'zh', target: 'fr', total: 10000 },
    { source: 'zh', target: 'it', total: 10000 },
    { source: 'zh', target: 'pt', total: 10000 },
];

const LANG_NAMES = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'it': 'italian', 'pl': 'polish', 'pt': 'portuguese',
    'ro': 'romanian', 'sr': 'serbian', 'tr': 'turkish', 'uk': 'ukrainian',
    'ar': 'arabic', 'sw': 'swahili', 'zh': 'chinese', 'hi': 'hindi',
    'ja': 'japanese', 'ko': 'korean'
};

function getTableName(source, target) {
    const sourceName = LANG_NAMES[source];
    const targetName = LANG_NAMES[target];

    if (source === 'de') {
        return `target_translations_${targetName}`;
    } else {
        return `target_translations_${targetName}_from_${source}`;
    }
}

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch (error) {
        console.log('⚠️  Could not load history:', error.message);
    }
    return { snapshots: [] };
}

function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('⚠️  Could not save history:', error.message);
    }
}

async function checkProgress() {
    try {
        console.log('\n📊 TRANSLATION PROGRESS MONITOR WITH HISTORY');
        console.log('='.repeat(80));
        console.log(`Time: ${new Date().toLocaleString()}`);
        console.log('='.repeat(80) + '\n');

        const currentSnapshot = {
            timestamp: new Date().toISOString(),
            pairs: []
        };

        console.log('CURRENT STATUS (Phase 3 - Active Translations)\n');

        for (const pair of MONITOR_PAIRS) {
            const tableName = getTableName(pair.source, pair.target);

            const tableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = $1
                )
            `, [tableName]);

            let translated = 0;

            if (tableCheck.rows[0].exists) {
                const transCount = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
                translated = parseInt(transCount.rows[0].count);
            }

            const percent = ((translated / pair.total) * 100);

            currentSnapshot.pairs.push({
                pair: `${pair.source}→${pair.target}`,
                translated,
                total: pair.total,
                percent: parseFloat(percent.toFixed(1))
            });

            if (percent > 0 && percent < 100) {
                const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
                console.log(`⏳ ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: [${bar}] ${percent.toFixed(1).padStart(5)}% (${translated.toString().padStart(5)}/${pair.total})`);
            } else if (percent >= 100) {
                console.log(`✅ ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: Complete (${translated}/${pair.total})`);
            } else {
                console.log(`⬜ ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: Not started (0/${pair.total})`);
            }
        }

        // Load history and compare
        const history = loadHistory();
        const lastSnapshot = history.snapshots.length > 0 ? history.snapshots[history.snapshots.length - 1] : null;

        if (lastSnapshot) {
            console.log('\n' + '='.repeat(80));
            console.log('📈 CHANGES SINCE LAST CHECK');
            console.log(`Last check: ${new Date(lastSnapshot.timestamp).toLocaleString()}`);
            console.log('='.repeat(80) + '\n');

            let changesFound = false;
            let totalDelta = 0;

            for (const currentPair of currentSnapshot.pairs) {
                const lastPair = lastSnapshot.pairs.find(p => p.pair === currentPair.pair);

                if (lastPair && currentPair.translated > lastPair.translated) {
                    const delta = currentPair.translated - lastPair.translated;
                    const percentDelta = (currentPair.percent - lastPair.percent).toFixed(1);

                    console.log(`📈 ${currentPair.pair}: ${lastPair.translated.toString().padStart(5)} → ${currentPair.translated.toString().padStart(5)} (+${delta.toString().padStart(4)} words, +${percentDelta.padStart(4)}%)`);
                    totalDelta += delta;
                    changesFound = true;
                }
            }

            if (!changesFound) {
                console.log('⏸️  No changes detected since last check\n');
            } else {
                console.log(`\n📊 Total words added: ${totalDelta}`);
            }

            // Calculate translation rate
            const timeDiff = new Date(currentSnapshot.timestamp) - new Date(lastSnapshot.timestamp);
            const minutesDiff = timeDiff / (1000 * 60);
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 0 && totalDelta > 0) {
                const rate = totalDelta / hoursDiff;

                console.log('\n' + '='.repeat(80));
                console.log('⚡ TRANSLATION SPEED');
                console.log('='.repeat(80));
                console.log(`Time elapsed: ${minutesDiff.toFixed(1)} minutes (${hoursDiff.toFixed(2)} hours)`);
                console.log(`Words translated: ${totalDelta}`);
                console.log(`Average rate: ${rate.toFixed(0)} words/hour`);

                // Estimate completion time
                const remainingWords = currentSnapshot.pairs.reduce((sum, p) => sum + (p.total - p.translated), 0);
                if (rate > 0) {
                    const hoursRemaining = remainingWords / rate;
                    const daysRemaining = hoursRemaining / 24;

                    console.log(`\n📅 Estimated completion for monitored pairs:`);
                    console.log(`   ${hoursRemaining.toFixed(1)} hours (~${daysRemaining.toFixed(1)} days at current rate)`);
                }
            }

            // Show trend across last few snapshots
            if (history.snapshots.length >= 3) {
                console.log('\n' + '='.repeat(80));
                console.log('📊 HISTORICAL TREND (Last 5 Checks)');
                console.log('='.repeat(80) + '\n');

                const recentSnapshots = history.snapshots.slice(-5);

                // Find pairs with most activity
                const pairActivity = {};

                for (let i = 1; i < recentSnapshots.length; i++) {
                    const prev = recentSnapshots[i - 1];
                    const curr = recentSnapshots[i];

                    for (const currPair of curr.pairs) {
                        const prevPair = prev.pairs.find(p => p.pair === currPair.pair);
                        if (prevPair) {
                            const delta = currPair.translated - prevPair.translated;
                            if (delta > 0) {
                                if (!pairActivity[currPair.pair]) {
                                    pairActivity[currPair.pair] = { total: 0, checks: 0 };
                                }
                                pairActivity[currPair.pair].total += delta;
                                pairActivity[currPair.pair].checks++;
                            }
                        }
                    }
                }

                const topPairs = Object.entries(pairActivity)
                    .sort((a, b) => b[1].total - a[1].total)
                    .slice(0, 5);

                console.log('Most Active Pairs:');
                for (const [pair, activity] of topPairs) {
                    const avgPerCheck = (activity.total / activity.checks).toFixed(0);
                    console.log(`  ${pair}: +${activity.total} words (avg ${avgPerCheck}/check)`);
                }
            }
        } else {
            console.log('\n📝 First monitoring snapshot created');
        }

        // Save current snapshot to history
        history.snapshots.push(currentSnapshot);

        // Keep only last 100 snapshots
        if (history.snapshots.length > 100) {
            history.snapshots = history.snapshots.slice(-100);
        }

        saveHistory(history);

        console.log('\n' + '='.repeat(80));
        console.log(`💾 Progress saved to: ${HISTORY_FILE}`);
        console.log(`📝 Snapshots in history: ${history.snapshots.length}`);
        console.log('='.repeat(80) + '\n');

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await db.end();
        process.exit(1);
    }
}

checkProgress();
