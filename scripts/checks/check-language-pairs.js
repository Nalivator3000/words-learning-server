#!/usr/bin/env node
/**
 * Check current state of language_pairs table
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkLanguagePairs() {
    try {
        console.log('📊 Current language pairs in database:\n');

        const result = await db.query(`
            SELECT id, user_id, name, from_lang, to_lang, is_active
            FROM language_pairs
            ORDER BY id
        `);

        console.table(result.rows);

        console.log(`\nTotal language pairs: ${result.rows.length}`);

        // Check for any that still have full names instead of codes
        const wrongFormat = result.rows.filter(row =>
            row.from_lang.length > 2 || row.to_lang.length > 2
        );

        if (wrongFormat.length > 0) {
            console.log('\n⚠️  Language pairs still using full names (need migration):');
            console.table(wrongFormat);
        } else {
            console.log('\n✅ All language pairs use ISO codes');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await db.end();
    }
}

checkLanguagePairs().catch(err => {
    console.error(err);
    process.exit(1);
});
