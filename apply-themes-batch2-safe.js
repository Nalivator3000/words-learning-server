const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const languages = [
  { code: 'ru', file: 'themes-russian-batch2.json' },
  { code: 'ar', file: 'themes-arabic-batch2.json' },
  { code: 'it', file: 'themes-italian-batch2.json' },
  { code: 'pt', file: 'themes-portuguese-batch2.json' },
  { code: 'tr', file: 'themes-turkish-batch2.json' },
  { code: 'uk', file: 'themes-ukrainian-batch2.json' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function applyThemesForLanguage(code, file) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log(`\n📝 Processing ${code.toUpperCase()} - ${file}...`);
    console.log('🔌 Connecting...');

    await client.connect();
    console.log('✅ Connected!');

    const filePath = path.join(__dirname, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const themes = JSON.parse(fileContent);

    let updated = 0;

    // Process in smaller batches
    for (let i = 0; i < themes.length; i++) {
      const { word, theme } = themes[i];

      try {
        const result = await client.query(
          `UPDATE words SET theme = $1
           WHERE language = $2 AND word = $3
           AND (theme IS NULL OR theme = 'general')
           RETURNING id`,
          [theme, code, word]
        );

        if (result.rowCount > 0) {
          updated++;
        }

        if ((i + 1) % 25 === 0) {
          console.log(`  ✅ Processed ${i + 1}/${themes.length}...`);
          await sleep(100); // Small delay to avoid overwhelming connection
        }
      } catch (error) {
        console.error(`  ⚠️  Error updating "${word}": ${error.message}`);
      }
    }

    console.log(`\n  📊 ${code.toUpperCase()} Results:`);
    console.log(`     ✅ Updated: ${updated}`);
    console.log(`     📦 Total: ${themes.length}`);

    return updated;

  } catch (error) {
    console.error(`❌ Error processing ${code}:`, error.message);
    return 0;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting Batch 2 theme application...\n');

  let grandTotal = 0;

  for (const { code, file } of languages) {
    const updated = await applyThemesForLanguage(code, file);
    grandTotal += updated;

    // Wait between languages
    await sleep(2000);
  }

  console.log(`\n\n🎉 BATCH 2 COMPLETE!`);
  console.log(`==================`);
  console.log(`✅ Total updated: ${grandTotal}`);
}

main().catch(console.error);
