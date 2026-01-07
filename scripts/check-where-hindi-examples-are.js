const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Where are Hindi examples stored for Hindi→English?\n');

    // Check target_translations_english_from_hi for example columns
    console.log('1️⃣ Checking target_translations_english_from_hi:');
    const columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'target_translations_english_from_hi'
        AND column_name LIKE '%example%'
        ORDER BY ordinal_position
    `);

    if (columns.rows.length > 0) {
        console.log('   Example columns found:');
        columns.rows.forEach(c => {
            console.log(`      - ${c.column_name}: ${c.data_type}`);
        });
    } else {
        console.log('   ❌ No example columns');
    }

    // Check target_translations_english for example columns
    console.log('\n2️⃣ Checking target_translations_english (base):');
    const baseColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'target_translations_english'
        AND column_name LIKE '%example%'
        ORDER BY ordinal_position
    `);

    if (baseColumns.rows.length > 0) {
        console.log('   Example columns found:');
        baseColumns.rows.forEach(c => {
            console.log(`      - ${c.column_name}: ${c.data_type}`);
        });
    } else {
        console.log('   ❌ No example columns');
    }

    // Check if there's sample data
    console.log('\n3️⃣ Sample data from target_translations_english_from_hi:');
    const sample = await client.query(`
        SELECT id, source_word_id, translation, example_en
        FROM target_translations_english_from_hi
        LIMIT 3
    `);

    sample.rows.forEach(row => {
        console.log(`   Row ${row.id}:`);
        console.log(`      source_word_id: ${row.source_word_id}`);
        console.log(`      translation: ${row.translation}`);
        console.log(`      example_en: ${row.example_en ? row.example_en.substring(0, 50) + '...' : 'NULL'}`);
    });

    await client.end();
}

debug().catch(console.error);
