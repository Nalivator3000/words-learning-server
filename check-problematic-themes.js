const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkThemes() {
    const client = await pool.connect();
    try {
        const languages = ['japanese', 'swahili', 'hindi'];

        for (const lang of languages) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`${lang.toUpperCase()}`);
            console.log('='.repeat(60));

            const res = await client.query(`
                SELECT theme, COUNT(*) as cnt
                FROM ${lang}_source_words
                GROUP BY theme
                ORDER BY cnt DESC
                LIMIT 20
            `);

            res.rows.forEach(r => {
                console.log(`  ${r.theme || 'NULL'}: ${r.cnt} слов`);
            });
        }

    } finally {
        client.release();
        await pool.end();
    }
}

checkThemes().catch(console.error);
