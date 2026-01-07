require('dotenv').config();
const { Client } = require('pg');

async function checkHindiWords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📖 Words from Hindi word set 11492 (Part 1 of 20):');
    const words = await client.query(`
      SELECT sw.id, sw.word, sw.translation, sw.part_of_speech, sw.example
      FROM word_set_items wsi
      JOIN source_words_hindi sw ON wsi.word_id = sw.id
      WHERE wsi.word_set_id = 11492
      ORDER BY wsi.order_index
      LIMIT 20
    `);

    console.log(`Total words shown: ${words.rows.length}`);
    let placeholderCount = 0;

    words.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. [${row.id}] ${row.word} → ${row.translation}`);
      console.log(`   POS: ${row.part_of_speech || 'null'}`);

      if (row.word && row.word.includes('_')) {
        console.log('   ⚠️  WARNING: This is a PLACEHOLDER!');
        placeholderCount++;
      }

      if (row.example) {
        const examplePreview = row.example.length > 60
          ? row.example.substring(0, 60) + '...'
          : row.example;
        console.log(`   Example: ${examplePreview}`);
      } else {
        console.log(`   Example: null`);
      }
    });

    console.log(`\n\n📊 Summary:`);
    console.log(`  Total words checked: ${words.rows.length}`);
    console.log(`  Placeholder words: ${placeholderCount}`);
    console.log(`  Real words: ${words.rows.length - placeholderCount}`);

    if (placeholderCount > 0) {
      console.log('\n⚠️  ISSUE DETECTED: Word set contains placeholders instead of actual Hindi words!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkHindiWords();
