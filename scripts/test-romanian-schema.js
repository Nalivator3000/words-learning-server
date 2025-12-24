const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function testSchema() {
  const client = await pool.connect();

  try {
    // Check Romanian table structure
    console.log('=== target_translations_romanian structure ===\n');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'target_translations_romanian'
      ORDER BY ordinal_position
    `);

    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Count existing Romanian translations
    console.log('\n=== Current Romanian translations ===\n');
    const count = await client.query('SELECT COUNT(*) FROM target_translations_romanian');
    console.log(`  Total: ${count.rows[0].count}`);

    // Count German words
    console.log('\n=== German source words ===\n');
    const germanCount = await client.query('SELECT COUNT(*) FROM source_words_german');
    console.log(`  Total: ${germanCount.rows[0].count}`);

    // Sample record
    console.log('\n=== Sample Romanian translation ===\n');
    const sample = await client.query('SELECT * FROM target_translations_romanian LIMIT 1');
    if (sample.rows.length > 0) {
      console.log(sample.rows[0]);
    } else {
      console.log('  No records found');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testSchema();
