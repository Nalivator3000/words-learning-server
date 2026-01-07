const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    console.log('🔍 DIAGNOSIS: User 62 (English → Spanish)\n');
    console.log('=' .repeat(60));

    // 1. Check current words
    console.log('\n1️⃣  CURRENT WORDS FOR USER 62:\n');
    const currentWords = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN tt.translation ~ '[а-яА-ЯёЁ]' THEN 1 END) as russian_translations,
             COUNT(CASE WHEN tt.translation ~ '[áéíóúñ¿¡]' THEN 1 END) as spanish_translations
      FROM user_word_progress uwp
      JOIN source_words_english sw ON sw.id = uwp.source_word_id
      LEFT JOIN target_translations_spanish_from_en tt ON tt.source_word_id = sw.id
      WHERE uwp.user_id = 62 AND uwp.language_pair_id = 66
    `);
    console.log(`   Total words: ${currentWords.rows[0].total}`);
    console.log(`   With Russian translations: ${currentWords.rows[0].russian_translations}`);
    console.log(`   With Spanish translations: ${currentWords.rows[0].spanish_translations}`);

    // 2. Check target_translations_spanish_from_en table
    console.log('\n2️⃣  CHECKING target_translations_spanish_from_en TABLE:\n');
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN translation ~ '[а-яА-ЯёЁ]' THEN 1 END) as russian,
             COUNT(CASE WHEN translation ~ '[áéíóúñ¿¡]' THEN 1 END) as spanish,
             COUNT(CASE WHEN translation !~ '[а-яА-ЯёЁáéíóúñ¿¡]' THEN 1 END) as other
      FROM target_translations_spanish_from_en
      LIMIT 1000
    `);
    console.log(`   Total entries (sample): ${tableCheck.rows[0].total}`);
    console.log(`   Russian: ${tableCheck.rows[0].russian}`);
    console.log(`   Spanish: ${tableCheck.rows[0].spanish}`);
    console.log(`   Other: ${tableCheck.rows[0].other}`);

    // 3. Sample translations
    console.log('\n3️⃣  SAMPLE TRANSLATIONS:\n');
    const samples = await pool.query(`
      SELECT sw.word as english, tt.translation
      FROM target_translations_spanish_from_en tt
      JOIN source_words_english sw ON sw.id = tt.source_word_id
      ORDER BY tt.id
      LIMIT 10
    `);
    samples.rows.forEach((row, i) => {
      const isRussian = /[а-яА-ЯёЁ]/.test(row.translation);
      const isSpanish = /[áéíóúñ¿¡]/.test(row.translation);
      const flag = isRussian ? '🇷🇺' : isSpanish ? '🇪🇸' : '❓';
      console.log(`   ${i+1}. "${row.english}" → "${row.translation}" ${flag}`);
    });

    // 4. Check English→Spanish word sets
    console.log('\n4️⃣  ENGLISH→SPANISH WORD SETS:\n');
    const wordSets = await pool.query(`
      SELECT ws.id, ws.title, ws.source_language, ws.word_count, ws.level, ws.theme
      FROM word_sets ws
      WHERE ws.source_language = 'english'
      ORDER BY ws.id
      LIMIT 10
    `);
    console.log(`   Found ${wordSets.rows.length} English word sets:\n`);
    wordSets.rows.forEach(set => {
      console.log(`   Set ${set.id}: ${set.title}`);
      console.log(`      Level: ${set.level}, Theme: ${set.theme}, Words: ${set.word_count}`);
    });

    // 5. Check if word sets have Spanish or Russian translations
    if (wordSets.rows.length > 0) {
      console.log('\n5️⃣  CHECKING WORD SET TRANSLATIONS:\n');
      const setId = wordSets.rows[0].id;
      const setTranslations = await pool.query(`
        SELECT sw.word as english, tt.translation,
               CASE
                 WHEN tt.translation ~ '[а-яА-ЯёЁ]' THEN 'Russian'
                 WHEN tt.translation ~ '[áéíóúñ¿¡]' THEN 'Spanish'
                 ELSE 'Other'
               END as lang_detected
        FROM word_set_items wsi
        JOIN source_words_english sw ON wsi.word_id = sw.id
        LEFT JOIN target_translations_spanish_from_en tt ON tt.source_word_id = sw.id
        WHERE wsi.word_set_id = $1
        LIMIT 5
      `, [setId]);
      console.log(`   Set ${setId} sample translations:`);
      setTranslations.rows.forEach((row, i) => {
        console.log(`   ${i+1}. "${row.english}" → "${row.translation}" (${row.lang_detected})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Diagnosis complete!\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
