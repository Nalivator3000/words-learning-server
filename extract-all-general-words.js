const { Client } = require('pg');
const fs = require('fs').promises;

const languages = [
  { code: 'russian', available: 1718 },
  { code: 'arabic', available: 817 },
  { code: 'italian', available: 3942 },
  { code: 'portuguese', available: 1183 },
  { code: 'turkish', available: 1096 },
  { code: 'ukrainian', available: 297 }
];

async function extractAllGeneralWords() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    let totalExtracted = 0;

    for (const { code, available } of languages) {
      console.log(`\n📝 Extracting ${code.toUpperCase()}...`);
      console.log(`   Available: ${available} words with 'general' theme`);

      const tableName = `source_words_${code}`;

      // Get ALL words with 'general' theme, prioritizing easier levels
      const query = `
        SELECT word
        FROM ${tableName}
        WHERE theme = 'general'
        ORDER BY
          CASE level
            WHEN 'A1' THEN 1
            WHEN 'A2' THEN 2
            WHEN 'B1' THEN 3
            WHEN 'B2' THEN 4
            WHEN 'C1' THEN 5
            WHEN 'C2' THEN 6
            ELSE 7
          END,
          id
      `;

      const result = await client.query(query);
      const words = result.rows.map(r => r.word);

      console.log(`   Extracted: ${words.length} words`);

      if (words.length === 0) {
        console.log(`   ⚠️  No 'general' theme words found for ${code}`);
        continue;
      }

      // Write to file
      const outputFile = `${code}-words-batch4.txt`;
      await fs.writeFile(outputFile, words.join('\n'), 'utf-8');

      console.log(`   ✅ Written to: ${outputFile}`);
      console.log(`   First 5 words: ${words.slice(0, 5).join(', ')}`);
      console.log(`   Last 5 words: ${words.slice(-5).join(', ')}`);

      totalExtracted += words.length;
    }

    console.log(`\n\n🎉 Batch 4 word extraction complete!`);
    console.log(`📊 Total words to theme: ${totalExtracted}`);
    console.log(`\nBreakdown:`);
    for (const { code, available } of languages) {
      console.log(`   ${code}: ${available} words`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

extractAllGeneralWords();
