const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    console.log('🔍 Checking User 62 words (English → Spanish)\n');

    // Get language pair info
    const pairResult = await pool.query(`
      SELECT id, from_lang, to_lang, user_id
      FROM language_pairs
      WHERE user_id = 62 AND id = 66
    `);

    if (pairResult.rows.length === 0) {
      console.log('❌ Language pair 66 not found for user 62');
      await pool.end();
      return;
    }

    const pair = pairResult.rows[0];
    console.log('📋 Language Pair:', pair);
    console.log(`   From: ${pair.from_lang} → To: ${pair.to_lang}\n`);

    // Get sample words
    const wordsResult = await pool.query(`
      SELECT
        sw.id,
        sw.word as source_word,
        sw.level,
        sw.theme,
        sw.example_en as source_example,
        tt.translation as target_translation,
        tt.example_native as target_example,
        uwp.status
      FROM user_word_progress uwp
      JOIN source_words_english sw ON sw.id = uwp.source_word_id
      LEFT JOIN target_translations_spanish_from_en tt ON tt.source_word_id = sw.id
      WHERE uwp.user_id = 62
        AND uwp.language_pair_id = 66
        AND uwp.source_language = 'english'
      LIMIT 10
    `);

    console.log(`📚 Found ${wordsResult.rows.length} words:\n`);

    wordsResult.rows.forEach((word, index) => {
      console.log(`${index + 1}. ID: ${word.id}`);
      console.log(`   Source (English): "${word.source_word}"`);
      console.log(`   Translation (Spanish): "${word.target_translation || 'NULL'}"`);
      console.log(`   Source Example: "${word.source_example || 'NULL'}"`);
      console.log(`   Target Example: "${word.target_example || 'NULL'}"`);
      console.log(`   Status: ${word.status}`);
      console.log(`   Level: ${word.level}, Theme: ${word.theme}`);

      // Check if word looks like Russian
      if (word.source_word && /[а-яА-ЯёЁ]/.test(word.source_word)) {
        console.log(`   ⚠️  WARNING: Source word contains Cyrillic characters!`);
      }
      if (word.target_translation && /[а-яА-ЯёЁ]/.test(word.target_translation)) {
        console.log(`   ⚠️  WARNING: Translation contains Cyrillic characters!`);
      }

      console.log();
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
