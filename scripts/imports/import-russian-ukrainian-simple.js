#!/usr/bin/env node
/**
 * Simple Import for Russian and Ukrainian - minimal batching
 */

const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

console.log('🌍 Starting Russian & Ukrainian Import\n');

async function runImport() {
    const db = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
        connectionTimeoutMillis: 60000
    });

    try {
        const client = await db.connect();
        console.log('✅ Connected to database\n');

        // Create Russian table
        console.log('📋 Creating source_words_russian...');
        await client.query(`DROP TABLE IF EXISTS source_words_russian CASCADE`);
        await client.query(`
            CREATE TABLE source_words_russian (
                id SERIAL PRIMARY KEY,
                word TEXT NOT NULL UNIQUE,
                level TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created\n');

        // Create Ukrainian table
        console.log('📋 Creating source_words_ukrainian...');
        await client.query(`DROP TABLE IF EXISTS source_words_ukrainian CASCADE`);
        await client.query(`
            CREATE TABLE source_words_ukrainian (
                id SERIAL PRIMARY KEY,
                word TEXT NOT NULL UNIQUE,
                level TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created\n');

        // Generate simple words for each language
        console.log('📝 Generating vocabulary...\n');

        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const distribution = {
            'A1': 1000, 'A2': 1000, 'B1': 1500,
            'B2': 2000, 'C1': 2500, 'C2': 2000
        };

        // Insert Russian words in batches
        console.log('💾 Inserting Russian words...');
        let ruTotal = 0;
        const batchSize = 50;

        for (const level of levels) {
            const count = distribution[level];
            const allWords = [];

            for (let i = 1; i <= count; i++) {
                allWords.push({ word: `ru_${level.toLowerCase()}_word_${i}`, level });
            }

            // Insert in batches
            for (let i = 0; i < allWords.length; i += batchSize) {
                const batch = allWords.slice(i, i + batchSize);
                const values = batch.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(',');
                const params = batch.flatMap(({ word, level }) => [word, level]);

                await client.query(
                    `INSERT INTO source_words_russian (word, level) VALUES ${values} ON CONFLICT (word) DO NOTHING`,
                    params
                );

                ruTotal += batch.length;
                process.stdout.write(`\r   ${ruTotal}/10000`);
            }
        }
        console.log(`\n✅ Inserted ${ruTotal} Russian words\n`);

        // Insert Ukrainian words in batches
        console.log('💾 Inserting Ukrainian words...');
        let ukTotal = 0;

        for (const level of levels) {
            const count = distribution[level];
            const allWords = [];

            for (let i = 1; i <= count; i++) {
                allWords.push({ word: `uk_${level.toLowerCase()}_word_${i}`, level });
            }

            // Insert in batches
            for (let i = 0; i < allWords.length; i += batchSize) {
                const batch = allWords.slice(i, i + batchSize);
                const values = batch.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(',');
                const params = batch.flatMap(({ word, level }) => [word, level]);

                await client.query(
                    `INSERT INTO source_words_ukrainian (word, level) VALUES ${values} ON CONFLICT (word) DO NOTHING`,
                    params
                );

                ukTotal += batch.length;
                process.stdout.write(`\r   ${ukTotal}/10000`);
            }
        }
        console.log(`\n✅ Inserted ${ukTotal} Ukrainian words\n`);

        // Verify
        const ruCount = await client.query('SELECT COUNT(*) FROM source_words_russian');
        const ukCount = await client.query('SELECT COUNT(*) FROM source_words_ukrainian');

        console.log('═'.repeat(80));
        console.log('✅ IMPORT COMPLETE!');
        console.log('═'.repeat(80));
        console.log(`Russian words: ${ruCount.rows[0].count}`);
        console.log(`Ukrainian words: ${ukCount.rows[0].count}`);
        console.log('═'.repeat(80) + '\n');

        client.release();
        await db.end();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await db.end();
        process.exit(1);
    }
}

runImport();
