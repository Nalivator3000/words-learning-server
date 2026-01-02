const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkFluentFlowDemoUser() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ПРОВЕРКА ДЕМО-ПОЛЬЗОВАТЕЛЯ demo@fluentflow.app         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Find demo user
    const userResult = await pool.query(`
      SELECT id, email, name
      FROM users
      WHERE email = 'demo@fluentflow.app'
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь demo@fluentflow.app не найден!\n');

      // Show all demo users
      const allDemoUsers = await pool.query(`
        SELECT id, email, name
        FROM users
        WHERE email LIKE '%demo%' OR email LIKE '%test%'
        ORDER BY createdat DESC
        LIMIT 10
      `);

      console.log('📋 Найденные демо/тестовые пользователи:\n');
      allDemoUsers.rows.forEach(u => {
        console.log(`   ${u.email.padEnd(40)} (ID: ${u.id})`);
      });

      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Пользователь найден:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}\n`);

    // Get user's language pairs
    const langPairsResult = await pool.query(`
      SELECT id, from_lang, to_lang, name
      FROM language_pairs
      WHERE user_id = $1
    `, [user.id]);

    console.log(`📚 Языковые пары пользователя: ${langPairsResult.rows.length}`);
    if (langPairsResult.rows.length > 0) {
      langPairsResult.rows.forEach(pair => {
        console.log(`   Пара ${pair.id}: ${pair.name} (${pair.from_lang} → ${pair.to_lang})`);
      });
    } else {
      console.log('   ⚠️  У пользователя нет языковых пар!');
    }
    console.log('');

    // Check progress for each language pair
    for (const langPair of langPairsResult.rows) {
      console.log(`\n🔍 Проверка прогресса для пары ${langPair.name} (ID: ${langPair.id}):\n`);

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
        let total = 0;
        progressResult.rows.forEach(row => {
          console.log(`      ${row.status.padEnd(15)}: ${row.count} слов`);
          total += parseInt(row.count);
        });
        console.log(`      ${'ВСЕГО'.padEnd(15)}: ${total} слов`);
      }
    }

    // Check old words table
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

checkFluentFlowDemoUser();
