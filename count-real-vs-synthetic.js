const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function countWords() {
  const client = await pool.connect();

  try {
    const languages = ['hindi', 'japanese', 'swahili'];

    for (const lang of languages) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🌐 ${lang.toUpperCase()}`);
      console.log('='.repeat(60));

      const total = await client.query(`
        SELECT COUNT(*) as count
        FROM source_words_${lang}
      `);

      const synthetic = await client.query(`
        SELECT COUNT(*) as count
        FROM source_words_${lang}
        WHERE word LIKE '%\\_%' OR word ~ '_[0-9]+_[A-Z][0-9]'
      `);

      const real = total.rows[0].count - synthetic.rows[0].count;

      console.log(`   Всего слов: ${total.rows[0].count}`);
      console.log(`   Реальных слов: ${real}`);
      console.log(`   Синтетических: ${synthetic.rows[0].count}`);
      console.log(`   % реальных: ${(real / total.rows[0].count * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

countWords();
