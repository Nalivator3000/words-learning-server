#!/usr/bin/env node
/**
 * Test if translation script can connect to Railway DB
 */

const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

console.log('Testing translation script setup...\n');

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
});

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');

        const client = await db.connect();
        console.log('✅ Connection established');

        const result = await client.query('SELECT NOW(), version()');
        console.log('✅ Database time:', result.rows[0].now);
        console.log('✅ PostgreSQL version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);

        // Test source words
        const wordsResult = await client.query('SELECT COUNT(*) FROM source_words_german');
        console.log(`✅ German words: ${wordsResult.rows[0].count}`);

        // Check translation table
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'target_translations_japanese'
            )
        `);

        if (tableCheck.rows[0].exists) {
            const transResult = await client.query('SELECT COUNT(*) FROM target_translations_japanese');
            console.log(`✅ Japanese translations: ${transResult.rows[0].count}`);
        } else {
            console.log('⚠️  target_translations_japanese table does not exist');
        }

        // Check progress of different language pairs
        console.log('\n📊 Translation Progress:');
        const pairs = [
            { source: 'german', target: 'japanese', table: 'target_translations_japanese' },
            { source: 'german', target: 'korean', table: 'target_translations_korean' },
            { source: 'german', target: 'hindi', table: 'target_translations_hindi' },
            { source: 'english', target: 'japanese_from_en', table: 'target_translations_japanese_from_en' }
        ];

        for (const pair of pairs) {
            const checkTable = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = $1
                )
            `, [pair.table]);

            if (checkTable.rows[0].exists) {
                const count = await client.query(`SELECT COUNT(*) FROM ${pair.table}`);
                const sourceCount = await client.query(`SELECT COUNT(*) FROM source_words_${pair.source}`);
                const percent = ((count.rows[0].count / sourceCount.rows[0].count) * 100).toFixed(1);
                console.log(`  ${pair.source} → ${pair.target}: ${count.rows[0].count}/${sourceCount.rows[0].count} (${percent}%)`);
            } else {
                console.log(`  ${pair.source} → ${pair.target}: Table not created yet (0%)`);
            }
        }

        client.release();
        await db.end();
        console.log('\n✅ All tests passed!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error code:', error.code);
        await db.end();
        process.exit(1);
    }
}

testConnection();
