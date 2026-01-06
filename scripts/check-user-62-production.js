const { Pool } = require('pg');

// This script is designed to run against production database
// Make sure DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set it to your production database URL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('🔍 FULL DIAGNOSIS: User 62 (English → Spanish)\n');
    console.log('=' .repeat(70));

    // 1. Check ALL words for user 62 grouped by language pair and source_language
    console.log('\n1️⃣  ALL WORDS FOR USER 62 (grouped by language pair and source_language):\n');
    const allWordsGrouped = await pool.query(`
      SELECT
        uwp.language_pair_id,
        uwp.source_language,
        COUNT(*) as count,
        array_agg(DISTINCT uwp.status) as statuses,
        MIN(uwp.id) as min_id,
        MAX(uwp.id) as max_id
      FROM user_word_progress uwp
      WHERE uwp.user_id = 62
      GROUP BY uwp.language_pair_id, uwp.source_language
      ORDER BY uwp.language_pair_id, uwp.source_language
    `);

    console.log(`Found ${allWordsGrouped.rows.length} group(s):\n`);
    allWordsGrouped.rows.forEach(group => {
      console.log(`   Language Pair ID: ${group.language_pair_id}`);
      console.log(`   Source Language: ${group.source_language}`);
      console.log(`   Count: ${group.count}`);
      console.log(`   Statuses: ${group.statuses.join(', ')}`);
      console.log(`   ID range: ${group.min_id} - ${group.max_id}`);
      console.log();
    });

    // 2. Check language pairs for user 62
    console.log('2️⃣  LANGUAGE PAIRS FOR USER 62:\n');
    const pairs = await pool.query(`
      SELECT id, from_lang, to_lang
      FROM language_pairs
      WHERE user_id = 62
      ORDER BY id
    `);

    pairs.rows.forEach(pair => {
      console.log(`   Pair ${pair.id}: ${pair.from_lang} → ${pair.to_lang}`);
    });

    // 3. Sample words from each group
    console.log('\n3️⃣  SAMPLE WORDS FROM EACH GROUP:\n');
    for (const group of allWordsGrouped.rows) {
      console.log(`--- Language Pair ${group.language_pair_id}, Source: ${group.source_language} ---`);

      const samples = await pool.query(`
        SELECT
          uwp.id,
          uwp.source_word_id,
          uwp.status,
          uwp.next_review,
          sw.word as english_word
        FROM user_word_progress uwp
        LEFT JOIN source_words_english sw ON sw.id = uwp.source_word_id AND uwp.source_language = 'english'
        WHERE uwp.user_id = 62
          AND uwp.language_pair_id = $1
          AND uwp.source_language = $2
        ORDER BY uwp.id
        LIMIT 5
      `, [group.language_pair_id, group.source_language]);

      samples.rows.forEach((word, i) => {
        console.log(`   ${i+1}. Progress ID: ${word.id}, Word ID: ${word.source_word_id}`);
        console.log(`      English: "${word.english_word || 'NULL'}", Status: ${word.status}`);
        console.log(`      Next review: ${word.next_review || 'NULL'}`);
      });
      console.log();
    }

    // 4. Check what translations exist for English words
    console.log('4️⃣  CHECKING TRANSLATIONS FOR USER 62 WORDS:\n');
    const wordTranslations = await pool.query(`
      SELECT
        uwp.id as progress_id,
        uwp.source_word_id,
        uwp.source_language,
        uwp.status,
        sw.word as english_word,
        tt_es.translation as spanish_translation,
        tt_ru.translation as russian_translation
      FROM user_word_progress uwp
      LEFT JOIN source_words_english sw ON sw.id = uwp.source_word_id AND uwp.source_language = 'english'
      LEFT JOIN target_translations_spanish_from_en tt_es ON tt_es.source_word_id = uwp.source_word_id
      LEFT JOIN target_translations_russian_from_en tt_ru ON tt_ru.source_word_id = uwp.source_word_id
      WHERE uwp.user_id = 62
        AND uwp.language_pair_id = 66
        AND uwp.status IN ('new', 'studying')
      ORDER BY uwp.next_review ASC NULLS FIRST
      LIMIT 10
    `);

    console.log(`Sample of words that could appear in quiz (status: new/studying):\n`);
    wordTranslations.rows.forEach((word, i) => {
      console.log(`${i+1}. Progress ID: ${word.progress_id}, Word ID: ${word.source_word_id}`);
      console.log(`   English: "${word.english_word || 'NULL'}"`);
      console.log(`   Spanish: "${word.spanish_translation || 'NULL'}"`);
      console.log(`   Russian: "${word.russian_translation || 'NULL'}"`);
      console.log(`   Status: ${word.status}`);

      if (word.russian_translation && !word.spanish_translation) {
        console.log(`   ⚠️  WARNING: Has Russian but NO Spanish translation!`);
      } else if (word.spanish_translation && word.russian_translation) {
        console.log(`   ℹ️  Has BOTH translations`);
      } else if (word.spanish_translation) {
        console.log(`   ✅ Has Spanish translation`);
      }
      console.log();
    });

    // 5. Check which table the API would use
    console.log('5️⃣  CHECKING WHICH TRANSLATION TABLE API WOULD USE:\n');
    const baseTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'target_translations_spanish'
      ) as base_exists
    `);

    console.log(`   Base table (target_translations_spanish) exists: ${baseTableCheck.rows[0].base_exists}`);

    if (baseTableCheck.rows[0].base_exists) {
      const sourceCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM target_translations_spanish
        WHERE source_lang = 'en'
        LIMIT 1
      `);
      console.log(`   Base table has EN translations: ${sourceCheck.rows[0].count > 0 ? 'YES' : 'NO'}`);

      if (sourceCheck.rows[0].count > 0) {
        console.log(`   → API will use: target_translations_spanish`);
      } else {
        console.log(`   → API will use: target_translations_spanish_from_en`);
      }
    } else {
      console.log(`   → API will use: target_translations_spanish_from_en`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Diagnosis complete!\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
