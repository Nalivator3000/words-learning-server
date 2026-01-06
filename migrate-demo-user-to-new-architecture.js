const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Language code mapping
const LANG_CODE_TO_FULL_NAME = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'uk': 'ukrainian', 'pt': 'portuguese', 'it': 'italian',
    'zh': 'chinese', 'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi',
    'ar': 'arabic', 'tr': 'turkish', 'pl': 'polish', 'ro': 'romanian',
    'sr': 'serbian', 'sw': 'swahili'
};

async function migrateUserToNewArchitecture(userEmail) {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         МИГРАЦИЯ ПОЛЬЗОВАТЕЛЯ В НОВУЮ АРХИТЕКТУРУ            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Get user
    const userResult = await pool.query(`
      SELECT id, email, name FROM users WHERE email = $1
    `, [userEmail]);

    if (userResult.rows.length === 0) {
      console.log(`❌ Пользователь ${userEmail} не найден!`);
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Найден пользователь: ${user.name} (ID: ${user.id})\n`);

    // Get language pair
    const langPairResult = await pool.query(`
      SELECT id, from_lang, to_lang, name
      FROM language_pairs
      WHERE user_id = $1
      LIMIT 1
    `, [user.id]);

    if (langPairResult.rows.length === 0) {
      console.log('❌ У пользователя нет языковых пар!');
      return;
    }

    const langPair = langPairResult.rows[0];
    console.log(`✅ Языковая пара: ${langPair.name} (ID: ${langPair.id})`);
    console.log(`   from_lang: ${langPair.from_lang} → to_lang: ${langPair.to_lang}\n`);

    // Get source language full name
    const sourceLanguage = LANG_CODE_TO_FULL_NAME[langPair.from_lang] || langPair.from_lang;
    const sourceWordsTable = `source_words_${sourceLanguage}`;

    console.log(`📖 Таблица слов: ${sourceWordsTable}\n`);

    // Get old words
    const oldWordsResult = await pool.query(`
      SELECT id, word, translation, example, exampletranslation,
             status, correctcount, totalpoints, reviewcycle,
             lastreviewdate, nextreviewdate
      FROM words
      WHERE user_id = $1 AND language_pair_id = $2
      ORDER BY id
    `, [user.id, langPair.id]);

    const oldWords = oldWordsResult.rows;
    console.log(`📊 Найдено ${oldWords.length} слов в старой таблице\n`);

    if (oldWords.length === 0) {
      console.log('⚠️  Нет слов для миграции');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    console.log('🔄 Начинаем миграцию...\n');

    for (const oldWord of oldWords) {
      try {
        // Try to find matching word in source_words table
        const sourceWordResult = await pool.query(`
          SELECT id FROM ${sourceWordsTable}
          WHERE LOWER(word) = LOWER($1)
          LIMIT 1
        `, [oldWord.word]);

        if (sourceWordResult.rows.length === 0) {
          // Word not found in source table, skip
          notFoundCount++;
          if (notFoundCount <= 5) {
            console.log(`   ⚠️  Слово "${oldWord.word}" не найдено в ${sourceWordsTable}`);
          }
          continue;
        }

        const sourceWordId = sourceWordResult.rows[0].id;

        // Calculate ease factor (default 2.5 for new words)
        const easeFactor = 2.5;

        // Insert into user_word_progress
        const insertResult = await pool.query(`
          INSERT INTO user_word_progress (
            user_id,
            language_pair_id,
            source_language,
            source_word_id,
            status,
            correct_count,
            incorrect_count,
            total_reviews,
            review_cycle,
            last_review_date,
            next_review_date,
            ease_factor
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (user_id, language_pair_id, source_language, source_word_id) DO NOTHING
          RETURNING id
        `, [
          user.id,
          langPair.id,
          sourceLanguage,
          sourceWordId,
          oldWord.status || 'studying',
          oldWord.correctcount || 0,
          0, // incorrect_count (not tracked in old schema)
          (oldWord.correctcount || 0), // total_reviews
          oldWord.reviewcycle || 1,
          oldWord.lastreviewdate,
          oldWord.nextreviewdate,
          easeFactor
        ]);

        if (insertResult.rows.length > 0) {
          migratedCount++;
          if (migratedCount % 50 === 0) {
            console.log(`   ✓ Мигрировано ${migratedCount} слов...`);
          }
        } else {
          skippedCount++;
        }

      } catch (error) {
        console.error(`   ❌ Ошибка при миграции слова "${oldWord.word}":`, error.message);
      }
    }

    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║                    РЕЗУЛЬТАТЫ МИГРАЦИИ                        ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
    console.log(`✅ Успешно мигрировано: ${migratedCount} слов`);
    console.log(`⏭️  Пропущено (дубликаты): ${skippedCount} слов`);
    console.log(`⚠️  Не найдено в source_words: ${notFoundCount} слов`);
    console.log(`📊 Всего обработано: ${oldWords.length} слов\n`);

    // Verify migration
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM user_word_progress
      WHERE user_id = $1 AND language_pair_id = $2
    `, [user.id, langPair.id]);

    console.log(`✅ Проверка: ${verifyResult.rows[0].count} записей в user_word_progress\n`);

  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    console.error(error);
  }

  await pool.end();
}

// Migrate demo@fluentflow.app user
migrateUserToNewArchitecture('demo@fluentflow.app');
