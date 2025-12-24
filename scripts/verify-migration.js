const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function verifyMigration() {
  const client = await pool.connect();

  try {
    console.log('📊 Migration Verification:\n');

    const germanCount = await client.query('SELECT COUNT(*) FROM source_words_german');
    console.log('✅ German words (source_words_german):', germanCount.rows[0].count);

    const russianCount = await client.query(`SELECT COUNT(*) FROM target_translations_russian WHERE source_lang = 'de'`);
    console.log('✅ Russian translations (target_translations_russian):', russianCount.rows[0].count);

    const collectionsCount = await client.query(`SELECT COUNT(*) FROM universal_collections WHERE source_lang = 'de'`);
    console.log('✅ Universal collections:', collectionsCount.rows[0].count);

    const collectionWordsCount = await client.query('SELECT COUNT(*) FROM universal_collection_words');
    console.log('✅ Collection word links:', collectionWordsCount.rows[0].count);

    console.log('\n🧪 Test Query (Sample A1 de-ru pairs):\n');
    const testQuery = await client.query(`
      SELECT
        sw.word as german,
        tr.translation as russian,
        sw.level,
        sw.theme
      FROM source_words_german sw
      JOIN target_translations_russian tr
        ON tr.source_lang = 'de' AND tr.source_word_id = sw.id
      WHERE sw.level = 'A1'
      LIMIT 5
    `);

    testQuery.rows.forEach(row => {
      console.log(`  ${row.german} → ${row.russian} (${row.level}, ${row.theme || 'general'})`);
    });

    console.log('\n🧪 Collection Test (Sample collection with words):\n');
    const collectionTest = await client.query(`
      SELECT
        c.name as collection_name,
        c.word_count,
        COUNT(ucw.id) as actual_words
      FROM universal_collections c
      LEFT JOIN universal_collection_words ucw ON ucw.collection_id = c.id
      WHERE c.source_lang = 'de'
      GROUP BY c.id, c.name, c.word_count
      LIMIT 3
    `);

    collectionTest.rows.forEach(row => {
      console.log(`  ${row.collection_name}: ${row.actual_words} words (expected: ${row.word_count})`);
    });

    console.log('\n✅ Migration verification complete!');

  } catch (err) {
    console.error('❌ Verification error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
