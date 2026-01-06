const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const languages = [
  { code: 'russian', file: 'themes-russian-batch3.json' },
  { code: 'arabic', file: 'themes-arabic-batch3.json' },
  { code: 'italian', file: 'themes-italian-batch3.json' },
  { code: 'portuguese', file: 'themes-portuguese-batch3.json' },
  { code: 'turkish', file: 'themes-turkish-batch3.json' },
  { code: 'ukrainian', file: 'themes-ukrainian-batch3.json' }
];

// Try multiple connection strategies
const connectionConfigs = [
  // Public URL first (works from anywhere)
  process.env.DATABASE_PUBLIC_URL,
  // Public proxy
  "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@junction.proxy.rlwy.net:26930/railway",
  // Railway internal (when running via railway run)
  process.env.DATABASE_URL,
].filter(Boolean);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryConnect() {
  const maxRetries = 3;

  for (let retry = 0; retry < maxRetries; retry++) {
    if (retry > 0) {
      console.log(`\n🔄 Retry attempt ${retry + 1}/${maxRetries}...`);
      await sleep(2000);
    }

    for (const connString of connectionConfigs) {
      console.log(`\n🔌 Trying connection: ${connString.substring(0, 30)}...`);

      const client = new Client({
        connectionString: connString,
        ssl: connString.includes('railway') ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
        query_timeout: 60000,
      });

      try {
        await client.connect();
        await client.query('SELECT 1');
        console.log('✅ Connection successful!');
        return client;
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        try { await client.end(); } catch {}
      }
    }
  }

  throw new Error('All connection attempts failed after retries');
}

async function applyThemesForLanguage(client, code, file) {
  const tableName = `source_words_${code}`;
  console.log(`\n📝 Processing ${code.toUpperCase()} → ${tableName}...`);

  const filePath = path.join(__dirname, file);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const themes = JSON.parse(fileContent);

  console.log(`  📊 Total themes in file: ${themes.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < themes.length; i++) {
    const { word, theme } = themes[i];

    try {
      const result = await client.query(
        `UPDATE ${tableName} SET theme = $1
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

  console.log(`  ✅ ${code.toUpperCase()}: Updated ${updated}/${themes.length} (${skipped} skipped, ${errors} errors)`);
  return { updated, skipped, errors };
}

async function main() {
  console.log('🚀 Batch 3 Theme Application to source_words_* tables\n');
  console.log('Available connection strings:', connectionConfigs.length);

  let client;
  try {
    client = await tryConnect();

    let grandTotal = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const { code, file } of languages) {
      const { updated, skipped, errors } = await applyThemesForLanguage(client, code, file);
      grandTotal += updated;
      totalSkipped += skipped;
      totalErrors += errors;
      await sleep(100);
    }

    console.log(`\n\n🎉 BATCH 3 COMPLETE!`);
    console.log(`✅ Total words updated: ${grandTotal}`);
    console.log(`⏭️  Words skipped (already themed): ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);

    // Show final statistics
    console.log('\n📊 Final theme statistics per language:');
    for (const { code } of languages) {
      const tableName = `source_words_${code}`;
      const stats = await client.query(`
        SELECT
          theme,
          COUNT(*) as count
        FROM ${tableName}
        GROUP BY theme
        ORDER BY count DESC
        LIMIT 10
      `);

      console.log(`\n  ${code.toUpperCase()}:`);
      stats.rows.forEach(row => {
        console.log(`    ${row.theme || 'NULL'}: ${row.count}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

main();
