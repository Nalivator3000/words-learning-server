#!/usr/bin/env node
/**
 * Quick translation progress checker
 * Usage: railway run node check-progress.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 15000
});

async function checkProgress() {
    try {
        // Get list of all translation tables
        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'target_translations_%'
            ORDER BY table_name
        `);

        console.log('\n📊 TRANSLATION PROGRESS CHECK');
        console.log('='.repeat(80));
        console.log('⏰ Time:', new Date().toLocaleString());
        console.log('='.repeat(80));

        let completedPairs = [];
        let inProgressPairs = [];
        let emptyPairs = [];

        for (const row of tables.rows) {
            const table = row.table_name;
            try {
                const count = await db.query(`SELECT COUNT(*) FROM "${table}"`);
                const total = parseInt(count.rows[0].count);

                if (total >= 8000) {
                    completedPairs.push({ table, count: total });
                } else if (total > 0) {
                    inProgressPairs.push({ table, count: total });
                } else {
                    emptyPairs.push(table);
                }
            } catch (err) {
                // Table might not exist yet
            }
        }

        if (completedPairs.length > 0) {
            console.log(`\n✅ COMPLETED PAIRS (${completedPairs.length}):`);
            completedPairs.forEach(p => {
                const name = p.table.replace('target_translations_', '').replace('_from_', '→');
                console.log(`   ${name}: ${p.count.toLocaleString()} words`);
            });
        }

        if (inProgressPairs.length > 0) {
            console.log(`\n🔄 IN PROGRESS (${inProgressPairs.length}):`);
            inProgressPairs.forEach(p => {
                const name = p.table.replace('target_translations_', '').replace('_from_', '→');
                const percent = ((p.count / 8076) * 100).toFixed(1);
                console.log(`   ${name}: ${p.count.toLocaleString()} / 8,076 (${percent}%)`);
            });
        }

        console.log(`\n` + '='.repeat(80));
        console.log(`📈 SUMMARY:`);
        console.log(`   ✅ Completed: ${completedPairs.length} pairs`);
        console.log(`   🔄 In Progress: ${inProgressPairs.length} pairs`);
        console.log(`   📋 Total Tables: ${tables.rows.length}`);
        console.log(`   🎯 Target: 272 total pairs`);
        console.log(`   ⏳ Remaining: ${272 - completedPairs.length} pairs to complete`);

        if (completedPairs.length > 0) {
            const percentComplete = ((completedPairs.length / 272) * 100).toFixed(1);
            console.log(`   📊 Overall Progress: ${percentComplete}%`);
        }

        console.log('='.repeat(80));
        console.log('');

        await db.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        await db.end();
        process.exit(1);
    }
}

checkProgress();
