#!/usr/bin/env node
/**
 * Migration: Add UNIQUE constraints to all translation tables
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔧 Adding UNIQUE constraints to translation tables...\n');

        // Get all translation tables
        const result = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'target_translations_%'
            ORDER BY tablename
        `);

        const tables = result.rows.map(r => r.tablename);
        console.log(`📝 Found ${tables.length} translation tables\n`);

        let added = 0;
        let skipped = 0;

        for (const table of tables) {
            try {
                // Try to add UNIQUE constraint
                await db.query(`
                    ALTER TABLE ${table}
                    ADD CONSTRAINT ${table}_source_word_id_key UNIQUE (source_word_id)
                `);
                console.log(`✅ ${table}`);
                added++;
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⏭️  ${table} (already has constraint)`);
                    skipped++;
                } else {
                    console.error(`❌ ${table}:`, error.message);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ MIGRATION COMPLETED');
        console.log('='.repeat(70));
        console.log(`✅ Added constraints: ${added} tables`);
        console.log(`⏭️  Skipped: ${skipped} tables`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

runMigration().catch(err => {
    console.error(err);
    process.exit(1);
});
