const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const client = new Client({ connectionString });

async function deleteUser(email) {
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
    console.log('Найден пользователь для удаления:');
    console.log('='.repeat(70));
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username || 'не указан'}`);
    console.log(`Name: ${user.name || 'не указан'}`);
    console.log(`Email: ${user.email}`);
    console.log(`Зарегистрирован: ${new Date(user.createdat).toLocaleString('ru-RU')}`);
    console.log('='.repeat(70));
    console.log('\n⚠️  Удаление пользователя...\n');

    await client.query('BEGIN');

    try {
      // Удаляем связанные данные из всех таблиц
      const tablesToClean = [
        'user_word_progress',
        'user_learning_profile',
        'user_settings',
        'user_stats',
        'user_profiles',
        'user_achievements',
        'user_badges',
        'user_daily_challenges',
        'user_inventory',
        'user_leagues',
        'user_milestones',
        'user_purchases',
        'word_learning_progress',
        'word_srs_data'
      ];

      let deletedCounts = {};

      for (const table of tablesToClean) {
        try {
          const result = await client.query(
            `DELETE FROM ${table} WHERE user_id = $1`,
            [user.id]
          );
          if (result.rowCount > 0) {
            deletedCounts[table] = result.rowCount;
            console.log(`  ✓ Удалено из ${table}: ${result.rowCount} записей`);
          }
        } catch (err) {
          // Таблица может не существовать или не иметь поле user_id
          console.log(`  ⚠️  ${table}: ${err.message}`);
        }
      }

      // Удаляем language_pairs пользователя
      try {
        const lpResult = await client.query(
          'DELETE FROM language_pairs WHERE user_id = $1',
          [user.id]
        );
        if (lpResult.rowCount > 0) {
          deletedCounts['language_pairs'] = lpResult.rowCount;
          console.log(`  ✓ Удалено из language_pairs: ${lpResult.rowCount} записей`);
        }
      } catch (err) {
        console.log(`  ⚠️  language_pairs: ${err.message}`);
      }

      // Наконец, удаляем самого пользователя
      const deleteResult = await client.query(
        'DELETE FROM users WHERE id = $1',
        [user.id]
      );

      await client.query('COMMIT');

      console.log('\n' + '='.repeat(70));
      console.log('✅ Пользователь успешно удален!');
      console.log('='.repeat(70));

      console.log('\nСводка удаления:');
      console.log(`  - Пользователь: ${user.name} (${user.email})`);

      if (Object.keys(deletedCounts).length > 0) {
        console.log('\n  Удалено связанных данных:');
        Object.entries(deletedCounts).forEach(([table, count]) => {
          console.log(`    - ${table}: ${count}`);
        });
      } else {
        console.log('\n  У пользователя не было связанных данных');
      }

      console.log('\n💡 Пользователь может теперь зарегистрироваться заново и пройти новый онбординг!');

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('\n❌ Ошибка при удалении пользователя:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const email = process.argv[2];

if (!email) {
  console.log('❌ Использование: node delete-user.js <email>');
  console.log('Пример: node delete-user.js user@example.com');
  process.exit(1);
}

console.log(`\n⚠️  ВНИМАНИЕ: Вы собираетесь удалить пользователя с email: ${email}`);
console.log('Это действие необратимо!\n');

// Даем 3 секунды на отмену
setTimeout(() => {
  deleteUser(email);
}, 3000);

console.log('Удаление начнется через 3 секунды... (Ctrl+C для отмены)\n');
