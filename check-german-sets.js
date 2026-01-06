const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    // Check German A2 word sets
    const result = await db.query(`
        SELECT id, title, source_language, level, word_count
        FROM word_sets
        WHERE source_language = 'german' AND level = 'A2'
        ORDER BY id
        LIMIT 10
    `);
    
    console.log(`Found ${result.rows.length} German A2 word sets:`);
    result.rows.forEach(set => {
        console.log(`  ${set.id}: ${set.title} (${set.word_count} words)`);
    });
    
    await db.end();
}

check().catch(console.error);
