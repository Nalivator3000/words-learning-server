const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function checkEmptySets() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking empty vs filled word sets...\n');

    const result = await client.query(`
      SELECT
        ws.source_language,
        COUNT(DISTINCT ws.id) as total_sets,
        COUNT(DISTINCT CASE WHEN wsi.word_id IS NOT NULL THEN ws.id END) as sets_with_words,
        COUNT(DISTINCT CASE WHEN wsi.word_id IS NULL THEN ws.id END) as empty_sets
      FROM word_sets ws
      LEFT JOIN word_set_items wsi ON ws.id = wsi.word_set_id
      GROUP BY ws.source_language
      ORDER BY ws.source_language
    `);

    console.log('📊 Word Sets Status:\n');
    console.log('Language     | Total | With Words | Empty');
    console.log('-'.repeat(50));

    let totalAll = 0;
    let totalWithWords = 0;
    let totalEmpty = 0;

    result.rows.forEach(row => {
      const lang = row.source_language.padEnd(12);
      const total = String(row.total_sets).padStart(5);
      const withWords = String(row.sets_with_words).padStart(10);
      const empty = String(row.empty_sets).padStart(5);

      console.log(`${lang} | ${total} | ${withWords} | ${empty}`);

      totalAll += parseInt(row.total_sets);
      totalWithWords += parseInt(row.sets_with_words);
      totalEmpty += parseInt(row.empty_sets);
    });

    console.log('-'.repeat(50));
    console.log(`TOTAL        | ${String(totalAll).padStart(5)} | ${String(totalWithWords).padStart(10)} | ${String(totalEmpty).padStart(5)}`);

    // Get sample of sets with words
    console.log('\n\n📋 Sample sets WITH words (first 20):');
    const withWordsResult = await client.query(`
      SELECT
        ws.id,
        ws.title,
        ws.source_language,
        ws.level,
        ws.theme,
        COUNT(wsi.word_id) as word_count
      FROM word_sets ws
      INNER JOIN word_set_items wsi ON ws.id = wsi.word_set_id
      GROUP BY ws.id, ws.title, ws.source_language, ws.level, ws.theme
      ORDER BY ws.id
      LIMIT 20
    `);

    withWordsResult.rows.forEach(set => {
      console.log(`\n[ID: ${set.id}] "${set.title}"`);
      console.log(`   Language: ${set.source_language}, Level: ${set.level || 'N/A'}, Theme: ${set.theme || 'N/A'}`);
      console.log(`   Words: ${set.word_count}`);
    });

    // Get sample of empty sets
    console.log('\n\n📋 Sample EMPTY sets (first 20):');
    const emptyResult = await client.query(`
      SELECT
        ws.id,
        ws.title,
        ws.source_language,
        ws.level,
        ws.theme,
        ws.created_at
      FROM word_sets ws
      LEFT JOIN word_set_items wsi ON ws.id = wsi.word_set_id
      WHERE wsi.word_id IS NULL
      ORDER BY ws.id
      LIMIT 20
    `);

    emptyResult.rows.forEach(set => {
      console.log(`\n[ID: ${set.id}] "${set.title}"`);
      console.log(`   Language: ${set.source_language}, Level: ${set.level || 'N/A'}, Theme: ${set.theme || 'N/A'}`);
      console.log(`   Created: ${set.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmptySets().catch(console.error);
