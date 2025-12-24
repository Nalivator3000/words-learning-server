#!/usr/bin/env node
/**
 * Migration: Add UNIQUE constraints to source_words_english and source_words_spanish
 * This enables ON CONFLICT handling in import scripts
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔧 Starting UNIQUE constraints migration...\n');

        // Add UNIQUE constraint to source_words_english
        console.log('📝 Adding UNIQUE constraint to source_words_english...');
        try {
            await db.query(`
                ALTER TABLE source_words_english
                ADD CONSTRAINT source_words_english_word_key UNIQUE (word)
            `);
            console.log('✅ Added UNIQUE constraint to source_words_english\n');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('⚠️  Constraint already exists on source_words_english\n');
            } else {
                throw err;
            }
        }

        // Add UNIQUE constraint to source_words_spanish
        console.log('📝 Adding UNIQUE constraint to source_words_spanish...');
        try {
            await db.query(`
                ALTER TABLE source_words_spanish
                ADD CONSTRAINT source_words_spanish_word_key UNIQUE (word)
            `);
            console.log('✅ Added UNIQUE constraint to source_words_spanish\n');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('⚠️  Constraint already exists on source_words_spanish\n');
            } else {
                throw err;
            }
        }

        // Verify constraints
        console.log('🔍 Verifying constraints...\n');

        const checkEn = await db.query(`
            SELECT constraint_name, table_name
            FROM information_schema.table_constraints
            WHERE table_name = 'source_words_english'
            AND constraint_type = 'UNIQUE'
        `);

        const checkEs = await db.query(`
            SELECT constraint_name, table_name
            FROM information_schema.table_constraints
            WHERE table_name = 'source_words_spanish'
            AND constraint_type = 'UNIQUE'
        `);

        console.log('English constraints:');
        console.table(checkEn.rows);

        console.log('\nSpanish constraints:');
        console.table(checkEs.rows);

        console.log('\n✅ Migration completed successfully!\n');

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
