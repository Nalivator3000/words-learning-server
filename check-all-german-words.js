require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAllGermanWords() {
  const client = await pool.connect();

  try {
    console.log('=== ALL GERMAN WORDS IN DATABASE ===\n');

    const totalCount = await client.query(`
      SELECT COUNT(*) as count FROM source_words_german
    `);
    console.log(`Total German words: ${totalCount.rows[0].count}\n`);

    const withTranslations = await client.query(`
      SELECT COUNT(DISTINCT sw.id) as count
      FROM source_words_german sw
      JOIN target_translations_russian_from_de t ON sw.id = t.source_word_id
    `);
    console.log(`German words with Russian translations: ${withTranslations.rows[0].count}`);
    console.log(`German words WITHOUT Russian translations: ${parseInt(totalCount.rows[0].count) - parseInt(withTranslations.rows[0].count)}\n`);

    console.log('=== GERMAN WORDS BY LEVEL ===');
    const byLevel = await client.query(`
      SELECT
        level,
        COUNT(*) as total_words,
        COUNT(DISTINCT t.source_word_id) as with_translation,
        COUNT(*) - COUNT(DISTINCT t.source_word_id) as without_translation
      FROM source_words_german sw
      LEFT JOIN target_translations_russian_from_de t ON sw.id = t.source_word_id
      GROUP BY level
      ORDER BY level
    `);
    console.table(byLevel.rows);

    console.log('\n=== GERMAN WORDS WITHOUT TRANSLATIONS (sample) ===');
    const withoutTranslations = await client.query(`
      SELECT sw.id, sw.word, sw.level, sw.theme
      FROM source_words_german sw
      LEFT JOIN target_translations_russian_from_de t ON sw.id = t.source_word_id
      WHERE t.source_word_id IS NULL
      ORDER BY sw.level, sw.word
      LIMIT 50
    `);
    console.table(withoutTranslations.rows);

    console.log(`\n... and ${parseInt(totalCount.rows[0].count) - parseInt(withTranslations.rows[0].count) - withoutTranslations.rows.length} more without translations`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllGermanWords();
