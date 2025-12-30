const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const client = new Client({ connectionString });

async function checkUserWords(email) {
  try {
    await client.connect();
    console.log('Подключено к базе данных\n');

    // Найдем пользователя
    const userResult = await client.query(`
      SELECT id, username, name, email, createdat
      FROM users
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log(`❌ Пользователь с email ${email} не найден`);
      return;
    }

    const user = userResult.rows[0];
    console.log('Информация о пользователе:');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username || 'не указан'}`);
    console.log(`Name: ${user.name || 'не указан'}`);
    console.log(`Email: ${user.email}`);
    console.log(`Зарегистрирован: ${new Date(user.createdat).toLocaleString('ru-RU')}\n`);

    // Получим список всех таблиц, содержащих "word" или "user"
    console.log('='.repeat(70));
    console.log('\n📋 Доступные таблицы в базе данных:\n');

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE '%word%' OR table_name LIKE '%user%')
      ORDER BY table_name
    `);

    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📚 Проверка данных пользователя:\n');

    // Проверим user_word_progress
    try {
      const progressResult = await client.query(`
        SELECT COUNT(*) as count
        FROM user_word_progress
        WHERE user_id = $1
      `, [user.id]);

      console.log(`Слов в user_word_progress: ${progressResult.rows[0].count}`);

      if (parseInt(progressResult.rows[0].count) > 0) {
        const progressStats = await client.query(`
          SELECT
            status,
            COUNT(*) as count,
            AVG(confidence_level) as avg_confidence
          FROM user_word_progress
          WHERE user_id = $1
          GROUP BY status
        `, [user.id]);

        console.log('\nСтатистика по статусам:');
        console.log('-'.repeat(70));
        progressStats.rows.forEach(stat => {
          console.log(`  ${stat.status}: ${stat.count} слов (средний уровень: ${parseFloat(stat.avg_confidence).toFixed(2)})`);
        });

        const progressDetails = await client.query(`
          SELECT uwp.word_id, uwp.status, uwp.confidence_level,
                 uwp.last_reviewed, uwp.review_count
          FROM user_word_progress uwp
          WHERE uwp.user_id = $1
          ORDER BY uwp.last_reviewed DESC NULLS LAST
          LIMIT 10
        `, [user.id]);

        console.log('\nПоследние 10 слов с прогрессом:');
        console.log('-'.repeat(70));
        progressDetails.rows.forEach((word, index) => {
          console.log(`\n${index + 1}. Word ID: ${word.word_id}`);
          console.log(`   Status: ${word.status}`);
          console.log(`   Уровень: ${word.confidence_level}`);
          console.log(`   Последний просмотр: ${word.last_reviewed ? new Date(word.last_reviewed).toLocaleString('ru-RU') : 'никогда'}`);
          console.log(`   Повторений: ${word.review_count || 0}`);
        });
      }
    } catch (err) {
      console.log(`⚠️  Таблица user_word_progress недоступна: ${err.message}`);
    }

    // Проверим custom_words (пользовательские слова)
    try {
      const customWordsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM custom_words
        WHERE user_id = $1
      `, [user.id]);

      console.log(`\nПользовательских слов (custom_words): ${customWordsResult.rows[0].count}`);

      if (parseInt(customWordsResult.rows[0].count) > 0) {
        const customWords = await client.query(`
          SELECT id, word, translation, created_at
          FROM custom_words
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 10
        `, [user.id]);

        console.log('\nПоследние добавленные пользовательские слова:');
        console.log('-'.repeat(70));
        customWords.rows.forEach((word, index) => {
          console.log(`\n${index + 1}. ${word.word} - ${word.translation}`);
          console.log(`   ID: ${word.id}`);
          console.log(`   Добавлено: ${new Date(word.created_at).toLocaleString('ru-RU')}`);
        });
      }
    } catch (err) {
      console.log(`\n⚠️  Таблица custom_words недоступна: ${err.message}`);
    }

    // Проверим vocabulary (основные слова)
    try {
      const vocabResult = await client.query(`
        SELECT COUNT(*) as count
        FROM vocabulary
        WHERE user_id = $1
      `, [user.id]);

      console.log(`\nСлов в vocabulary: ${vocabResult.rows[0].count}`);
    } catch (err) {
      console.log(`\n⚠️  Таблица vocabulary недоступна или не имеет user_id: ${err.message}`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const email = process.argv[2] || 'mishasave@gmail.com';
checkUserWords(email);
