const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: false
});

const TEST_ACCOUNTS = [
  { id: 50, email: 'test.de.en@lexibooster.test', expected: { from: 'de', to: 'en' } },
  { id: 51, email: 'test.de.ru@lexibooster.test', expected: { from: 'de', to: 'ru' } },
  { id: 52, email: 'test.de.es@lexibooster.test', expected: { from: 'de', to: 'es' } },
  { id: 53, email: 'test.de.fr@lexibooster.test', expected: { from: 'de', to: 'fr' } },
  { id: 54, email: 'test.de.it@lexibooster.test', expected: { from: 'de', to: 'it' } },
  { id: 55, email: 'test.de.pt@lexibooster.test', expected: { from: 'de', to: 'pt' } },
  { id: 56, email: 'test.de.ar@lexibooster.test', expected: { from: 'de', to: 'ar' } },
  { id: 57, email: 'test.de.zh@lexibooster.test', expected: { from: 'de', to: 'zh' } },
  { id: 58, email: 'test.de.ja@lexibooster.test', expected: { from: 'de', to: 'ja' } },
  { id: 59, email: 'test.de.tr@lexibooster.test', expected: { from: 'de', to: 'tr' } },
  { id: 60, email: 'test.en.ru@lexibooster.test', expected: { from: 'en', to: 'ru' } },
  { id: 61, email: 'test.en.de@lexibooster.test', expected: { from: 'en', to: 'de' } },
  { id: 62, email: 'test.en.es@lexibooster.test', expected: { from: 'en', to: 'es' } },
  { id: 63, email: 'test.en.fr@lexibooster.test', expected: { from: 'en', to: 'fr' } },
  { id: 64, email: 'test.en.it@lexibooster.test', expected: { from: 'en', to: 'it' } },
  { id: 65, email: 'test.en.pt@lexibooster.test', expected: { from: 'en', to: 'pt' } },
  { id: 66, email: 'test.en.ar@lexibooster.test', expected: { from: 'en', to: 'ar' } },
  { id: 67, email: 'test.en.zh@lexibooster.test', expected: { from: 'en', to: 'zh' } },
  { id: 68, email: 'test.en.ja@lexibooster.test', expected: { from: 'en', to: 'ja' } },
  { id: 69, email: 'test.en.tr@lexibooster.test', expected: { from: 'en', to: 'tr' } },
  { id: 70, email: 'test.es.en@lexibooster.test', expected: { from: 'es', to: 'en' } },
  { id: 71, email: 'test.es.de@lexibooster.test', expected: { from: 'es', to: 'de' } },
  { id: 72, email: 'test.es.fr@lexibooster.test', expected: { from: 'es', to: 'fr' } },
  { id: 73, email: 'test.es.pt@lexibooster.test', expected: { from: 'es', to: 'pt' } },
  { id: 74, email: 'test.fr.en@lexibooster.test', expected: { from: 'fr', to: 'en' } },
  { id: 75, email: 'test.fr.de@lexibooster.test', expected: { from: 'fr', to: 'de' } },
  { id: 76, email: 'test.fr.es@lexibooster.test', expected: { from: 'fr', to: 'es' } },
  { id: 77, email: 'test.it.en@lexibooster.test', expected: { from: 'it', to: 'en' } },
  { id: 78, email: 'test.it.de@lexibooster.test', expected: { from: 'it', to: 'de' } },
  { id: 79, email: 'test.pt.en@lexibooster.test', expected: { from: 'pt', to: 'en' } },
  { id: 80, email: 'test.pt.de@lexibooster.test', expected: { from: 'pt', to: 'de' } },
  { id: 81, email: 'test.ar.en@lexibooster.test', expected: { from: 'ar', to: 'en' } },
  { id: 82, email: 'test.ar.de@lexibooster.test', expected: { from: 'ar', to: 'de' } },
  { id: 83, email: 'test.zh.en@lexibooster.test', expected: { from: 'zh', to: 'en' } },
  { id: 84, email: 'test.zh.de@lexibooster.test', expected: { from: 'zh', to: 'de' } },
  { id: 85, email: 'test.ru.en@lexibooster.test', expected: { from: 'ru', to: 'en' } },
  { id: 86, email: 'test.ru.de@lexibooster.test', expected: { from: 'ru', to: 'de' } },
  { id: 87, email: 'test.hi.en@lexibooster.test', expected: { from: 'hi', to: 'en' } },
  { id: 88, email: 'test.hi.de@lexibooster.test', expected: { from: 'hi', to: 'de' } },
];

