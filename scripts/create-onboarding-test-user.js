const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const client = new Client({ connectionString });

// Helper function for simple password hashing (same as server-side)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Language code mapping
const LANG_CODE_TO_FULL_NAME = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'uk': 'ukrainian', 'pt': 'portuguese', 'it': 'italian',
    'zh': 'chinese', 'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi',
    'ar': 'arabic', 'tr': 'turkish', 'pl': 'polish', 'ro': 'romanian',
    'sr': 'serbian', 'sw': 'swahili'
};

const languageNames = {
    'en': 'English', 'ru': 'Russian', 'de': 'German', 'es': 'Spanish',
    'fr': 'French', 'it': 'Italian', 'pt': 'Portuguese', 'zh': 'Chinese',
    'ja': 'Japanese', 'ko': 'Korean', 'hi': 'Hindi', 'ar': 'Arabic',
    'tr': 'Turkish', 'uk': 'Ukrainian', 'pl': 'Polish', 'ro': 'Romanian',
    'sr': 'Serbian', 'sw': 'Swahili'
};

async function createTestUser() {
  try {
    await client.connect();
    console.log('Подключено к базе данных\n');

    const email = 'test.onboarding@lexibooster.test';
    const password = 'Test123!';
    const name = 'Onboarding Tester';

    // Onboarding settings - automatically set up German → Russian with 100 words
    const nativeLang = 'ru';  // Russian
    const targetLang = 'de';  // German
    const dailyGoalMinutes = 15;

    // Проверим, существует ли пользователь
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Пользователь уже существует. Удаляем...');
      await client.query('DELETE FROM users WHERE email = $1', [email]);
      console.log('✓ Старый пользователь удален\n');
    }

    // Хешируем пароль
    const hashedPassword = hashPassword(password);

    // Создаем пользователя
    const userResult = await client.query(`
      INSERT INTO users (
        name, email, password, provider,
        createdat, updatedat,
        total_xp, level, current_streak, longest_streak
      ) VALUES ($1, $2, $3, 'local', NOW(), NOW(), 0, 1, 0, 0)
      RETURNING id, name, email, createdat
    `, [name, email, hashedPassword]);

    const user = userResult.rows[0];

    // Create language pair
    const targetName = languageNames[targetLang] || targetLang.toUpperCase();
    const nativeName = languageNames[nativeLang] || nativeLang.toUpperCase();
    const pairName = `${targetName} → ${nativeName}`;

    const langPairResult = await client.query(
      'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, pairName, targetLang, nativeLang, true]
    );

    const languagePair = langPairResult.rows[0];

    // Create user profile
    await client.query(`
      INSERT INTO user_profiles (user_id, daily_goal_minutes, daily_xp_goal, daily_tasks_goal, daily_word_goal)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        daily_goal_minutes = $2, daily_xp_goal = $3, daily_tasks_goal = $4, daily_word_goal = $5
    `, [user.id, dailyGoalMinutes, dailyGoalMinutes * 10, dailyGoalMinutes * 10, 5]);

    // Import words
    const sourceLanguage = LANG_CODE_TO_FULL_NAME[targetLang] || targetLang;
    const tableName = `source_words_${sourceLanguage}`;

    const wordSetsResult = await client.query(`
      SELECT id, title, level, theme FROM word_sets
      WHERE source_language = $1 ORDER BY level, theme LIMIT 5
    `, [sourceLanguage]);

    let totalWordsAdded = 0;
    for (const wordSet of wordSetsResult.rows) {
      let wordsResult;
      if (wordSet.level && wordSet.theme) {
        wordsResult = await client.query(`SELECT id FROM ${tableName} WHERE level = $1 AND theme = $2 LIMIT 20`, [wordSet.level, wordSet.theme]);
      } else if (wordSet.level) {
        wordsResult = await client.query(`SELECT id FROM ${tableName} WHERE level = $1 LIMIT 20`, [wordSet.level]);
      } else if (wordSet.theme) {
        wordsResult = await client.query(`SELECT id FROM ${tableName} WHERE theme = $1 LIMIT 20`, [wordSet.theme]);
      } else {
        wordsResult = await client.query(`SELECT id FROM ${tableName} LIMIT 20`);
      }

      for (const word of wordsResult.rows) {
        await client.query(`
          INSERT INTO user_word_progress (user_id, language_pair_id, source_language, source_word_id, status, correct_count, incorrect_count, total_reviews, review_cycle, ease_factor)
          VALUES ($1, $2, $3, $4, 'studying', 0, 0, 0, 1, 2.5)
          ON CONFLICT (user_id, language_pair_id, source_language, source_word_id) DO NOTHING
        `, [user.id, languagePair.id, sourceLanguage, word.id]);
        totalWordsAdded++;
      }
    }

    console.log('='.repeat(70));
    console.log('✅ Тестовый пользователь успешно создан!');
    console.log('='.repeat(70));
    console.log('\n📋 ДАННЫЕ ДЛЯ ВХОДА:\n');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('\n👤 Информация о пользователе:\n');
    console.log(`  ID:       ${user.id}`);
    console.log(`  Name:     ${user.name}`);
    console.log(`  Created:  ${new Date(user.createdat).toLocaleString('ru-RU')}`);
    console.log(`  Language: ${pairName}`);
    console.log(`  Words:    ${totalWordsAdded} imported`);
    console.log('\n='.repeat(70));
    console.log('\n💡 ИНСТРУКЦИЯ:');
    console.log('   1. Откройте приложение');
    console.log('   2. Нажмите "Log In"');
    console.log(`   3. Введите email: ${email}`);
    console.log(`   4. Введите пароль: ${password}`);
    console.log('   5. Теперь вы сразу увидите слова на главной странице!\n');

  } catch (err) {
    console.error('❌ Ошибка при создании пользователя:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUser();
