const { Client } = require('pg');

async function checkStructure() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Show sample words
    const words = await client.query('SELECT * FROM words LIMIT 5');
    console.log('📋 Sample words:');
    console.log(JSON.stringify(words.rows, null, 2));

    // Check language pairs
    const pairs = await client.query(`
      SELECT lp.id, lp.sourcelanguage, lp.targetlanguage, COUNT(w.id) as word_count
      FROM languagepairs lp
      LEFT JOIN words w ON w.language_pair_id = lp.id
      GROUP BY lp.id, lp.sourcelanguage, lp.targetlanguage
      ORDER BY word_count DESC
    `);

    console.log('\n📊 Language pairs with word counts:');
    pairs.rows.forEach(p => {
      console.log(`  ${p.sourcelanguage} → ${p.targetlanguage}: ${p.word_count} words (pair_id: ${p.id})`);
    });

    // Check if there are any source_words tables
    const sourceTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name LIKE 'source_words_%'
      ORDER BY table_name
    `);

    console.log('\n📋 Source words tables:');
    sourceTables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkStructure();
