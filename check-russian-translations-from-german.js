require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkRussianFromGerman() {
  const client = await pool.connect();

  try {
    console.log('=== CHECKING target_translations_russian TABLE ===\n');

    // Check structure
    console.log('Table structure:');
    const structure = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'target_translations_russian'
      ORDER BY ordinal_position
    `);
    console.table(structure.rows);

    // Check all source languages
    console.log('\n=== TRANSLATIONS BY SOURCE LANGUAGE ===');
    const bySourceLang = await client.query(`
      SELECT
        source_lang,
        COUNT(*) as count
      FROM target_translations_russian
      WHERE translation NOT LIKE '%_A1%'
        AND translation NOT LIKE '%_A2%'
      GROUP BY source_lang
      ORDER BY count DESC
    `);
    console.table(bySourceLang.rows);

    // Check if German exists
    const deRuCount = await client.query(`
      SELECT COUNT(*) as count
      FROM target_translations_russian
      WHERE source_lang = 'de'
        AND translation NOT LIKE '%_A1%'
        AND translation NOT LIKE '%_A2%'
    `);
    console.log(`\nGerman→Russian translations: ${deRuCount.rows[0].count}`);

    if (parseInt(deRuCount.rows[0].count) > 0) {
      console.log('\n✅ German→Russian translations EXIST!\n');

      // Show samples
      const samples = await client.query(`
        SELECT
          sw.word as german_word,
          sw.level as german_level,
          t.translation as russian_translation
        FROM target_translations_russian t
        JOIN source_words_german sw ON t.source_word_id = sw.id
        WHERE t.source_lang = 'de'
          AND t.translation NOT LIKE '%_A1%'
          AND t.translation NOT LIKE '%_A2%'
        ORDER BY sw.level, sw.word
        LIMIT 30
      `);
      console.log('Sample translations:');
      console.table(samples.rows);

      // Check coverage
      const coverage = await client.query(`
        SELECT
          sw.level,
          COUNT(DISTINCT sw.id) as total_german_words,
          COUNT(DISTINCT t.source_word_id) as with_russian_translation,
          ROUND(100.0 * COUNT(DISTINCT t.source_word_id) / COUNT(DISTINCT sw.id), 2) as coverage_pct
        FROM source_words_german sw
        LEFT JOIN target_translations_russian t ON sw.id = t.source_word_id AND t.source_lang = 'de'
        WHERE sw.level IS NOT NULL
          AND (t.translation IS NULL OR (t.translation NOT LIKE '%_A1%' AND t.translation NOT LIKE '%_A2%'))
        GROUP BY sw.level
        ORDER BY sw.level
      `);
      console.log('\nCoverage by CEFR level:');
      console.table(coverage.rows);

    } else {
      console.log('\n❌ NO German→Russian translations found!');
      console.log('We need to populate target_translations_russian with German words.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRussianFromGerman();
