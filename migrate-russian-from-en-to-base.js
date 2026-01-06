require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateRussianFromEn() {
  const client = await pool.connect();

  try {
    console.log('=== MIGRATING EN→RU TRANSLATIONS TO BASE TABLE ===\n');

    // Check current state
    const beforeCount = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_russian WHERE source_lang = 'en'
    `);
    console.log(`Before: target_translations_russian has ${beforeCount.rows[0].count} en→ru records`);

    const fromEnCount = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_russian_from_en
    `);
    console.log(`Source: target_translations_russian_from_en has ${fromEnCount.rows[0].count} records\n`);

    // Insert data from _from_en table to base table
    console.log('Inserting data...');
    const insertResult = await client.query(`
      INSERT INTO target_translations_russian (source_lang, source_word_id, translation, example_ru, created_at, updated_at)
      SELECT
        source_lang,
        source_word_id,
        translation,
        example_native,
        created_at,
        NOW() as updated_at
      FROM target_translations_russian_from_en
      WHERE NOT EXISTS (
        SELECT 1 FROM target_translations_russian tr
        WHERE tr.source_lang = target_translations_russian_from_en.source_lang
          AND tr.source_word_id = target_translations_russian_from_en.source_word_id
          AND tr.translation = target_translations_russian_from_en.translation
      )
    `);

    console.log(`✅ Inserted ${insertResult.rowCount} records`);

    // Verify
    const afterCount = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_russian WHERE source_lang = 'en'
    `);
    console.log(`\nAfter: target_translations_russian has ${afterCount.rows[0].count} en→ru records`);

    // Show sample
    const sample = await client.query(`
      SELECT
        sw.word as english_word,
        t.translation as russian_translation
      FROM target_translations_russian t
      JOIN source_words_english sw ON t.source_word_id = sw.id
      WHERE t.source_lang = 'en'
      LIMIT 10
    `);

    console.log('\n=== SAMPLE TRANSLATIONS ===');
    console.table(sample.rows);

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRussianFromEn();
