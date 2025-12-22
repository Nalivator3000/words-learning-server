const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function showA1() {
  const client = await pool.connect();
  try {
    console.log('🇩🇪 Немецкие слова уровня A1 (source_words_german):\n');

    const words = await client.query(`
      SELECT word, example_de, theme
      FROM source_words_german
      WHERE level = 'A1'
      ORDER BY id
      LIMIT 20
    `);

    words.rows.forEach((w, i) => {
      console.log(`${i+1}. ${w.word}`);
      console.log(`   Пример: ${w.example_de}`);
      console.log(`   Тема: ${w.theme || 'general'}\n`);
    });

    const total = await client.query(`SELECT COUNT(*) FROM source_words_german WHERE level = 'A1'`);
    console.log(`Всего A1 слов: ${total.rows[0].count}`);

    // Покажем как это связано с переводами
    console.log(`\n🔗 Пример связи с переводами (первое слово):\n`);
    const example = await client.query(`
      SELECT sw.word, sw.example_de, tr.translation, tr.example_ru
      FROM source_words_german sw
      JOIN target_translations_russian tr ON tr.source_word_id = sw.id
      WHERE sw.level = 'A1' AND tr.source_lang = 'de'
      LIMIT 1
    `);

    if (example.rows.length > 0) {
      const e = example.rows[0];
      console.log(`Немецкое слово: ${e.word}`);
      console.log(`Пример (DE): ${e.example_de}`);
      console.log(`Перевод (RU): ${e.translation}`);
      console.log(`Пример (RU): ${e.example_ru || 'нет'}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

showA1();
