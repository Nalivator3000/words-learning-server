require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkStructure() {
  const client = await pool.connect();

  try {
    console.log('=== SOURCE_WORDS_GERMAN STRUCTURE ===');
    const deColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'source_words_german'
      ORDER BY ordinal_position
    `);
    console.table(deColumns.rows);

    console.log('\n=== SAMPLE GERMAN WORDS ===');
    const deSample = await client.query(`
      SELECT * FROM source_words_german LIMIT 5
    `);
    console.table(deSample.rows);

    console.log('\n=== SOURCE_WORDS_RUSSIAN STRUCTURE ===');
    const ruColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'source_words_russian'
      ORDER BY ordinal_position
    `);
    console.table(ruColumns.rows);

    console.log('\n=== SAMPLE RUSSIAN WORDS ===');
    const ruSample = await client.query(`
      SELECT * FROM source_words_russian LIMIT 5
    `);
    console.table(ruSample.rows);

    console.log('\n=== SAMPLE RU→DE TRANSLATIONS ===');
    const ruDeTranslations = await client.query(`
      SELECT
        sw_ru.id as ru_id,
        sw_ru.word as russian_word,
        t.translation as german_translation
      FROM target_translations_german_from_ru t
      JOIN source_words_russian sw_ru ON t.source_word_id = sw_ru.id
      LIMIT 10
    `);
    console.table(ruDeTranslations.rows);

    console.log('\n=== CHECKING IF WE CAN MATCH GERMAN WORDS ===');
    const matchTest = await client.query(`
      SELECT
        sw_ru.word as russian,
        t.translation as german_from_translation,
        sw_de.word as german_from_source,
        sw_de.id as german_id
      FROM target_translations_german_from_ru t
      JOIN source_words_russian sw_ru ON t.source_word_id = sw_ru.id
      LEFT JOIN source_words_german sw_de ON LOWER(TRIM(t.translation)) = LOWER(TRIM(sw_de.word))
      LIMIT 10
    `);
    console.table(matchTest.rows);

    const matchCount = await client.query(`
      SELECT COUNT(*) as matched_count
      FROM target_translations_german_from_ru t
      JOIN source_words_russian sw_ru ON t.source_word_id = sw_ru.id
      JOIN source_words_german sw_de ON LOWER(TRIM(t.translation)) = LOWER(TRIM(sw_de.word))
    `);
    console.log(`\nMatched translations: ${matchCount.rows[0].matched_count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure();
