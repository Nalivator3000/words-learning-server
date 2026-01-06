const { Client } = require('pg');
const fs = require('fs').promises;

async function extractItalianRemaining() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(`
    SELECT word, level
    FROM source_words_italian
    WHERE theme = 'general'
    ORDER BY
      CASE level
        WHEN 'A1' THEN 1
        WHEN 'A2' THEN 2
        WHEN 'B1' THEN 3
        WHEN 'B2' THEN 4
        WHEN 'C1' THEN 5
        WHEN 'C2' THEN 6
      END,
      id
  `);

  console.log(`✅ Извлечено ${result.rows.length} слов с темой 'general'`);

  const words = result.rows.map(r => r.word).join('\n');
  await fs.writeFile('italian-words-remaining.txt', words, 'utf-8');

  console.log('📁 Сохранено в italian-words-remaining.txt');

  await client.end();
}

extractItalianRemaining().catch(console.error);
