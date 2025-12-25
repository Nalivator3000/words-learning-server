#!/usr/bin/env node
/**
 * Monitor progress of remaining 6 language pairs translation
 */

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const PAIRS = [
    { source: 'EN', target: 'FR', sourceTable: 'source_words_english', translationTable: 'target_translations_french_from_en' },
    { source: 'ES', target: 'FR', sourceTable: 'source_words_spanish', translationTable: 'target_translations_french_from_es' },
    { source: 'FR', target: 'RU', sourceTable: 'source_words_french', translationTable: 'target_translations_russian_from_fr' },
    { source: 'FR', target: 'DE', sourceTable: 'source_words_french', translationTable: 'target_translations_german_from_fr' },
    { source: 'FR', target: 'EN', sourceTable: 'source_words_french', translationTable: 'target_translations_english_from_fr' },
    { source: 'FR', target: 'ES', sourceTable: 'source_words_french', translationTable: 'target_translations_spanish_from_fr' }
];

async function checkProgress() {
    console.log('\n' + '='.repeat(80));
    console.log(`🔍 MONITORING: Remaining 6 Pairs Progress`);
    console.log('='.repeat(80));

    let totalSource = 0;
    let totalTranslated = 0;
    let completedPairs = 0;

    for (const pair of PAIRS) {
        try {
            // Check if table exists
            const tableExists = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = $1
                )
            `, [pair.translationTable]);

            if (!tableExists.rows[0].exists) {
                console.log(`\n⭕ ${pair.source} → ${pair.target}: Table not created yet`);
                continue;
            }

            // Get counts
            const sourceCount = await db.query(`SELECT COUNT(*) as count FROM ${pair.sourceTable}`);
            const translationCount = await db.query(`SELECT COUNT(*) as count FROM ${pair.translationTable}`);

            const source = parseInt(sourceCount.rows[0].count);
            const translated = parseInt(translationCount.rows[0].count);
            const percentage = source > 0 ? Math.round((translated / source) * 100) : 0;

            totalSource += source;
            totalTranslated += translated;

            if (percentage === 100) {
                completedPairs++;
                console.log(`\n✅ ${pair.source} → ${pair.target}: ${translated}/${source} (100%)`);
            } else if (translated > 0) {
                console.log(`\n🔄 ${pair.source} → ${pair.target}: ${translated}/${source} (${percentage}%)`);
            } else {
                console.log(`\n⭕ ${pair.source} → ${pair.target}: 0/${source} (0%)`);
            }

        } catch (error) {
            console.log(`\n❌ ${pair.source} → ${pair.target}: Error - ${error.message}`);
        }
    }

    const overallPercentage = totalSource > 0 ? Math.round((totalTranslated / totalSource) * 100) : 0;

    console.log('\n' + '='.repeat(80));
    console.log(`📊 OVERALL PROGRESS:`);
    console.log(`   Pairs completed: ${completedPairs}/6`);
    console.log(`   Total translations: ${totalTranslated}/${totalSource} (${overallPercentage}%)`);
    console.log('='.repeat(80));

    // Check log file
    const logPath = 'logs/translate-remaining-pairs.log';
    if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        const lines = logContent.trim().split('\n');
        const lastLines = lines.slice(-5).join('\n');

        if (lastLines) {
            console.log(`\n📋 Latest log entries:`);
            console.log(lastLines);
        }
    }

    console.log(`\n⏰ Next check in 5 minutes...`);
}

async function monitor() {
    while (true) {
        const timestamp = new Date().toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        console.log(`[${timestamp}] ` + '='.repeat(70));
        await checkProgress();

        // Wait 5 minutes
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
}

monitor().catch(err => {
    console.error('❌ Monitor error:', err);
    db.end();
    process.exit(1);
});
