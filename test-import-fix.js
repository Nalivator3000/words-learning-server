const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testImportFix() {
    try {
        console.log('🔍 Testing import fix...\n');

        // Find a word set with theme='general' and word_count=50
        const setResult = await db.query(`
            SELECT id, title, source_language, level, theme, word_count
            FROM word_sets
            WHERE theme = 'general' AND word_count = 50
            LIMIT 1
        `);

        if (setResult.rows.length === 0) {
            console.log('❌ No word set with theme=general and word_count=50 found');
            return;
        }

        const wordSet = setResult.rows[0];
        console.log('📚 Testing with word set:');
        console.log(`   ID: ${wordSet.id}`);
        console.log(`   Title: ${wordSet.title}`);
        console.log(`   Source language: ${wordSet.source_language}`);
        console.log(`   Level: ${wordSet.level}`);
        console.log(`   Theme: ${wordSet.theme}`);
        console.log(`   Word count (metadata): ${wordSet.word_count}\n`);

        // Count how many words would be imported WITHOUT limit
        const sourceTableName = `source_words_${wordSet.source_language}`;

        const countWithoutLimit = await db.query(`
            SELECT COUNT(*) as count
            FROM ${sourceTableName}
            WHERE level = $1
        `, [wordSet.level]);

        console.log(`📊 Words in source table with level=${wordSet.level}: ${countWithoutLimit.rows[0].count}`);

        // Count how many words would be imported WITH limit
        const countWithLimit = await db.query(`
            SELECT COUNT(*) as count
            FROM (
                SELECT id
                FROM ${sourceTableName}
                WHERE level = $1
                ORDER BY id ASC
                LIMIT ${parseInt(wordSet.word_count)}
            ) subquery
        `, [wordSet.level]);

        console.log(`📊 Words that will be imported WITH LIMIT ${wordSet.word_count}: ${countWithLimit.rows[0].count}\n`);

        if (parseInt(countWithLimit.rows[0].count) === parseInt(wordSet.word_count)) {
            console.log('✅ FIX WORKS! Import will now add exactly', wordSet.word_count, 'words instead of', countWithoutLimit.rows[0].count);
        } else {
            console.log('❌ Something is wrong');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

testImportFix();
