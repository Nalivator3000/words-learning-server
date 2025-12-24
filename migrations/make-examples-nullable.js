#!/usr/bin/env node
/**
 * Migration: Make example_en and example_es columns nullable
 * We don't have examples for frequency-imported words yet
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔧 Starting nullable examples migration...\n');

        // Make example_en nullable
        console.log('📝 Making example_en nullable in source_words_english...');
        await db.query(`
            ALTER TABLE source_words_english
            ALTER COLUMN example_en DROP NOT NULL
        `);
        console.log('✅ example_en is now nullable\n');

        // Make example_es nullable
        console.log('📝 Making example_es nullable in source_words_spanish...');
        await db.query(`
            ALTER TABLE source_words_spanish
            ALTER COLUMN example_es DROP NOT NULL
        `);
        console.log('✅ example_es is now nullable\n');

        console.log('✅ Migration completed successfully!\n');

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
