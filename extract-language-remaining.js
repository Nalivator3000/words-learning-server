const { Client } = require('pg');
const fs = require('fs').promises;

const language = process.argv[2];

if (!language) {
  console.error('Usage: node extract-language-remaining.js <language>');
  process.exit(1);
}

async function extractRemaining() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(`
    SELECT word, level
    FROM source_words_${language}
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

  console.log(`✅ ${language.toUpperCase()}: Извлечено ${result.rows.length} слов с темой 'general'`);

  const words = result.rows.map(r => r.word).join('\n');
  const filename = `${language}-words-remaining.txt`;
  await fs.writeFile(filename, words, 'utf-8');

  console.log(`📁 Сохранено в ${filename}`);

  await client.end();
}

extractRemaining().catch(console.error);
