const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    console.log('🔍 Checking which words would appear in User 62 quiz\n');
    console.log('=' .repeat(60));

    // Simulate the exact query that quiz API uses
    console.log('\n📊 Words that would appear in quiz (ordered by next_review):\n');

    const quizWords = await pool.query(`
      SELECT
        uwp.id as progress_id,
        uwp.source_word_id,
        uwp.status,
        uwp.next_review,
        uwp.source_language,
        sw.word as english_word,
        tt_es.translation as spanish_translation,
        tt_ru.translation as russian_translation,
        CASE
          WHEN tt_ru.translation IS NOT NULL AND tt_es.translation IS NULL THEN 'RUSSIAN_ONLY'
          WHEN tt_es.translation IS NOT NULL AND tt_ru.translation IS NULL THEN 'SPANISH_ONLY'
          WHEN tt_es.translation IS NOT NULL AND tt_ru.translation IS NOT NULL THEN 'BOTH'
          ELSE 'NONE'
        END as translation_status
      FROM user_word_progress uwp
      LEFT JOIN source_words_english sw ON sw.id = uwp.source_word_id AND uwp.source_language = 'english'
      LEFT JOIN target_translations_spanish_from_en tt_es ON tt_es.source_word_id = uwp.source_word_id
      LEFT JOIN target_translations_russian_from_en tt_ru ON tt_ru.source_word_id = uwp.source_word_id
      WHERE uwp.user_id = 62
        AND uwp.language_pair_id = 66
        AND uwp.status IN ('new', 'studying')
      ORDER BY uwp.next_review ASC NULLS FIRST
      LIMIT 20
    `);

    console.log(`Found ${quizWords.rows.length} words:\n`);

    let russianOnlyCount = 0;
    let spanishOnlyCount = 0;
    let bothCount = 0;
    let noneCount = 0;

    quizWords.rows.forEach((word, i) => {
      console.log(`${i+1}. Progress ID: ${word.progress_id}, Word ID: ${word.source_word_id}`);
      console.log(`   English: "${word.english_word || 'NULL'}"`);
      console.log(`   Spanish: "${word.spanish_translation || 'NULL'}"`);
      console.log(`   Russian: "${word.russian_translation || 'NULL'}"`);
      console.log(`   Status: ${word.status}, Next review: ${word.next_review || 'NULL'}`);
      console.log(`   Translation status: ${word.translation_status}`);

      if (word.translation_status === 'RUSSIAN_ONLY') {
        console.log(`   ⚠️  WARNING: This word has RUSSIAN translation but NO Spanish!`);
        russianOnlyCount++;
      } else if (word.translation_status === 'SPANISH_ONLY') {
        console.log(`   ✅ Has Spanish translation`);
        spanishOnlyCount++;
      } else if (word.translation_status === 'BOTH') {
        console.log(`   ℹ️  Has BOTH translations`);
        bothCount++;
      } else {
        console.log(`   ❌ NO translations found`);
        noneCount++;
      }
      console.log();
    });

    console.log('=' .repeat(60));
    console.log('📈 SUMMARY:\n');
    console.log(`   Russian only: ${russianOnlyCount}`);
    console.log(`   Spanish only: ${spanishOnlyCount}`);
    console.log(`   Both translations: ${bothCount}`);
    console.log(`   No translations: ${noneCount}`);
    console.log();

    if (russianOnlyCount > 0) {
      console.log('⚠️  PROBLEM IDENTIFIED:');
      console.log(`   ${russianOnlyCount} words have Russian translations but NO Spanish!`);
      console.log('   These words will show Russian in the quiz.');
      console.log();
      console.log('💡 SOLUTION:');
      console.log('   Delete these old words with Russian translations:');
      console.log(`   DELETE FROM user_word_progress WHERE user_id = 62 AND id IN (...)`);
    }

    console.log('\n✅ Diagnosis complete!\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
