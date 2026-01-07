require('dotenv').config();
const { Client } = require('pg');

async function listRealWords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    console.log('✅ All real Hindi words (without _N pattern):');
    const real = await client.query(`
      SELECT id, word, level, theme, pos
      FROM source_words_hindi
      WHERE word !~ '_[0-9]'
      ORDER BY id
    `);

    console.log(`Total: ${real.rows.length}\n`);
    real.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. [${row.id}] ${row.word} - Level: ${row.level}, Theme: ${row.theme}, POS: ${row.pos || 'null'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listRealWords();
