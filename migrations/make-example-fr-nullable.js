#!/usr/bin/env node
/**
 * Migration: Make example_fr column nullable in source_words_french
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔧 Starting nullable example_fr migration...\n');

        console.log('📝 Making example_fr nullable in source_words_french...');
        await db.query(`
            ALTER TABLE source_words_french
            ALTER COLUMN example_fr DROP NOT NULL
        `);
        console.log('✅ example_fr is now nullable\n');

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
