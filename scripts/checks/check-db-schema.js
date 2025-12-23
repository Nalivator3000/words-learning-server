const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('=== DATABASE TABLES ===\n');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    tables.rows.forEach(row => console.log('  -', row.table_name));

    console.log('\n=== CHECKING FOR VOCABULARY TABLES ===\n');

    // Check for different possible table names
    const possibleTables = [
      'global_collections',
      'collections',
      'vocabulary_collections',
      'word_collections',
      'global_collection_words',
      'words',
      'vocabulary',
      'collection_words'
    ];

    for (const tableName of possibleTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName} LIMIT 1`);
        console.log(`✅ Table "${tableName}" exists - ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`❌ Table "${tableName}" does not exist`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
