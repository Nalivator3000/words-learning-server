const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkStructure() {
  try {
    const structure = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_word_progress'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Структура таблицы user_word_progress:\n');
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)}: ${col.data_type}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await pool.end();
  }
}

checkStructure();
