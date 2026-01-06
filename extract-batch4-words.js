const { Client } = require('pg');
const fs = require('fs').promises;

const languages = [
  { code: 'russian', needed: 93, batch3File: 'russian-words-batch3.txt' },
  { code: 'arabic', needed: 362, batch3File: 'arabic-words-batch3.txt' },
  { code: 'portuguese', needed: 177, batch3File: 'portuguese-words-batch3.txt' },
  { code: 'turkish', needed: 122, batch3File: 'turkish-words-batch3.txt' },
  { code: 'ukrainian', needed: 500, batch3File: 'ukrainian-words-batch3.txt' }
];

async function extractBatch4Words() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const { code, needed, batch3File } of languages) {
      console.log(`\n📝 Processing ${code.toUpperCase()}...`);
      console.log(`   Need: ${needed} more words`);

      // Read batch 3 words to exclude them
      let batch3Words = new Set();
      try {
        const batch3Content = await fs.readFile(batch3File, 'utf-8');
        batch3Words = new Set(batch3Content.split('\n').map(w => w.trim()).filter(Boolean));
        console.log(`   Batch 3 had: ${batch3Words.size} unique words`);
      } catch (e) {
        console.log(`   No batch 3 file found, starting fresh`);
      }

      // Also check batches 1 and 2
      const prevBatches = new Set(batch3Words);
      try {
        const batch1 = await fs.readFile(`${code}-words-batch1.txt`, 'utf-8');
        batch1.split('\n').forEach(w => prevBatches.add(w.trim()));
      } catch (e) {}
      try {
        const batch2 = await fs.readFile(`${code}-words-batch2.txt`, 'utf-8');
        batch2.split('\n').forEach(w => prevBatches.add(w.trim()));
      } catch (e) {}

      console.log(`   Total words in previous batches: ${prevBatches.size}`);

      const tableName = `source_words_${code}`;

      // For Ukrainian, we need to be more careful due to corrupted data
      const excludeCondition = code === 'ukrainian'
        ? `theme IS NOT NULL AND theme != 'general'`
        : `theme IS NOT NULL AND theme != 'general'`;

      // Get words that haven't been themed yet or still have 'general' theme
      const query = `
        SELECT word
        FROM ${tableName}
        WHERE (theme IS NULL OR theme = 'general')
        AND level IN ('A1', 'A2', 'B1')
        ORDER BY
          CASE level
            WHEN 'A1' THEN 1
            WHEN 'A2' THEN 2
            WHEN 'B1' THEN 3
            ELSE 4
          END,
          id
        LIMIT $1
      `;

      const result = await client.query(query, [needed]);
      const words = result.rows.map(r => r.word);

      console.log(`   Found: ${words.length} words from database`);

      if (words.length === 0) {
        console.log(`   ⚠️  No more words to theme for ${code}`);
        continue;
      }

      // Write to file
      const outputFile = `${code}-words-batch4.txt`;
      await fs.writeFile(outputFile, words.join('\n'), 'utf-8');

      console.log(`   ✅ Written to: ${outputFile}`);
      console.log(`   First 5 words: ${words.slice(0, 5).join(', ')}`);
    }

    console.log('\n\n🎉 Batch 4 word extraction complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

extractBatch4Words();
