const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    console.log('🔍 Checking English→Spanish word sets\n');

    // Check word sets
    const setsResult = await pool.query(`
      SELECT
        ws.id,
        ws.title,
        ws.source_language,
        ws.word_count,
        ws.level,
        ws.theme
      FROM word_sets ws
      WHERE ws.source_language = 'english'
      ORDER BY ws.id
      LIMIT 20
    `);

    console.log(`📋 Found ${setsResult.rows.length} English word sets:\n`);
    setsResult.rows.forEach(set => {
      console.log(`Set ID: ${set.id}`);
      console.log(`  Title: ${set.title}`);
      console.log(`  Source: ${set.source_language}, Count: ${set.word_count}`);
      console.log(`  Level: ${set.level}, Theme: ${set.theme}`);
      console.log();
    });

    // Check sample translations for first set
    if (setsResult.rows.length > 0) {
      const firstSetId = setsResult.rows[0].id;
      console.log(`\n🔍 Checking translations for set ${firstSetId}:\n`);

      const translationsResult = await pool.query(`
        SELECT
          sw.id,
          sw.word as english_word,
          tt.translation as spanish_translation
        FROM word_set_items wsi
        JOIN source_words_english sw ON wsi.word_id = sw.id
        LEFT JOIN target_translations_spanish_from_en tt ON tt.source_word_id = sw.id
        WHERE wsi.word_set_id = $1
        LIMIT 10
      `, [firstSetId]);

      translationsResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. "${row.english_word}" → "${row.spanish_translation || 'NULL'}"`);

        // Check if translation is Russian
        if (row.spanish_translation && /[а-яА-ЯёЁ]/.test(row.spanish_translation)) {
          console.log(`   ⚠️  WARNING: Translation contains Cyrillic (Russian)!`);
        }
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
