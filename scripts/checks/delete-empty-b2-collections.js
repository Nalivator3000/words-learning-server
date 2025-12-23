const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function deleteEmpty() {
  const client = await pool.connect();

  try {
    // Delete collections with ID >= 66 that have no words
    const result = await client.query(`
      DELETE FROM global_word_collections
      WHERE id >= 66
      AND id NOT IN (
        SELECT DISTINCT collection_id
        FROM global_collection_words
        WHERE collection_id >= 66
      )
      RETURNING id, name
    `);

    console.log('Deleted empty collections:');
    result.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.name}`);
    });
    console.log(`\nTotal deleted: ${result.rows.length}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteEmpty();
