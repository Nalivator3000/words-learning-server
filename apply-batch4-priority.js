const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const languages = [
  { code: 'russian', file: 'themes-russian-batch4-priority.json' },
  { code: 'arabic', file: 'themes-arabic-batch4-priority.json' },
  { code: 'italian', file: 'themes-italian-batch4-priority.json' },
  { code: 'portuguese', file: 'themes-portuguese-batch4-priority.json' },
  { code: 'turkish', file: 'themes-turkish-batch4-priority.json' },
  { code: 'ukrainian', file: 'themes-ukrainian-batch4-priority.json' }
];

const connectionConfigs = [
  process.env.DATABASE_PUBLIC_URL,
  "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@junction.proxy.rlwy.net:26930/railway",
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

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (e) {
    console.log(`  ⚠️  File not found: ${file}`);
    return { updated: 0, skipped: 0, errors: 0, missing: true };
  }

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
         AND theme = 'general'
         RETURNING id`,
        [theme, word]
      );

      if (result.rowCount > 0) {
        updated++;
      } else {
        skipped++;
      }

      if ((i + 1) % 100 === 0) {
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
  return { updated, skipped, errors, missing: false };
}

async function main() {
  console.log('🚀 Batch 4 Priority Theme Application\n');
  console.log('Available connection strings:', connectionConfigs.length);

  let client;
  try {
    client = await tryConnect();

    let grandTotal = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let missingFiles = [];

    for (const { code, file } of languages) {
      const { updated, skipped, errors, missing } = await applyThemesForLanguage(client, code, file);
      if (missing) {
        missingFiles.push(file);
      } else {
        grandTotal += updated;
        totalSkipped += skipped;
        totalErrors += errors;
      }
      await sleep(100);
    }

    console.log(`\n\n🎉 BATCH 4 COMPLETE!`);
    console.log(`✅ Total words updated: ${grandTotal}`);
    console.log(`⏭️  Words skipped (already themed): ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);

    if (missingFiles.length > 0) {
      console.log(`\n⚠️  Missing files (${missingFiles.length}):`);
      missingFiles.forEach(f => console.log(`   - ${f}`));
    }

    // Show final statistics
    console.log('\n📊 Updated theme statistics per language:');
    for (const { code } of languages) {
      const tableName = `source_words_${code}`;
      const stats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN theme = 'general' THEN 1 END) as still_general,
          COUNT(CASE WHEN theme != 'general' THEN 1 END) as specific_themes
        FROM ${tableName}
      `);

      const s = stats.rows[0];
      const pct = ((s.specific_themes / s.total) * 100).toFixed(1);
      console.log(`\n  ${code.toUpperCase()}:`);
      console.log(`    Total words: ${s.total}`);
      console.log(`    Specific themes: ${s.specific_themes} (${pct}%)`);
      console.log(`    Still 'general': ${s.still_general}`);
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
