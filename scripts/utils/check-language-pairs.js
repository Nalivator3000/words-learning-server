#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

(async () => {
    // First check schema
    const schema = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'language_pairs'
        ORDER BY ordinal_position
    `);

    console.log('Schema language_pairs:');
    schema.rows.forEach(c => console.log(`  - ${c.column_name}`));

    // Then get pairs with correct column names
    const pairs = await db.query(`
        SELECT * FROM language_pairs WHERE user_id = 1 ORDER BY id
    `);

    console.log('\nЯзыковые пары пользователя:');
    pairs.rows.forEach(p => {
        console.log(`  ID: ${p.id} | Name: ${p.name} | ${p.from_lang} → ${p.to_lang}`);
    });

    await db.end();
})();
