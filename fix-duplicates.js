const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const languagesWithDuplicates = ['italian', 'portuguese', 'russian', 'arabic', 'turkish', 'ukrainian'];

async function fixDuplicates() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          УДАЛЕНИЕ ДУБЛИКАТОВ                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  for (const lang of languagesWithDuplicates) {
    const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
    console.log(`🔧 Исправляю ${langName}...`);

    try {
      // Удаляем дубликаты, оставляя только одну запись с минимальным ID
      const result = await pool.query(`
        DELETE FROM source_words_${lang}
        WHERE id IN (
          SELECT id
          FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY word ORDER BY id) AS rn
            FROM source_words_${lang}
          ) t
          WHERE rn > 1
        )
      `);

      console.log(`   ✅ Удалено дубликатов: ${result.rowCount}`);

      // Проверка
      const check = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(DISTINCT word) as unique_words
        FROM source_words_${lang}
      `);

      const stats = check.rows[0];
      console.log(`   📊 Всего слов: ${stats.total}, уникальных: ${stats.unique_words}\n`);

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}\n`);
    }
  }

  // Удаляем слово "synthetic" из English
  console.log('🔧 Удаляю synthetic из English...');
  try {
    const result = await pool.query(`
      DELETE FROM source_words_english
      WHERE word = 'synthetic'
    `);
    console.log(`   ✅ Удалено записей: ${result.rowCount}\n`);
  } catch (error) {
    console.log(`   ❌ Ошибка: ${error.message}\n`);
  }

  console.log('═'.repeat(65));
  console.log('✅ Готово!\n');

  await pool.end();
}

fixDuplicates();
