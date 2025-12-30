const { Client } = require('pg');
const bcrypt = require('bcrypt');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const client = new Client({ connectionString });

async function createTestUser() {
  try {
    await client.connect();
    console.log('Подключено к базе данных\n');

    const email = 'test.onboarding@lexibooster.test';
    const password = 'Test123!';
    const name = 'Onboarding Tester';

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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const result = await client.query(`
      INSERT INTO users (
        name, email, password, provider,
        createdat, updatedat,
        total_xp, level, current_streak, longest_streak
      ) VALUES ($1, $2, $3, 'local', NOW(), NOW(), 0, 1, 0, 0)
      RETURNING id, name, email, createdat
    `, [name, email, hashedPassword]);

    const user = result.rows[0];

    console.log('='.repeat(70));
    console.log('✅ Тестовый пользователь успешно создан!');
    console.log('='.repeat(70));
    console.log('\n📋 Данные для входа:\n');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('\n👤 Информация о пользователе:\n');
    console.log(`  ID:       ${user.id}`);
    console.log(`  Name:     ${user.name}`);
    console.log(`  Created:  ${new Date(user.createdat).toLocaleString('ru-RU')}`);
    console.log('\n='.repeat(70));
    console.log('\n💡 Используйте эти данные для входа и прохождения онбординга!');
    console.log('   После входа вы будете перенаправлены на онбординг.\n');

  } catch (err) {
    console.error('❌ Ошибка при создании пользователя:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUser();
