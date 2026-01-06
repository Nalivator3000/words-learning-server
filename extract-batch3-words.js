const { Client } = require('pg');
const fs = require('fs').promises;

const publicDatabaseUrl = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

const languages = [
  { code: 'ru', name: 'russian', limit: 500 },
  { code: 'ar', name: 'arabic', limit: 500 },
  { code: 'it', name: 'italian', limit: 500 },
  { code: 'pt', name: 'portuguese', limit: 500 },
  { code: 'tr', name: 'turkish', limit: 500 },
  { code: 'uk', name: 'ukrainian', limit: 500 }
];

async function extractBatch3() {
  const client = new Client({
    connectionString: publicDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to database\n');

  for (const { code, name, limit } of languages) {
    const tableName = `source_words_${name}`;

    console.log(`📝 Extracting ${code.toUpperCase()} batch 3...`);

    // Get words without themes or with 'general' theme
    const result = await client.query(
      `SELECT word
       FROM ${tableName}
       WHERE theme IS NULL OR theme = 'general'
       ORDER BY id
       LIMIT $1`,
      [limit]
    );

    const words = result.rows.map(r => r.word);

    if (words.length > 0) {
      const filename = `${name}-words-batch3.txt`;
      await fs.writeFile(filename, words.join('\n'), 'utf-8');
      console.log(`  ✅ Saved ${words.length} words to ${filename}`);
    } else {
      console.log(`  ℹ️  No words without themes found`);
    }
  }

  await client.end();
  console.log('\n🎉 Batch 3 extraction complete!');
}

extractBatch3().catch(console.error);
