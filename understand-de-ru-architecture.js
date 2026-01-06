require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function understandArchitecture() {
  const client = await pool.connect();

  try {
    console.log('=== WORD_SETS TABLE STRUCTURE ===');
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'word_sets'
      ORDER BY ordinal_position
    `);
    console.table(columnsResult.rows);

    console.log('\n=== GERMAN WORD SETS ===');
    const germanResult = await client.query(`
      SELECT
        source_language,
        COUNT(*) as count,
        SUM(word_count) as total_words
      FROM word_sets
      WHERE source_language = 'german' AND is_public = true
      GROUP BY source_language
    `);
    console.table(germanResult.rows);

    console.log('\n=== SAMPLE GERMAN WORD SETS ===');
    const sampleResult = await client.query(`
      SELECT id, title, level, theme, word_count, is_public
      FROM word_sets
      WHERE source_language = 'german' AND is_public = true
      ORDER BY id
      LIMIT 10
    `);
    console.table(sampleResult.rows);

    console.log('\n=== CHECKING HOW TRANSLATIONS WORK ===');
    console.log('Looking for German words and their Russian translations...');

    const translationResult = await client.query(`
      SELECT
        sw.id,
        sw.word as german_word,
        tr.translation as russian_translation
      FROM source_words_german sw
      LEFT JOIN target_translations_russian_from_de tr ON sw.id = tr.source_word_id
      WHERE tr.translation IS NOT NULL
      LIMIT 10
    `);

    console.log('\nGerman → Russian translation examples:');
    console.table(translationResult.rows);

    console.log('\n=== CHECKING WHAT USER SEES ===');
    console.log('When user 51 (test_de_ru) requests word lists, the frontend should filter by languagePair');
    console.log('The API endpoint /api/word-sets accepts languagePair parameter like "de-ru"');
    console.log('But the word_sets table only has source_language, not target_language!');

    console.log('\n=== CHECKING LANGUAGE_PAIRS TABLE ===');
    const langPairsResult = await client.query(`
      SELECT * FROM language_pairs ORDER BY from_language, to_language
    `);
    console.log(`Found ${langPairsResult.rows.length} language pairs`);
    if (langPairsResult.rows.length > 0) {
      console.table(langPairsResult.rows.slice(0, 20));
    }

    console.log('\n=== THE PROBLEM ===');
    console.log('The word_sets table does NOT store target_language.');
    console.log('So ALL users learning FROM German will see the SAME word sets,');
    console.log('regardless of their target language (English, Russian, Spanish, etc.)');
    console.log('');
    console.log('The filtering should happen on the FRONTEND or API level,');
    console.log('checking if translations exist for the user\'s target language.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

understandArchitecture();