async function checkAllTestAccounts() {
  console.log('🔍 Проверка языковых пар всех тестовых аккаунтов...\n');

  const errors = [];
  const correct = [];

  for (const account of TEST_ACCOUNTS) {
    try {
      const result = await pool.query(`
        SELECT
          ulp.id as pair_id,
          ulp.from_language,
          ulp.to_language,
          ulp.source_language,
          u.email
        FROM user_language_pairs ulp
        JOIN users u ON u.id = ulp.user_id
        WHERE ulp.user_id = $1
      `, [account.id]);

      if (result.rows.length === 0) {
        errors.push({
          ...account,
          error: 'NO_LANGUAGE_PAIR',
          message: 'Языковая пара не найдена'
        });
        continue;
      }

      const pair = result.rows[0];
      const isCorrect =
        pair.from_language === account.expected.from &&
        pair.to_language === account.expected.to &&
        pair.source_language === account.expected.from;

      if (isCorrect) {
        correct.push({
          ...account,
          actual: {
            from: pair.from_language,
            to: pair.to_language,
            source: pair.source_language
          }
        });
      } else {
        errors.push({
          ...account,
          error: 'WRONG_LANGUAGE_PAIR',
          expected: account.expected,
          actual: {
            from: pair.from_language,
            to: pair.to_language,
            source: pair.source_language
          }
        });
      }
    } catch (error) {
      errors.push({
        ...account,
        error: 'DATABASE_ERROR',
        message: error.message
      });
    }
  }

  console.log(`✅ Корректных аккаунтов: ${correct.length}/${TEST_ACCOUNTS.length}`);
  console.log(`❌ Аккаунтов с ошибками: ${errors.length}/${TEST_ACCOUNTS.length}\n`);

  if (errors.length > 0) {
    console.log('❌ АККАУНТЫ С ОШИБКАМИ:\n');
    errors.forEach(err => {
      console.log(`ID: ${err.id} | ${err.email}`);
      if (err.error === 'WRONG_LANGUAGE_PAIR') {
        console.log(`  Ожидается: ${err.expected.from} → ${err.expected.to}`);
        console.log(`  Реально:   ${err.actual.from} → ${err.actual.to} (source: ${err.actual.source})`);
      } else {
        console.log(`  Ошибка: ${err.message || err.error}`);
      }
      console.log('');
    });

    // Группировка по типам ошибок
    const wrongPairs = errors.filter(e => e.error === 'WRONG_LANGUAGE_PAIR');
    const noPairs = errors.filter(e => e.error === 'NO_LANGUAGE_PAIR');

    console.log('\n📊 СТАТИСТИКА ОШИБОК:');
    console.log(`  Неправильные пары: ${wrongPairs.length}`);
    console.log(`  Отсутствующие пары: ${noPairs.length}`);
    console.log(`  Другие ошибки: ${errors.length - wrongPairs.length - noPairs.length}`);

    // Предлагаем SQL для исправления
    if (wrongPairs.length > 0) {
      console.log('\n\n🔧 SQL для исправления неправильных пар:\n');
      wrongPairs.forEach(err => {
        console.log(`-- ${err.email}`);
        console.log(`UPDATE user_language_pairs SET`);
        console.log(`  from_language = '${err.expected.from}',`);
        console.log(`  to_language = '${err.expected.to}',`);
        console.log(`  source_language = '${err.expected.from}'`);
        console.log(`WHERE user_id = ${err.id};`);
        console.log('');
      });
    }

    // Создаем скрипт для автоматического исправления
    console.log('\n💾 Сохраняю скрипт исправления...');
    const fs = require('fs');
    const fixScript = wrongPairs.map(err => `
-- ${err.email}
UPDATE user_language_pairs SET
  from_language = '${err.expected.from}',
  to_language = '${err.expected.to}',
  source_language = '${err.expected.from}'
WHERE user_id = ${err.id};
`).join('\n');

    fs.writeFileSync('fix-test-accounts-language-pairs.sql', fixScript);
    console.log('✅ Скрипт сохранен: fix-test-accounts-language-pairs.sql');
  } else {
    console.log('🎉 Все аккаунты имеют правильные языковые пары!');
  }
}

async function main() {
  try {
    await checkAllTestAccounts();
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

main();
