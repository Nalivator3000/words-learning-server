const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    console.log('🔍 Checking User 62 language pairs and words\n');

    // Get all language pairs for user 62
    const pairsResult = await pool.query(`
      SELECT id, from_lang, to_lang, user_id
      FROM language_pairs
      WHERE user_id = 62
      ORDER BY id
    `);

    console.log(`Found ${pairsResult.rows.length} language pair(s) for user 62:\n`);
    pairsResult.rows.forEach(pair => {
      console.log(`   Pair ${pair.id}: ${pair.from_lang} → ${pair.to_lang}`);
    });

    // Check words per language pair
    console.log('\n📊 Words count per language pair:\n');
    for (const pair of pairsResult.rows) {
      const countResult = await pool.query(`
        SELECT
          uwp.source_language,
          COUNT(*) as count,
          array_agg(DISTINCT uwp.status) as statuses
        FROM user_word_progress uwp
        WHERE uwp.user_id = 62 AND uwp.language_pair_id = $1
        GROUP BY uwp.source_language
      `, [pair.id]);

      console.log(`   Pair ${pair.id} (${pair.from_lang} → ${pair.to_lang}):`);
      if (countResult.rows.length === 0) {
        console.log(`      No words`);
      } else {
        countResult.rows.forEach(row => {
          console.log(`      Source: ${row.source_language}, Count: ${row.count}, Statuses: ${row.statuses.join(', ')}`);
        });
      }
      console.log();
    }

    // Sample words for pair 66 (en→es)
    console.log('\n📝 Sample words for pair 66 (en→es):\n');
    const wordsResult = await pool.query(`
      SELECT
        uwp.id,
        uwp.source_language,
        uwp.source_word_id,
        uwp.status,
        sw.word as english_word
      FROM user_word_progress uwp
      LEFT JOIN source_words_english sw ON sw.id = uwp.source_word_id AND uwp.source_language = 'english'
      WHERE uwp.user_id = 62 AND uwp.language_pair_id = 66
      ORDER BY uwp.id
      LIMIT 10
    `);

    wordsResult.rows.forEach((word, i) => {
      console.log(`   ${i+1}. Progress ID: ${word.id}, Source: ${word.source_language}, Word ID: ${word.source_word_id}`);
      console.log(`      English word: ${word.english_word || 'NULL'}, Status: ${word.status}`);
    });

    // Check if there are words with wrong source_language
    console.log('\n⚠️  Checking for words with wrong source_language:\n');
    const wrongLangResult = await pool.query(`
      SELECT DISTINCT uwp.source_language, COUNT(*) as count
      FROM user_word_progress uwp
      WHERE uwp.user_id = 62 AND uwp.language_pair_id = 66
      GROUP BY uwp.source_language
    `);

    wrongLangResult.rows.forEach(row => {
      const isCorrect = row.source_language === 'english';
      console.log(`   ${row.source_language}: ${row.count} words ${isCorrect ? '✅' : '❌ WRONG!'}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
