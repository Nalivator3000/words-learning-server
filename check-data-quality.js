const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const languages = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'russian', 'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
  'romanian', 'serbian', 'korean', 'hindi', 'japanese', 'swahili'
];

async function checkDataQuality() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ПРОВЕРКА КАЧЕСТВА ДАННЫХ - ВСЕ ЯЗЫКИ                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const issues = {
    duplicates: [],
    placeholders: [],
    emptyFields: [],
    suspiciousPatterns: []
  };

  for (const lang of languages) {
    const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
    console.log(`\n🔍 Проверяю ${langName}...`);

    try {
      // 1. Проверка дубликатов (точных)
      const duplicates = await pool.query(`
        SELECT word, COUNT(*) as count
        FROM source_words_${lang}
        GROUP BY word
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 10
      `);

      if (duplicates.rows.length > 0) {
        console.log(`   ❌ Найдено ${duplicates.rows.length} групп дубликатов:`);
        duplicates.rows.slice(0, 5).forEach(row => {
          console.log(`      "${row.word}" (${row.count}x)`);
        });
        issues.duplicates.push({ lang, count: duplicates.rows.length });
      } else {
        console.log(`   ✅ Дубликаты не найдены`);
      }

      // 2. Проверка плейсхолдеров
      const placeholders = await pool.query(`
        SELECT word, example_en
        FROM source_words_${lang}
        WHERE word LIKE '%placeholder%'
           OR word LIKE '%PLACEHOLDER%'
           OR word LIKE '%example%'
           OR word LIKE '%EXAMPLE%'
           OR word LIKE '%TODO%'
           OR word LIKE '%test%'
           OR word LIKE '%TEST%'
           OR example_en LIKE '%placeholder%'
           OR example_en LIKE '%PLACEHOLDER%'
        LIMIT 10
      `);

      if (placeholders.rows.length > 0) {
        console.log(`   ❌ Найдены плейсхолдеры (${placeholders.rows.length}):`);
        placeholders.rows.slice(0, 3).forEach(row => {
          console.log(`      "${row.word}"`);
        });
        issues.placeholders.push({ lang, count: placeholders.rows.length });
      } else {
        console.log(`   ✅ Плейсхолдеры не найдены`);
      }

      // 3. Проверка пустых полей
      const emptyFields = await pool.query(`
        SELECT COUNT(*) as count
        FROM source_words_${lang}
        WHERE word IS NULL
           OR word = ''
           OR TRIM(word) = ''
      `);

      const emptyCount = parseInt(emptyFields.rows[0].count);
      if (emptyCount > 0) {
        console.log(`   ❌ Найдены пустые поля: ${emptyCount}`);
        issues.emptyFields.push({ lang, count: emptyCount });
      } else {
        console.log(`   ✅ Пустые поля не найдены`);
      }

      // 4. Проверка подозрительных паттернов (слишком длинные слова, цифры вместо слов и т.д.)
      const suspicious = await pool.query(`
        SELECT word
        FROM source_words_${lang}
        WHERE LENGTH(word) > 100
           OR word ~ '^[0-9]+$'
           OR word LIKE '%synthetic%'
           OR word LIKE '%SYNTHETIC%'
        LIMIT 10
      `);

      if (suspicious.rows.length > 0) {
        console.log(`   ⚠️  Подозрительные записи (${suspicious.rows.length}):`);
        suspicious.rows.slice(0, 3).forEach(row => {
          const wordPreview = row.word.length > 40 ? row.word.substring(0, 40) + '...' : row.word;
          console.log(`      "${wordPreview}"`);
        });
        issues.suspiciousPatterns.push({ lang, count: suspicious.rows.length });
      } else {
        console.log(`   ✅ Подозрительные паттерны не найдены`);
      }

      // 5. Проверка на английские слова в неанглийских языках (только для некоторых)
      if (lang !== 'english') {
        const englishWords = await pool.query(`
          SELECT word, translation
          FROM source_words_${lang}
          WHERE word ~ '^[a-zA-Z\\s]+$'
            AND LENGTH(word) > 3
            AND word NOT LIKE '%_%'
          LIMIT 5
        `);

        if (englishWords.rows.length > 0 && !['german', 'french', 'spanish', 'italian', 'portuguese', 'polish', 'romanian', 'serbian', 'turkish'].includes(lang)) {
          console.log(`   ⚠️  Возможны английские слова в словаре (${englishWords.rows.length}):`);
          englishWords.rows.slice(0, 2).forEach(row => {
            console.log(`      "${row.word}"`);
          });
        }
      }

      // 6. Статистика по частоте слов
      const wordStats = await pool.query(`
        SELECT
          COUNT(DISTINCT word) as unique_words,
          COUNT(*) as total_entries
        FROM source_words_${lang}
      `);

      const stats = wordStats.rows[0];
      const duplicateRatio = ((stats.total_entries - stats.unique_words) / stats.total_entries * 100).toFixed(2);

      if (duplicateRatio > 10) {
        console.log(`   ⚠️  Высокий процент дубликатов: ${duplicateRatio}%`);
      } else {
        console.log(`   ✅ Уникальность: ${(100 - duplicateRatio).toFixed(2)}%`);
      }

    } catch (error) {
      console.log(`   ❌ Ошибка при проверке: ${error.message}`);
    }
  }

  // Итоговый отчёт
  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ИТОГОВЫЙ ОТЧЁТ:\n');

  if (issues.duplicates.length > 0) {
    console.log('❌ Языки с дубликатами:');
    issues.duplicates.forEach(item => {
      console.log(`   - ${item.lang}: ${item.count} групп`);
    });
    console.log('');
  }

  if (issues.placeholders.length > 0) {
    console.log('❌ Языки с плейсхолдерами:');
    issues.placeholders.forEach(item => {
      console.log(`   - ${item.lang}: ${item.count} записей`);
    });
    console.log('');
  }

  if (issues.emptyFields.length > 0) {
    console.log('❌ Языки с пустыми полями:');
    issues.emptyFields.forEach(item => {
      console.log(`   - ${item.lang}: ${item.count} записей`);
    });
    console.log('');
  }

  if (issues.suspiciousPatterns.length > 0) {
    console.log('⚠️  Языки с подозрительными паттернами:');
    issues.suspiciousPatterns.forEach(item => {
      console.log(`   - ${item.lang}: ${item.count} записей`);
    });
    console.log('');
  }

  const totalIssues = issues.duplicates.length + issues.placeholders.length +
                      issues.emptyFields.length + issues.suspiciousPatterns.length;

  if (totalIssues === 0) {
    console.log('✅ Все проверки пройдены успешно! Данные в порядке.\n');
  } else {
    console.log(`⚠️  Найдено проблем в ${totalIssues} категориях.\n`);
  }

  await pool.end();
}

checkDataQuality();
