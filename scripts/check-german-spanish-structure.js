const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Checking how German/Spanish store examples\n');

    // Check target_translations_german_from_en
    console.log('1️⃣ target_translations_german_from_en:');
    let columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'target_translations_german_from_en'
        AND column_name LIKE '%example%'
        ORDER BY ordinal_position
    `);

    columns.rows.forEach(c => {
        console.log(`      - ${c.column_name}: ${c.data_type}`);
    });

    // Check target_translations_spanish_from_en
    console.log('\n2️⃣ target_translations_spanish_from_en:');
    columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'target_translations_spanish_from_en'
        AND column_name LIKE '%example%'
        ORDER BY ordinal_position
    `);

    columns.rows.forEach(c => {
        console.log(`      - ${c.column_name}: ${c.data_type}`);
    });

    // Sample data from German
    console.log('\n3️⃣ Sample from target_translations_german_from_en:');
    const germanSample = await client.query(`
        SELECT id, source_word_id, translation, example_native
        FROM target_translations_german_from_en
        LIMIT 3
    `);

    germanSample.rows.forEach(row => {
        console.log(`   Row ${row.id}: word_id=${row.source_word_id}, translation="${row.translation}", example_native="${row.example_native ? row.example_native.substring(0, 40) : 'NULL'}"`);
    });

    await client.end();
}

debug().catch(console.error);
