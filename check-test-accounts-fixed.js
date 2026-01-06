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
          lp.id as pair_id,
          lp.from_lang,
          lp.to_lang,
          u.email
        FROM language_pairs lp
        JOIN users u ON u.id = lp.user_id
        WHERE lp.user_id = $1 AND lp.is_active = true
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
        pair.from_lang === account.expected.from &&
        pair.to_lang === account.expected.to;

      if (isCorrect) {
        correct.push({
          ...account,
          actual: {
            from: pair.from_lang,
            to: pair.to_lang
          }
        });
      } else {
        errors.push({
          ...account,
          error: 'WRONG_LANGUAGE_PAIR',
          expected: account.expected,
          actual: {
            from: pair.from_lang,
            to: pair.to_lang
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
        console.log(`  Реально:   ${err.actual.from} → ${err.actual.to}`);
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
        console.log(`UPDATE language_pairs SET`);
        console.log(`  from_lang = '${err.expected.from}',`);
        console.log(`  to_lang = '${err.expected.to}'`);
        console.log(`WHERE user_id = ${err.id} AND is_active = true;`);
        console.log('');
      });
    }

    // Создаем скрипт для автоматического исправления
    console.log('\n💾 Сохраняю скрипт исправления...');
    const fs = require('fs');
    const fixScript = wrongPairs.map(err => `
-- ${err.email}
UPDATE language_pairs SET
  from_lang = '${err.expected.from}',
  to_lang = '${err.expected.to}'
WHERE user_id = ${err.id} AND is_active = true;
`).join('\n');

    fs.writeFileSync('fix-test-accounts-language-pairs.sql', fixScript);
    console.log('✅ Скрипт сохранен: fix-test-accounts-language-pairs.sql');

    // Также создаем Node.js скрипт для автоисправления
    const fixNodeScript = `const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: false
});

const fixes = ${JSON.stringify(wrongPairs, null, 2)};

async function fixLanguagePairs() {
  console.log('🔧 Исправление языковых пар для тестовых аккаунтов...\\n');

  for (const fix of fixes) {
    try {
      const result = await pool.query(\`
        UPDATE language_pairs SET
          from_lang = $1,
          to_lang = $2
        WHERE user_id = $3 AND is_active = true
        RETURNING id, from_lang, to_lang
      \`, [fix.expected.from, fix.expected.to, fix.id]);

      if (result.rows.length > 0) {
        console.log(\`✅ \${fix.email}: \${result.rows[0].from_lang} → \${result.rows[0].to_lang}\`);
      } else {
        console.log(\`⚠️  \${fix.email}: Языковая пара не найдена\`);
      }
    } catch (error) {
      console.error(\`❌ \${fix.email}: \${error.message}\`);
    }
  }

  console.log('\\n✅ Исправление завершено!');
  await pool.end();
}

fixLanguagePairs().catch(err => {
  console.error('❌ Ошибка:', err);
  pool.end();
});
`;

    fs.writeFileSync('fix-test-accounts-auto.js', fixNodeScript);
    console.log('✅ Node.js скрипт сохранен: fix-test-accounts-auto.js');
    console.log('\nЧтобы применить исправления, выполните:');
    console.log('  DATABASE_URL="..." node fix-test-accounts-auto.js');
  } else {
    console.log('🎉 Все аккаунты имеют правильные языковые пары!');
  }

  // Показываем несколько примеров корректных аккаунтов
  if (correct.length > 0) {
    console.log('\n\n✅ ПРИМЕРЫ КОРРЕКТНЫХ АККАУНТОВ:');
    correct.slice(0, 5).forEach(acc => {
      console.log(`  ${acc.email}: ${acc.actual.from} → ${acc.actual.to}`);
    });
    if (correct.length > 5) {
      console.log(`  ... и еще ${correct.length - 5} аккаунтов`);
    }
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
