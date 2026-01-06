const { Client } = require('pg');
const fs = require('fs').promises;

const languages = [
  { code: 'russian', target: 500 },
  { code: 'arabic', target: 500 },
  { code: 'italian', target: 500 },
  { code: 'portuguese', target: 500 },
  { code: 'turkish', target: 500 },
  { code: 'ukrainian', target: 297 } // All available
];

async function extractPriorityWords() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('🎯 Extracting PRIORITY batch 4 words (A1-B1 levels only)\n');

    let totalExtracted = 0;

    for (const { code, target } of languages) {
      console.log(`\n📝 ${code.toUpperCase()}...`);

      const tableName = `source_words_${code}`;

      // Get words with 'general' theme, A1-B1 levels ONLY
      const query = `
        SELECT word, level
        FROM ${tableName}
        WHERE theme = 'general'
        AND level IN ('A1', 'A2', 'B1')
        ORDER BY
          CASE level
            WHEN 'A1' THEN 1
            WHEN 'A2' THEN 2
            WHEN 'B1' THEN 3
          END,
          id
        LIMIT $1
      `;

      const result = await client.query(query, [target]);
      const words = result.rows.map(r => r.word);

      console.log(`   Target: ${target} words`);
      console.log(`   Extracted: ${words.length} words (A1-B1 only)`);

      if (words.length === 0) {
        console.log(`   ⚠️  No A1-B1 'general' theme words for ${code}`);
        continue;
      }

      // Level breakdown
      const levelBreakdown = await client.query(`
        SELECT level, COUNT(*) as count
        FROM ${tableName}
        WHERE theme = 'general' AND level IN ('A1', 'A2', 'B1')
        GROUP BY level
        ORDER BY CASE level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 END
      `);

      console.log(`   Level breakdown:`);
      levelBreakdown.rows.forEach(row => {
        console.log(`     ${row.level}: ${row.count} words`);
      });

      // Write to file
      const outputFile = `${code}-words-batch4-priority.txt`;
      await fs.writeFile(outputFile, words.join('\n'), 'utf-8');

      console.log(`   ✅ Written to: ${outputFile}`);
      console.log(`   Sample: ${words.slice(0, 3).join(', ')}...`);

      totalExtracted += words.length;
    }

    console.log(`\n\n🎉 Priority Batch 4 extraction complete!`);
    console.log(`📊 Total words: ${totalExtracted}`);
    console.log(`\n💡 Strategy: Focus on beginner/intermediate vocabulary (A1-B1)`);
    console.log(`   This covers the most commonly used words that learners need first.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

extractPriorityWords();
