#!/usr/bin/env node
/**
 * Migration: Add UNIQUE constraint to source_words_french
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔧 Starting UNIQUE constraint migration for French...\n');

        await db.query(`
            ALTER TABLE source_words_french
            ADD CONSTRAINT source_words_french_word_key UNIQUE (word)
        `);
        console.log('✅ Added UNIQUE constraint to source_words_french\n');

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
