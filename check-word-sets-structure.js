const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkStructure() {
  try {
    // Get word_sets table structure
    const structure = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'word_sets'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Структура таблицы word_sets:\n');
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)}: ${col.data_type}`);
    });

    // Get sample word sets
    const samples = await pool.query(`
      SELECT *
      FROM word_sets
      WHERE source_language = 'german'
      LIMIT 3
    `);

    console.log('\n📚 Примеры наборов слов для German:\n');
    samples.rows.forEach(set => {
      console.log('   Set:', JSON.stringify(set, null, 2));
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await pool.end();
  }
}

checkStructure();
