const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking ru→de collections setup...\n');

    // Check universal_collections table
    const collections = await client.query(`
      SELECT id, name, source_lang, level, word_count, is_public
      FROM universal_collections
      WHERE source_lang = 'de'
      ORDER BY level, created_at
      LIMIT 5
    `);

    console.log('📚 Sample universal_collections (de source):');
    console.log('='.repeat(70));
    collections.rows.forEach(c => {
      console.log(`  ID: ${c.id} | ${c.level} | ${c.name.substring(0, 40)}...`);
      console.log(`       Words: ${c.word_count} | Public: ${c.is_public}`);
    });

    // Check if we have Russian translations
    const ruTranslations = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_russian WHERE source_lang = 'de'
    `);
    console.log(`\n✅ Russian translations available: ${parseInt(ruTranslations.rows[0].count).toLocaleString()}`);

    // Check source_words_german
    const sourceWords = await client.query('SELECT COUNT(*) as count FROM source_words_german');
    console.log(`✅ Source German words: ${parseInt(sourceWords.rows[0].count).toLocaleString()}`);

    // Check total collections count
    const totalCollections = await client.query(`
      SELECT COUNT(*) as count FROM universal_collections WHERE source_lang = 'de' AND is_public = true
    `);
    console.log(`✅ Total public de collections: ${parseInt(totalCollections.rows[0].count).toLocaleString()}`);

    console.log('\n' + '='.repeat(70));
    console.log('❌ PROBLEM: API endpoints are using old table structure!');
    console.log('   Current API uses: global_word_collections (old)');
    console.log('   Data is stored in: universal_collections (new)');
    console.log('   Need to: Add new API endpoints for universal_collections');

  } finally {
    client.release();
    await pool.end();
  }
}

check();
