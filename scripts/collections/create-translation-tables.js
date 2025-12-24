const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating translation tables for all target languages...\n');

    const sql = fs.readFileSync('migrations/create-translation-tables.sql', 'utf8');

    await client.query(sql);

    console.log('✅ Created translation tables:');
    console.log('   - target_translations_english (en→de)');
    console.log('   - target_translations_romanian (ro→de)');
    console.log('   - target_translations_serbian (sr→de)');
    console.log('   - target_translations_ukrainian (uk→de)');
    console.log('   - target_translations_turkish (tr→de)');
    console.log('   - target_translations_arabic (ar→de)');
    console.log('   - target_translations_swahili (sw→de)');
    console.log('   - target_translations_polish (pl→de)');

    console.log('\n✅ All tables created successfully!');

  } catch (err) {
    console.error('❌ Error creating tables:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
