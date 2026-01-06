const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const languages = [
  { code: 'ru', file: 'themes-russian-batch2.json', table: 'source_words_russian' },
  { code: 'ar', file: 'themes-arabic-batch2.json', table: 'source_words_arabic' },
  { code: 'it', file: 'themes-italian-batch2.json', table: 'source_words_italian' },
  { code: 'pt', file: 'themes-portuguese-batch2.json', table: 'source_words_portuguese' },
  { code: 'tr', file: 'themes-turkish-batch2.json', table: 'source_words_turkish' },
  { code: 'uk', file: 'themes-ukrainian-batch2.json', table: 'source_words_ukrainian' }
];

const publicDatabaseUrl = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function applyThemesForLanguage(client, code, file, table) {
  console.log(`\n📝 Processing ${code.toUpperCase()} - ${table}...`);

  const filePath = path.join(__dirname, file);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const themes = JSON.parse(fileContent);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < themes.length; i++) {
    const { word, theme } = themes[i];

    try {
      const result = await client.query(
        `UPDATE ${table} SET theme = $1
         WHERE word = $2
         AND (theme IS NULL OR theme = 'general')
         RETURNING id`,
        [theme, word]
      );

      if (result.rowCount > 0) {
        updated++;
      } else {
        skipped++;
      }

      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${themes.length} (${updated} updated, ${skipped} skipped)`);
        await sleep(50);
      }
    } catch (error) {
      errors++;
      if (errors <= 3) {
        console.error(`  ⚠️  Error on "${word}": ${error.message}`);
      }
    }
  }

  console.log(`  ✅ ${code.toUpperCase()}: Updated ${updated}, Skipped ${skipped}, Total ${themes.length}`);
  return updated;
}

async function main() {
  console.log('🚀 Batch 2 Theme Application (Correct Tables)\n');

  const client = new Client({
    connectionString: publicDatabaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    let grandTotal = 0;
    for (const { code, file, table } of languages) {
      const updated = await applyThemesForLanguage(client, code, file, table);
      grandTotal += updated;
      await sleep(200);
    }

    console.log(`\n\n🎉 BATCH 2 COMPLETE!`);
    console.log(`==================`);
    console.log(`✅ Total words updated: ${grandTotal}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
