require('dotenv').config();
const { Client } = require('pg');

async function analyzePlaceholders() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📊 Source words Hindi statistics:');
    const total = await client.query('SELECT COUNT(*) as count FROM source_words_hindi');
    console.log(`Total: ${total.rows[0].count}`);

    const placeholders = await client.query(`
      SELECT COUNT(*) as count FROM source_words_hindi WHERE word LIKE '%\__%'
    `);
    const realWords = total.rows[0].count - placeholders.rows[0].count;
    console.log(`Placeholders: ${placeholders.rows[0].count}`);
    console.log(`Real words: ${realWords}`);
    console.log(`Percentage of placeholders: ${(placeholders.rows[0].count / total.rows[0].count * 100).toFixed(2)}%`);

    console.log('\n✅ Real Hindi words (no underscores):');
    const real = await client.query(`
      SELECT id, word, level, theme, pos
      FROM source_words_hindi
      WHERE word NOT LIKE '%\__%'
      ORDER BY id
      LIMIT 30
    `);
    real.rows.forEach(row => {
      console.log(`  [${row.id}] ${row.word} (${row.level}, ${row.theme}, POS: ${row.pos || 'null'})`);
    });

    console.log('\n⚠️  Sample placeholders:');
    const samplePlaceholders = await client.query(`
      SELECT id, word, level, theme
      FROM source_words_hindi
      WHERE word LIKE '%\__%'
      ORDER BY id
      LIMIT 20
    `);
    samplePlaceholders.rows.forEach(row => {
      console.log(`  [${row.id}] ${row.word} (${row.level}, ${row.theme})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

analyzePlaceholders();
