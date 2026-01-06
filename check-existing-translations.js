/**
 * Check how existing translation tables are filled
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkExisting() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ПРОВЕРКА СУЩЕСТВУЮЩИХ ПЕРЕВОДОВ                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Check an existing table that was filled before
    const sample = await pool.query(`
      SELECT * FROM target_translations_italian_from_en
      ORDER BY id
      LIMIT 10
    `);

    console.log('Примеры из target_translations_italian_from_en:\n');

    for (const row of sample.rows) {
      const sourceWord = await pool.query(
        'SELECT word FROM source_words_english WHERE id = $1',
        [row.source_word_id]
      );

      console.log(`  English: "${sourceWord.rows[0]?.word}" → Italian: "${row.translation}"`);
    }

    console.log('');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkExisting();
