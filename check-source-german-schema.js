const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'source_words_german'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Структура source_words_german:\n');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${col.column_default || ''}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await pool.end();
  }
}

checkSchema();
