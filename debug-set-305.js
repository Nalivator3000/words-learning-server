require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugSet305() {
  const client = await pool.connect();

  try {
    console.log('=== DEBUGGING SET 305 (German A2: health) ===\n');

    // Get German A2 health words (what Set 305 should show)
    const words = await client.query(`
      SELECT sw.id, sw.word, sw.level, sw.theme
      FROM source_words_german sw
      WHERE sw.level = 'A2' AND sw.theme = 'health'
      ORDER BY sw.word
      LIMIT 10
    `);

    console.log(`Found ${words.rows.length} German A2 health words\n`);

    for (const word of words.rows) {
      // Check Russian translation in base table
      const ruTrans = await client.query(`
        SELECT translation, source_lang FROM target_translations_russian
        WHERE source_word_id = $1 AND source_lang = 'de'
      `, [word.id]);

      const translation = ruTrans.rows[0]?.translation || 'NONE';
      const isCyrillic = /[\u0400-\u04FF]/.test(translation);

      console.log(`${word.word} (ID: ${word.id})`);
      console.log(`  → ${translation} ${isCyrillic ? '✅ Cyrillic' : '❌ Not Cyrillic'}`);
    }

    // Check if there's a count mismatch
    const totalA2Health = await client.query(`
      SELECT COUNT(*) FROM source_words_german
      WHERE level = 'A2' AND theme = 'health'
    `);

    const totalWithRu = await client.query(`
      SELECT COUNT(*)
      FROM source_words_german sw
      JOIN target_translations_russian tr ON sw.id = tr.source_word_id AND tr.source_lang = 'de'
      WHERE sw.level = 'A2' AND sw.theme = 'health'
    `);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total German A2 health words: ${totalA2Health.rows[0].count}`);
    console.log(`With Russian translations: ${totalWithRu.rows[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

debugSet305();
