const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const client = new Client({ connectionString });

async function getTodayUsers() {
  try {
    await client.connect();
    console.log('Подключено к базе данных\n');

    const result = await client.query(`
      SELECT id, username, name, email, createdat, is_beta_tester,
             country, city, total_xp, level, current_streak
      FROM users
      WHERE DATE(createdat) = CURRENT_DATE
      ORDER BY createdat DESC
    `);

    const today = new Date().toLocaleDateString('ru-RU');
    console.log(`Пользователи, зарегистрированные сегодня (${today}):\n`);

    if (result.rows.length === 0) {
      console.log('❌ Нет пользователей, зарегистрированных сегодня.');
    } else {
      console.log(`✅ Всего: ${result.rows.length} пользователей\n`);
      console.log('='.repeat(70));

      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. ID: ${user.id}`);
        console.log(`   Username: ${user.username || 'не указан'}`);
        console.log(`   Name: ${user.name || 'не указан'}`);
        console.log(`   Email: ${user.email || 'не указан'}`);
        if (user.country) console.log(`   Страна: ${user.country}`);
        if (user.city) console.log(`   Город: ${user.city}`);
        console.log(`   Beta-тестер: ${user.is_beta_tester ? 'Да' : 'Нет'}`);
        console.log(`   XP: ${user.total_xp || 0}`);
        console.log(`   Уровень: ${user.level || 1}`);
        console.log(`   Текущая серия: ${user.current_streak || 0} дней`);
        console.log(`   Время регистрации: ${new Date(user.createdat).toLocaleString('ru-RU')}`);
      });

      console.log('\n' + '='.repeat(70));
      console.log(`\nИтого зарегистрировано сегодня: ${result.rows.length} пользователей`);
    }

  } catch (err) {
    console.error('❌ Ошибка при получении данных:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

getTodayUsers();
