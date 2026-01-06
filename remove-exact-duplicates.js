/**
 * Remove EXACT duplicates only - where the word is 100% identical
 * Keeps one copy of each unique word (the one with the lowest ID)
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const languages = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'russian', 'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
  'romanian', 'serbian', 'korean', 'hindi', 'japanese', 'swahili'
];

async function removeExactDuplicates() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          УДАЛЕНИЕ ТОЧНЫХ ДУБЛИКАТОВ (100% совпадения)         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const summary = {
    withDuplicates: [],
    totalRemoved: 0
  };

  for (const lang of languages) {
    const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
    const tableName = `source_words_${lang}`;

    try {
      // First, check if there are any exact duplicates
      const checkDuplicates = await pool.query(`
        SELECT word, COUNT(*) as count
        FROM ${tableName}
        GROUP BY word
        HAVING COUNT(*) > 1
      `);

      if (checkDuplicates.rows.length === 0) {
        console.log(`✅ ${langName}: Дубликатов нет`);
        continue;
      }

      console.log(`\n🔧 ${langName}: Найдено ${checkDuplicates.rows.length} групп дубликатов`);

      // Show some examples
      const examples = checkDuplicates.rows.slice(0, 3);
      console.log('   Примеры:');
      examples.forEach(row => {
        console.log(`   - "${row.word}" (${row.count}x)`);
      });

      // Count how many will be removed
      const countToRemove = await pool.query(`
        SELECT COUNT(*) as count
        FROM ${tableName} a
        WHERE EXISTS (
          SELECT 1
          FROM ${tableName} b
          WHERE a.word = b.word
          AND a.id > b.id
        )
      `);

      const willRemove = parseInt(countToRemove.rows[0].count);
      console.log(`   📉 Будет удалено: ${willRemove} дубликатов\n`);

      // Remove duplicates - keep only the record with the smallest ID for each word
      const result = await pool.query(`
        DELETE FROM ${tableName}
        WHERE id IN (
          SELECT id
          FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY word ORDER BY id) AS rn
            FROM ${tableName}
          ) t
          WHERE rn > 1
        )
      `);

      console.log(`   ✅ Удалено: ${result.rowCount} записей`);

      // Verify no duplicates remain
      const verify = await pool.query(`
        SELECT word, COUNT(*) as count
        FROM ${tableName}
        GROUP BY word
        HAVING COUNT(*) > 1
      `);

      if (verify.rows.length > 0) {
        console.log(`   ⚠️  ВНИМАНИЕ: Остались дубликаты: ${verify.rows.length} групп!`);
      } else {
        console.log(`   ✅ Проверка: Все дубликаты удалены`);
      }

      // Final count
      const finalCount = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`   📊 Итого слов: ${finalCount.rows[0].count}\n`);

      summary.withDuplicates.push({
        lang: langName,
        removed: result.rowCount,
        remaining: parseInt(finalCount.rows[0].count)
      });
      summary.totalRemoved += result.rowCount;

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}\n`);
    }
  }

  // Summary
  console.log('═'.repeat(65));
  console.log('\n📊 ИТОГОВЫЙ ОТЧЁТ:\n');

  if (summary.withDuplicates.length > 0) {
    console.log('Обработанные языки:');
    summary.withDuplicates.forEach(item => {
      console.log(`   ${item.lang}: удалено ${item.removed}, осталось ${item.remaining} слов`);
    });
    console.log(`\n✅ Всего удалено дубликатов: ${summary.totalRemoved}`);
  } else {
    console.log('✅ Дубликатов не найдено ни в одном языке!');
  }

  console.log('');
  await pool.end();
}

removeExactDuplicates();
