const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Priority groups from test-users.js
const PRIORITY_GROUPS = {
  HIGH: ['test_de_en', 'test_de_ru', 'test_en_ru', 'test_en_de'],
  MEDIUM: ['test_de_es', 'test_de_fr', 'test_en_es', 'test_hi_en', 'test_hi_de'],
  LOW: ['test_ar_en', 'test_zh_en', 'test_ja_en'],
  EMPTY: ['test_ru_en', 'test_ru_de']
};

async function verifyTestAccounts() {
  const client = await pool.connect();

  try {
    console.log('🔍 Проверка тестовых аккаунтов для ручного тестирования\n');
    console.log('=' .repeat(80));

    const results = {
      HIGH: [],
      MEDIUM: [],
      LOW: [],
      EMPTY: [],
      errors: []
    };

    // Get all test users
    const usersResult = await client.query(`
      SELECT u.id, u.username, u.email,
             lp.from_lang, lp.to_lang, lp.name as pair_name
      FROM users u
      LEFT JOIN language_pairs lp ON u.id = lp.user_id
      WHERE u.email LIKE 'test.%@lexibooster.test'
      ORDER BY u.username
    `);

    console.log(`\n📊 Всего найдено тестовых пользователей: ${usersResult.rows.length}\n`);

    // Check each priority group
    for (const [priority, usernames] of Object.entries(PRIORITY_GROUPS)) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎯 ${priority} PRIORITY`);
      console.log('='.repeat(80));

      for (const username of usernames) {
        const user = usersResult.rows.find(u => u.username === username);

        if (!user) {
          console.log(`\n❌ ${username}`);
          console.log(`   Status: NOT FOUND`);
          results.errors.push({ username, error: 'User not found' });
          continue;
        }

        // Get word sets count
        const wordSetsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM word_sets
          WHERE source_language = $1
        `, [user.from_lang]);

        const wordSetsCount = parseInt(wordSetsResult.rows[0].count);

        // Check if has themes
        const themesResult = await client.query(`
          SELECT COUNT(DISTINCT theme) as theme_count
          FROM word_sets
          WHERE source_language = $1 AND theme IS NOT NULL AND theme != ''
        `, [user.from_lang]);

        const themeCount = parseInt(themesResult.rows[0].theme_count);
        const hasThemes = themeCount > 0;

        // Get user's custom words count
        const customWordsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM words
          WHERE user_id = $1
        `, [user.id]);

        const customWordsCount = parseInt(customWordsResult.rows[0].count);

        console.log(`\n✅ ${username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Language Pair: ${user.from_lang} → ${user.to_lang}`);
        console.log(`   Pair Name: ${user.pair_name || 'N/A'}`);
        console.log(`   Word Sets Available: ${wordSetsCount}`);
        console.log(`   Has Themes: ${hasThemes ? 'Yes (' + themeCount + ' themes)' : 'No'}`);
        console.log(`   Custom Words: ${customWordsCount}`);

        results[priority].push({
          username,
          email: user.email,
          userId: user.id,
          fromLang: user.from_lang,
          toLang: user.to_lang,
          wordSets: wordSetsCount,
          themes: themeCount,
          hasThemes,
          customWords: customWordsCount
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 ИТОГОВАЯ СВОДКА');
    console.log('='.repeat(80));

    console.log(`\n⭐ HIGH PRIORITY (обязательно протестировать):`);
    console.log(`   Проверено: ${results.HIGH.length}/${PRIORITY_GROUPS.HIGH.length}`);
    results.HIGH.forEach(u => {
      console.log(`   ✓ ${u.username} - ${u.fromLang}→${u.toLang} (${u.wordSets} sets${u.hasThemes ? ', with themes' : ''})`);
    });

    console.log(`\n⚡ MEDIUM PRIORITY:`);
    console.log(`   Проверено: ${results.MEDIUM.length}/${PRIORITY_GROUPS.MEDIUM.length}`);
    results.MEDIUM.forEach(u => {
      console.log(`   ✓ ${u.username} - ${u.fromLang}→${u.toLang} (${u.wordSets} sets${u.hasThemes ? ', with themes' : ''})`);
    });

    console.log(`\n🔍 LOW PRIORITY:`);
    console.log(`   Проверено: ${results.LOW.length}/${PRIORITY_GROUPS.LOW.length}`);
    results.LOW.forEach(u => {
      console.log(`   ✓ ${u.username} - ${u.fromLang}→${u.toLang} (${u.wordSets} sets)`);
    });

    console.log(`\n🗑️  EMPTY STATE:`);
    console.log(`   Проверено: ${results.EMPTY.length}/${PRIORITY_GROUPS.EMPTY.length}`);
    results.EMPTY.forEach(u => {
      console.log(`   ✓ ${u.username} - ${u.fromLang}→${u.toLang} (${u.wordSets} sets - EMPTY)`);
    });

    if (results.errors.length > 0) {
      console.log(`\n❌ ОШИБКИ:`);
      results.errors.forEach(err => {
        console.log(`   ✗ ${err.username}: ${err.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔑 CREDENTIALS');
    console.log('='.repeat(80));
    console.log('\nPassword for ALL test accounts: test123');
    console.log('\nExample login:');
    console.log('  Email: test.de.en@lexibooster.test');
    console.log('  Password: test123');

    console.log('\n' + '='.repeat(80));
    console.log('🚀 QUICK START');
    console.log('='.repeat(80));
    console.log('\n1. Откройте: https://words-learning-server-production.up.railway.app');
    console.log('2. Войдите с любым аккаунтом из HIGH PRIORITY');
    console.log('3. Начинайте тестирование!');
    console.log('\n📖 Полное руководство: MANUAL_TESTING_GUIDE.md\n');

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTestAccounts();
