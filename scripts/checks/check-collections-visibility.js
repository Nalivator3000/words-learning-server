const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkCollections() {
  const client = await pool.connect();
  try {
    console.log('📊 Checking German collections visibility and status...\n');

    // Check universal collections
    const collections = await client.query(`
      SELECT
        name,
        description,
        level,
        is_public,
        word_count,
        created_at
      FROM universal_collections
      WHERE source_lang = 'de'
      ORDER BY
        CASE level
          WHEN 'beginner' THEN 0
          WHEN 'A1' THEN 1
          WHEN 'A2' THEN 2
          WHEN 'B1' THEN 3
          WHEN 'B2' THEN 4
          WHEN 'C1' THEN 5
          WHEN 'C2' THEN 6
          ELSE 99
        END,
        created_at DESC
      LIMIT 20
    `);

    console.log('Latest 20 German collections:');
    console.log('='.repeat(80));

    collections.rows.forEach((col, i) => {
      const status = col.is_public ? '✅ PUBLIC' : '🔒 PRIVATE';
      console.log(`${i + 1}. [${col.level}] ${col.name}`);
      console.log(`   Status: ${status} | Words: ${col.word_count}`);
      console.log(`   Description: ${col.description.substring(0, 60)}...`);
      console.log();
    });

    // Check public vs private counts
    const stats = await client.query(`
      SELECT
        is_public,
        level,
        COUNT(*) as count,
        SUM(word_count) as total_words
      FROM universal_collections
      WHERE source_lang = 'de'
      GROUP BY is_public, level
      ORDER BY is_public DESC, level
    `);

    console.log('='.repeat(80));
    console.log('Visibility Statistics:');
    console.log('='.repeat(80));

    let publicCollections = 0;
    let privateCollections = 0;
    let publicWords = 0;
    let privateWords = 0;

    stats.rows.forEach(row => {
      const visibility = row.is_public ? 'PUBLIC' : 'PRIVATE';
      console.log(`${visibility} | ${row.level}: ${row.count} collections, ${row.total_words} words`);

      if (row.is_public) {
        publicCollections += parseInt(row.count);
        publicWords += parseInt(row.total_words);
      } else {
        privateCollections += parseInt(row.count);
        privateWords += parseInt(row.total_words);
      }
    });

    console.log('='.repeat(80));
    console.log(`TOTAL PUBLIC: ${publicCollections} collections, ${publicWords} words`);
    console.log(`TOTAL PRIVATE: ${privateCollections} collections, ${privateWords} words`);

    if (privateCollections > 0) {
      console.log('\n⚠️  WARNING: Some collections are PRIVATE and not visible to users!');
      console.log('Run this to make all collections public:');
      console.log("UPDATE universal_collections SET is_public = true WHERE source_lang = 'de';");
    } else {
      console.log('\n✅ All collections are PUBLIC');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkCollections();
