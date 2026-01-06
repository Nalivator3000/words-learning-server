require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createDeRuTranslations() {
  const client = await pool.connect();

  try {
    console.log('=== CREATING GERMAN→RUSSIAN TRANSLATION TABLE ===\n');

    // Step 1: Create the table
    console.log('Step 1: Creating target_translations_russian_from_de table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS target_translations_russian_from_de (
        id SERIAL PRIMARY KEY,
        source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
        translation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_word_id, translation)
      )
    `);
    console.log('✅ Table created\n');

    // Step 2: Create index for performance
    console.log('Step 2: Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_russian_from_de_source_word_id
      ON target_translations_russian_from_de(source_word_id)
    `);
    console.log('✅ Index created\n');

    // Step 3: Check existing data in target_translations_german_from_ru
    console.log('Step 3: Checking existing Russian→German translations...');
    const ruDeCount = await client.query(`
      SELECT COUNT(*) as count
      FROM target_translations_german_from_ru
    `);
    console.log(`Found ${ruDeCount.rows[0].count} Russian→German translations\n`);

    // Step 4: Populate de→ru by reversing ru→de data
    console.log('Step 4: Populating German→Russian translations...');
    console.log('This will create reverse mappings from existing Russian→German data...');

    const insertResult = await client.query(`
      INSERT INTO target_translations_russian_from_de (source_word_id, translation)
      SELECT DISTINCT
        sw_de.id as source_word_id,
        sw_ru.word as translation
      FROM target_translations_german_from_ru t_de_from_ru
      JOIN source_words_russian sw_ru ON t_de_from_ru.source_word_id = sw_ru.id
      JOIN source_words_german sw_de ON LOWER(TRIM(t_de_from_ru.translation)) = LOWER(TRIM(sw_de.word))
      WHERE sw_ru.word IS NOT NULL
        AND sw_de.word IS NOT NULL
        AND LENGTH(TRIM(sw_ru.word)) > 0
        AND LENGTH(TRIM(sw_de.word)) > 0
      ON CONFLICT (source_word_id, translation) DO NOTHING
    `);

    console.log(`✅ Inserted ${insertResult.rowCount} German→Russian translations\n`);

    // Step 5: Verify the data
    console.log('Step 5: Verifying the data...');
    const verifyCount = await client.query(`
      SELECT COUNT(*) as count
      FROM target_translations_russian_from_de
    `);
    console.log(`Total German→Russian translations: ${verifyCount.rows[0].count}`);

    // Show some examples
    const examples = await client.query(`
      SELECT
        sw.word as german_word,
        t.translation as russian_translation,
        sw.cefr_level,
        sw.theme
      FROM target_translations_russian_from_de t
      JOIN source_words_german sw ON t.source_word_id = sw.id
      ORDER BY sw.cefr_level, sw.word
      LIMIT 20
    `);

    console.log('\n=== SAMPLE TRANSLATIONS ===');
    console.table(examples.rows);

    // Step 6: Check coverage by CEFR level
    const coverage = await client.query(`
      SELECT
        sw.cefr_level,
        COUNT(DISTINCT sw.id) as total_words,
        COUNT(DISTINCT t.source_word_id) as words_with_translation,
        ROUND(100.0 * COUNT(DISTINCT t.source_word_id) / COUNT(DISTINCT sw.id), 2) as coverage_pct
      FROM source_words_german sw
      LEFT JOIN target_translations_russian_from_de t ON sw.id = t.source_word_id
      WHERE sw.cefr_level IS NOT NULL
      GROUP BY sw.cefr_level
      ORDER BY sw.cefr_level
    `);

    console.log('\n=== TRANSLATION COVERAGE BY CEFR LEVEL ===');
    console.table(coverage.rows);

    console.log('\n✅ German→Russian translation table created and populated!');
    console.log('\nNow user 51 (test_de_ru) should see Russian translations for German words.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createDeRuTranslations();
