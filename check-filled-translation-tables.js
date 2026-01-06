/**
 * Check which translation tables have data
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkFilledTables() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ПРОВЕРКА ЗАПОЛНЕННОСТИ ТАБЛИЦ ПЕРЕВОДОВ                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'target_translations_%_from_%'
      ORDER BY table_name
    `);

    console.log(`Всего таблиц переводов: ${tables.rows.length}\n`);

    let filled = 0;
    let empty = 0;
    const emptyTables = [];

    console.log('Проверяю заполненность...\n');

    for (const row of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      const recordCount = parseInt(count.rows[0].count);

      if (recordCount > 0) {
        filled++;
      } else {
        empty++;
        emptyTables.push(row.table_name);
      }

      // Progress indicator
      if ((filled + empty) % 50 === 0) {
        console.log(`  Проверено: ${filled + empty}/${tables.rows.length}...`);
      }
    }

    console.log('\n' + '═'.repeat(65));
    console.log('\n📊 РЕЗУЛЬТАТЫ:\n');
    console.log(`   ✅ Заполнено таблиц: ${filled}`);
    console.log(`   ❌ Пустых таблиц: ${empty}`);
    console.log(`   📈 Заполненность: ${((filled / tables.rows.length) * 100).toFixed(1)}%\n`);

    if (empty > 0) {
      console.log('═'.repeat(65));
      console.log('\n❌ ПУСТЫЕ ТАБЛИЦЫ:\n');
      emptyTables.forEach((table, idx) => {
        console.log(`${(idx + 1).toString().padStart(3)}. ${table}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkFilledTables();
