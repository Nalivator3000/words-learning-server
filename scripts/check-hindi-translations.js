require('dotenv').config();
const { Client } = require('pg');

async function checkTranslations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    console.log('📖 Real Hindi words with their English translations:\n');
    const words = await client.query(`
      SELECT
        sw.id,
        sw.word,
        sw.level,
        sw.theme,
        tt.translation,
        tt.example_en
      FROM source_words_hindi sw
      LEFT JOIN target_translations_english_from_hi tt ON sw.id = tt.source_word_id
      WHERE sw.word !~ '_[0-9]'
      ORDER BY sw.id
    `);

    words.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. [${row.id}] ${row.word} → ${row.translation || 'NO TRANSLATION'}`);
      console.log(`   Level: ${row.level}, Theme: ${row.theme}`);
      if (row.example_en) {
        console.log(`   Example: ${row.example_en.substring(0, 60)}...`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTranslations();
