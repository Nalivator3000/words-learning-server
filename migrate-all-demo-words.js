const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const LANG_CODE_TO_FULL_NAME = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'uk': 'ukrainian', 'pt': 'portuguese', 'it': 'italian',
    'zh': 'chinese', 'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi',
    'ar': 'arabic', 'tr': 'turkish', 'pl': 'polish', 'ro': 'romanian',
    'sr': 'serbian', 'sw': 'swahili'
};

async function migrateAllWords(userEmail) {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         ПОЛНАЯ МИГРАЦИЯ ВСЕХ СЛОВ ПОЛЬЗОВАТЕЛЯ               ║');
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
    console.log(`✅ Пользователь: ${user.name} (ID: ${user.id})\n`);

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
    const sourceLanguage = LANG_CODE_TO_FULL_NAME[langPair.from_lang] || langPair.from_lang;
    const sourceWordsTable = `source_words_${sourceLanguage}`;

    console.log(`✅ Языковая пара: ${langPair.name}`);
    console.log(`📖 Таблица: ${sourceWordsTable}\n`);

    // First, make example_de nullable temporarily
    console.log('🔧 Делаем поле example_de необязательным...\n');
    await pool.query(`
      ALTER TABLE ${sourceWordsTable}
      ALTER COLUMN example_de DROP NOT NULL
    `);

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
    console.log('🔄 Начинаем полную миграцию...\n');

    let migratedCount = 0;
    let addedToSourceCount = 0;

    for (const oldWord of oldWordsResult.rows) {
      try {
        // Try to find in source_words
        let sourceWordResult = await pool.query(`
          SELECT id FROM ${sourceWordsTable}
          WHERE LOWER(word) = LOWER($1)
          LIMIT 1
        `, [oldWord.word]);

        let sourceWordId;

        if (sourceWordResult.rows.length === 0) {
          // Add to source_words table with optional example
          const insertSourceResult = await pool.query(`
            INSERT INTO ${sourceWordsTable} (word, level, theme, example_de)
            VALUES ($1, 'custom', 'user_imported', $2)
            RETURNING id
          `, [oldWord.word, oldWord.example || null]);

          sourceWordId = insertSourceResult.rows[0].id;
          addedToSourceCount++;

          if (addedToSourceCount % 50 === 0) {
            console.log(`   ➕ Добавлено в ${sourceWordsTable}: ${addedToSourceCount} слов...`);
          }
        } else {
          sourceWordId = sourceWordResult.rows[0].id;
        }

        // Insert into user_word_progress
        await pool.query(`
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
          ON CONFLICT (user_id, language_pair_id, source_language, source_word_id)
          DO UPDATE SET
            status = EXCLUDED.status,
            correct_count = EXCLUDED.correct_count,
            total_reviews = EXCLUDED.total_reviews,
            review_cycle = EXCLUDED.review_cycle,
            last_review_date = EXCLUDED.last_review_date,
            next_review_date = EXCLUDED.next_review_date
        `, [
          user.id,
          langPair.id,
          sourceLanguage,
          sourceWordId,
          oldWord.status || 'studying',
          oldWord.correctcount || 0,
          0,
          (oldWord.correctcount || 0),
          oldWord.reviewcycle || 1,
          oldWord.lastreviewdate,
          oldWord.nextreviewdate,
          2.5
        ]);

        migratedCount++;

        if (migratedCount % 50 === 0) {
          console.log(`   ✓ Мигрировано прогресса: ${migratedCount} слов...`);
        }

      } catch (error) {
        console.error(`   ❌ Ошибка для "${oldWord.word}":`, error.message);
      }
    }

    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║                    РЕЗУЛЬТАТЫ МИГРАЦИИ                        ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
    console.log(`✅ Успешно мигрировано: ${migratedCount} слов`);
    console.log(`➕ Добавлено в ${sourceWordsTable}: ${addedToSourceCount} слов`);
    console.log(`📊 Всего в старой базе: ${oldWords.length} слов\n`);

    // Verify
    const verifyProgress = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM user_word_progress
      WHERE user_id = $1 AND language_pair_id = $2
      GROUP BY status
      ORDER BY status
    `, [user.id, langPair.id]);

    console.log('✅ Проверка прогресса в user_word_progress:\n');
    let totalProgress = 0;
    verifyProgress.rows.forEach(row => {
      console.log(`   ${row.status.padEnd(15)}: ${row.count} слов`);
      totalProgress += parseInt(row.count);
    });
    console.log(`   ${'ВСЕГО'.padEnd(15)}: ${totalProgress} слов\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  }

  await pool.end();
}

migrateAllWords('demo@fluentflow.app');
