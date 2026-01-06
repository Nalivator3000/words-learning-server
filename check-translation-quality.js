/**
 * Check quality of translations in filled tables
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkQuality() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ПРОВЕРКА КАЧЕСТВА ЗАПОЛНЕННЫХ ДАННЫХ                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Check 1: Italian from Hindi (one of the newly filled tables)
    console.log('📊 Таблица: target_translations_italian_from_hi\n');

    const sample1 = await pool.query(`
      SELECT * FROM target_translations_italian_from_hi
      ORDER BY id
      LIMIT 10
    `);

    console.log('Первые 10 записей:');
    for (const row of sample1.rows) {
      // Get source word
      const sourceWord = await pool.query(
        'SELECT word FROM source_words_hindi WHERE id = $1',
        [row.source_word_id]
      );

      console.log(`  ${row.id}. Hindi[${row.source_word_id}]: "${sourceWord.rows[0]?.word}" → Italian: "${row.translation}"`);
    }

    // Check 2: Are these real words or placeholders?
    const count = await pool.query(`
      SELECT COUNT(*) as total
      FROM target_translations_italian_from_hi
    `);

    console.log(`\n✅ Всего записей: ${count.rows[0].total}`);

    // Check 3: Random sample from another table
    console.log('\n═'.repeat(65));
    console.log('\n📊 Таблица: target_translations_russian_from_ko\n');

    const sample2 = await pool.query(`
      SELECT * FROM target_translations_russian_from_ko
      ORDER BY RANDOM()
      LIMIT 5
    `);

    console.log('Случайные 5 записей:');
    for (const row of sample2.rows) {
      const sourceWord = await pool.query(
        'SELECT word FROM source_words_korean WHERE id = $1',
        [row.source_word_id]
      );

      console.log(`  Korean[${row.source_word_id}]: "${sourceWord.rows[0]?.word}" → Russian: "${row.translation}"`);
    }

    // Check 4: Are translations unique or duplicated?
    console.log('\n═'.repeat(65));
    console.log('\n🔍 Проверка уникальности переводов:\n');

    const duplicates = await pool.query(`
      SELECT translation, COUNT(*) as count
      FROM target_translations_italian_from_hi
      GROUP BY translation
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 5
    `);

    if (duplicates.rows.length > 0) {
      console.log('⚠️  Найдены повторяющиеся переводы:');
      duplicates.rows.forEach(r => {
        console.log(`   "${r.translation}" - повторяется ${r.count} раз`);
      });
    } else {
      console.log('✅ Все переводы уникальны');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkQuality();
