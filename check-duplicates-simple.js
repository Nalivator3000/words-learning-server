const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const languages = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'russian', 'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
  'romanian', 'serbian', 'korean', 'hindi', 'japanese', 'swahili'
];

async function checkDuplicates() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ПРОВЕРКА ДУБЛИКАТОВ И КАЧЕСТВА ДАННЫХ                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const summary = {
    withDuplicates: [],
    clean: [],
    withPlaceholders: [],
    withEmpty: []
  };

  for (const lang of languages) {
    const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
    console.log(`🔍 ${langName}...`);

    try {
      // 1. Проверка точных дубликатов
      const exactDuplicates = await pool.query(`
        SELECT word, COUNT(*) as count
        FROM source_words_${lang}
        GROUP BY word
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 5
      `);

      if (exactDuplicates.rows.length > 0) {
        console.log(`   ❌ ДУБЛИКАТЫ! Найдено ${exactDuplicates.rows.length} групп:`);
        exactDuplicates.rows.forEach(row => {
          console.log(`      "${row.word}" (${row.count}x)`);
        });
        summary.withDuplicates.push({
          lang,
          count: exactDuplicates.rows.length,
          examples: exactDuplicates.rows
        });
      } else {
        console.log(`   ✅ Дубликаты не найдены`);
        summary.clean.push(lang);
      }

      // 2. Проверка плейсхолдеров
      const placeholders = await pool.query(`
        SELECT word
        FROM source_words_${lang}
        WHERE word LIKE '%placeholder%'
           OR word LIKE '%PLACEHOLDER%'
           OR word LIKE '%synthetic%'
           OR word LIKE '%SYNTHETIC%'
           OR word ~ '^[0-9]+$'
        LIMIT 5
      `);

      if (placeholders.rows.length > 0) {
        console.log(`   ⚠️  Плейсхолдеры/synthetic:`);
        placeholders.rows.forEach(row => {
          console.log(`      "${row.word}"`);
        });
        summary.withPlaceholders.push(lang);
      }

      // 3. Проверка пустых слов
      const empty = await pool.query(`
        SELECT COUNT(*) as count
        FROM source_words_${lang}
        WHERE word IS NULL OR TRIM(word) = ''
      `);

      const emptyCount = parseInt(empty.rows[0].count);
      if (emptyCount > 0) {
        console.log(`   ❌ Пустые слова: ${emptyCount}`);
        summary.withEmpty.push({ lang, count: emptyCount });
      }

      console.log('');

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}\n`);
    }
  }

  // Итоговый отчёт
  console.log('═'.repeat(65));
  console.log('\n📊 ИТОГОВЫЙ ОТЧЁТ:\n');

  console.log(`✅ Чистые языки (без дубликатов): ${summary.clean.length}`);
  if (summary.clean.length > 0) {
    console.log(`   ${summary.clean.join(', ')}`);
  }

  console.log(`\n❌ Языки с дубликатами: ${summary.withDuplicates.length}`);
  if (summary.withDuplicates.length > 0) {
    summary.withDuplicates.forEach(item => {
      console.log(`   - ${item.lang}: ${item.count} групп (макс ${item.examples[0].count}x повторов)`);
    });
  }

  if (summary.withPlaceholders.length > 0) {
    console.log(`\n⚠️  С плейсхолдерами: ${summary.withPlaceholders.join(', ')}`);
  }

  if (summary.withEmpty.length > 0) {
    console.log(`\n❌ С пустыми словами:`);
    summary.withEmpty.forEach(item => {
      console.log(`   - ${item.lang}: ${item.count} пустых`);
    });
  }

  console.log('');

  await pool.end();
}

checkDuplicates();
