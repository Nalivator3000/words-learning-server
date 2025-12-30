#!/usr/bin/env node
/**
 * Quick database check - counts translations in all tables
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 20000
});

async function quickCheck() {
    try {
        console.log('\n🔍 QUICK DATABASE CHECK\n');

        // Get all translation tables
        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'target_translations_%'
            ORDER BY table_name
        `);

        console.log(`Found ${tables.rows.length} translation tables\n`);

        let completed = 0;
        let inProgress = 0;
        let empty = 0;

        for (const row of tables.rows) {
            const table = row.table_name;
            const result = await db.query(`SELECT COUNT(*) FROM "${table}"`);
            const count = parseInt(result.rows[0].count);

            if (count >= 8000) {
                completed++;
                console.log(`✅ ${table}: ${count.toLocaleString()} words`);
            } else if (count > 0) {
                inProgress++;
                console.log(`🔄 ${table}: ${count.toLocaleString()} words`);
            } else {
                empty++;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Completed (≥8000 words): ${completed}`);
        console.log(`🔄 In Progress (1-7999 words): ${inProgress}`);
        console.log(`⏳ Empty (0 words): ${empty}`);
        console.log(`📋 Total tables: ${tables.rows.length}`);
        console.log(`${'='.repeat(60)}\n`);

        await db.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        await db.end();
        process.exit(1);
    }
}

quickCheck();
