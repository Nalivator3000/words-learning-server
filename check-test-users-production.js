const { Pool } = require('pg');

// Production database connection string
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkTestUsers() {
  try {
    console.log('🔍 Проверка тестовых пользователей на production...\n');

    // Check how many test users exist
    const result = await pool.query(`
      SELECT email, username, id
      FROM users
      WHERE email LIKE 'test.%@lexibooster.test'
      ORDER BY email
    `);

    console.log(`✅ Найдено тестовых пользователей: ${result.rows.length}\n`);

    if (result.rows.length > 0) {
      console.log('Список тестовых пользователей:');
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.email} (ID: ${row.id}, username: ${row.username || 'N/A'})`);
      });
    } else {
      console.log('❌ ПРОБЛЕМА: Тестовые пользователи не найдены!');
      console.log('\n💡 РЕШЕНИЕ: Запустите скрипт создания тестовых пользователей:');
      console.log('   node scripts/create-test-users.js\n');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTestUsers();
