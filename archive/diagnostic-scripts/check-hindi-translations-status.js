#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkHindiTranslations() {
    try {
        console.log('='.repeat(60));
        console.log('🔍 CHECKING HINDI TRANSLATIONS STATUS');
        console.log('='.repeat(60) + '\n');

        // Check if table exists
        const translationsTable = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'target_translations_english_from_hi'
            )
        `);

        if (!translationsTable.rows[0].exists) {
            console.log('❌ Translation table does not exist!');
            await db.end();
            return;
        }

        // Get columns
        const cols = await db.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'target_translations_english_from_hi'
            ORDER BY ordinal_position
        `);

        console.log('📋 Translation table columns:');
        cols.rows.forEach(r => console.log('  - ' + r.column_name));

        // Get stats
        const stats = await db.query(`
            SELECT
                COUNT(*) as total,
                COUNT(translation) FILTER (WHERE translation IS NOT NULL AND translation != '') as translated,
                COUNT(translation) FILTER (WHERE translation IS NULL OR translation = '') as empty
            FROM target_translations_english_from_hi
        `);

        console.log('\n📊 Translation stats:');
        console.log('  Total rows:', stats.rows[0].total);
        console.log('  Translated:', stats.rows[0].translated);
        console.log('  Empty:', stats.rows[0].empty);

        if (parseInt(stats.rows[0].translated) > 0) {
            const sample = await db.query(`
                SELECT source_word_id, translation
                FROM target_translations_english_from_hi
                WHERE translation IS NOT NULL AND translation != ''
                LIMIT 5
            `);

            console.log('\n📝 Sample translations:');
            for (const row of sample.rows) {
                const word = await db.query(
                    'SELECT word FROM source_words_hindi WHERE id = $1',
                    [row.source_word_id]
                );
                if (word.rows.length > 0) {
                    console.log('  ' + word.rows[0].word + ' → ' + row.translation);
                }
            }
        }

        // Check for placeholders
        const placeholders = await db.query(`
            SELECT COUNT(*) as count
            FROM target_translations_english_from_hi
            WHERE translation LIKE '%[Translation for%'
               OR translation LIKE '%Placeholder%'
        `);

        console.log('\n⚠️  Placeholder translations:', placeholders.rows[0].count);

        await db.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await db.end();
    }
}

checkHindiTranslations();
