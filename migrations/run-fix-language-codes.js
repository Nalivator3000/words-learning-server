#!/usr/bin/env node
/**
 * Migration: Fix language pair codes
 * Converts full language names to ISO codes in language_pairs table
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔧 Starting language pair codes migration...\n');

        // Check current state
        console.log('📊 Current language pairs:');
        const before = await db.query('SELECT id, user_id, name, from_lang, to_lang FROM language_pairs ORDER BY id');
        console.table(before.rows);

        // Run migration
        console.log('\n🚀 Applying migration...');
        const result = await db.query(`
            UPDATE language_pairs
            SET from_lang = CASE from_lang
                WHEN 'German' THEN 'de'
                WHEN 'Russian' THEN 'ru'
                WHEN 'English' THEN 'en'
                WHEN 'Spanish' THEN 'es'
                WHEN 'French' THEN 'fr'
                WHEN 'Italian' THEN 'it'
                WHEN 'Portuguese' THEN 'pt'
                WHEN 'Polish' THEN 'pl'
                WHEN 'Arabic' THEN 'ar'
                WHEN 'Turkish' THEN 'tr'
                WHEN 'Romanian' THEN 'ro'
                WHEN 'Serbian' THEN 'sr'
                WHEN 'Ukrainian' THEN 'uk'
                WHEN 'Swahili' THEN 'sw'
                ELSE from_lang
            END,
            to_lang = CASE to_lang
                WHEN 'German' THEN 'de'
                WHEN 'Russian' THEN 'ru'
                WHEN 'English' THEN 'en'
                WHEN 'Spanish' THEN 'es'
                WHEN 'French' THEN 'fr'
                WHEN 'Italian' THEN 'it'
                WHEN 'Portuguese' THEN 'pt'
                WHEN 'Polish' THEN 'pl'
                WHEN 'Arabic' THEN 'ar'
                WHEN 'Turkish' THEN 'tr'
                WHEN 'Romanian' THEN 'ro'
                WHEN 'Serbian' THEN 'sr'
                WHEN 'Ukrainian' THEN 'uk'
                WHEN 'Swahili' THEN 'sw'
                ELSE to_lang
            END
            WHERE from_lang IN ('German', 'Russian', 'English', 'Spanish', 'French', 'Italian', 'Portuguese', 'Polish', 'Arabic', 'Turkish', 'Romanian', 'Serbian', 'Ukrainian', 'Swahili')
               OR to_lang IN ('German', 'Russian', 'English', 'Spanish', 'French', 'Italian', 'Portuguese', 'Polish', 'Arabic', 'Turkish', 'Romanian', 'Serbian', 'Ukrainian', 'Swahili')
        `);

        console.log(`✅ Updated ${result.rowCount} language pairs\n`);

        // Check after migration
        console.log('📊 Language pairs after migration:');
        const after = await db.query('SELECT id, user_id, name, from_lang, to_lang FROM language_pairs ORDER BY id');
        console.table(after.rows);

        console.log('\n✅ Migration completed successfully!');

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
