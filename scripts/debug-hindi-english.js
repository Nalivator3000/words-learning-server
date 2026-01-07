const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debug() {
    await client.connect();

    console.log('🔍 Debugging Hindi → English language pair\n');

    // Check if source_words_hindi table exists
    console.log('1️⃣ Checking source_words_hindi table:');
    const hindiTable = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'source_words_hindi'
        ORDER BY ordinal_position
    `);

    if (hindiTable.rows.length > 0) {
        console.log('✅ source_words_hindi exists with columns:');
        hindiTable.rows.forEach(c => {
            console.log(`   - ${c.column_name}: ${c.data_type}`);
        });
    } else {
        console.log('❌ source_words_hindi does NOT exist');
    }

    // Check target_translations_english table
    console.log('\n2️⃣ Checking target_translations_english table:');
    const englishTable = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'target_translations_english'
        ORDER BY ordinal_position
    `);

    if (englishTable.rows.length > 0) {
        console.log('✅ target_translations_english exists with columns:');
        englishTable.rows.forEach(c => {
            console.log(`   - ${c.column_name}: ${c.data_type}`);
        });
    } else {
        console.log('❌ target_translations_english does NOT exist');
    }

    // Check what translation tables exist for Hindi source
    console.log('\n3️⃣ Checking all translation tables:');
    const translationTables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%translation%'
        ORDER BY table_name
    `);

    console.log('All translation tables:');
    translationTables.rows.forEach(t => {
        console.log(`   - ${t.table_name}`);
    });

    await client.end();
}

debug().catch(console.error);
