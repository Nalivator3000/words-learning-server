const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('=== global_word_collections SCHEMA ===\n');
    const collectionsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'global_word_collections'
      ORDER BY ordinal_position
    `);

    collectionsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n=== global_collection_words SCHEMA ===\n');
    const wordsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'global_collection_words'
      ORDER BY ordinal_position
    `);

    wordsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n=== SAMPLE DATA ===\n');

    const sampleCollections = await client.query(`
      SELECT * FROM global_word_collections LIMIT 3
    `);
    console.log('Sample collections:');
    console.log(JSON.stringify(sampleCollections.rows, null, 2));

    const sampleWords = await client.query(`
      SELECT * FROM global_collection_words LIMIT 3
    `);
    console.log('\nSample words:');
    console.log(JSON.stringify(sampleWords.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
