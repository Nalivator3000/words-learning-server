const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkDemoUserProgress() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ПРОВЕРКА ПРОГРЕССА ДЕМО-ПОЛЬЗОВАТЕЛЯ                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Find demo user (test.onboarding@lexibooster.test)
    const userResult = await pool.query(`
      SELECT id, email, name
      FROM users
      WHERE email = 'test.onboarding@lexibooster.test'
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Демо-пользователь не найден!');
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Демо-пользователь найден:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}\n`);

    // Get user's language pairs
    const langPairsResult = await pool.query(`
      SELECT id, from_lang, to_lang
      FROM language_pairs
      WHERE user_id = $1
    `, [user.id]);

    console.log(`📚 Языковые пары пользователя: ${langPairsResult.rows.length}`);
    langPairsResult.rows.forEach(pair => {
      console.log(`   Пара ${pair.id}: ${pair.from_lang} → ${pair.to_lang}`);
    });
    console.log('');

    if (langPairsResult.rows.length === 0) {
      console.log('⚠️  У пользователя нет языковых пар!');
      await pool.end();
      return;
    }

    // Check progress for each language pair
    for (const langPair of langPairsResult.rows) {
      console.log(`\n🔍 Проверка прогресса для пары ${langPair.from_lang} → ${langPair.to_lang} (ID: ${langPair.id}):\n`);

      // Get progress counts
      const progressResult = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM user_word_progress
        WHERE user_id = $1 AND language_pair_id = $2
        GROUP BY status
        ORDER BY status
      `, [user.id, langPair.id]);

      if (progressResult.rows.length === 0) {
        console.log('   ❌ В таблице user_word_progress НЕТ записей для этой пары!');
      } else {
        console.log('   ✅ Статусы в user_word_progress:');
        progressResult.rows.forEach(row => {
          console.log(`      ${row.status.padEnd(15)}: ${row.count} слов`);
        });
      }

      // Check source words table
      const sourceLanguage = langPair.from_lang === 'de' ? 'german' :
                            langPair.from_lang === 'en' ? 'english' :
                            langPair.from_lang === 'es' ? 'spanish' :
                            langPair.from_lang === 'fr' ? 'french' :
                            langPair.from_lang === 'ru' ? 'russian' :
                            langPair.from_lang === 'it' ? 'italian' :
                            langPair.from_lang === 'pt' ? 'portuguese' :
                            langPair.from_lang === 'zh' ? 'chinese' :
                            langPair.from_lang === 'ja' ? 'japanese' :
                            langPair.from_lang === 'ko' ? 'korean' :
                            langPair.from_lang === 'hi' ? 'hindi' :
                            langPair.from_lang === 'ar' ? 'arabic' :
                            langPair.from_lang === 'tr' ? 'turkish' :
                            langPair.from_lang === 'uk' ? 'ukrainian' :
                            langPair.from_lang === 'pl' ? 'polish' :
                            langPair.from_lang === 'ro' ? 'romanian' :
                            langPair.from_lang === 'sr' ? 'serbian' :
                            langPair.from_lang === 'sw' ? 'swahili' :
                            langPair.from_lang;

      const sourceWordsResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM source_words_${sourceLanguage}
      `);

      console.log(`\n   📖 Доступно слов в source_words_${sourceLanguage}: ${sourceWordsResult.rows[0].total}`);
    }

    // Also check old words table (if any)
    const oldWordsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM words
      WHERE user_id = $1
    `, [user.id]);

    console.log(`\n📊 Старая таблица words: ${oldWordsResult.rows[0].count} записей`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }

  await pool.end();
}

checkDemoUserProgress();
