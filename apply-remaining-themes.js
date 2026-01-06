const { Client } = require('pg');
const fs = require('fs').promises;

const language = process.argv[2];

if (!language) {
  console.error('Usage: node apply-remaining-themes.js <language>');
  process.exit(1);
}

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

async function applyThemes() {
  console.log(`\n🚀 Applying themes for ${language.toUpperCase()}\n`);

  const client = await tryConnect();
  const tableName = `source_words_${language}`;
  const filename = `themes-${language}-remaining.json`;

  try {
    await fs.access(filename);
  } catch (e) {
    console.log(`  ⚠️  File not found: ${filename}`);
    await client.end();
    return;
  }

  const fileContent = await fs.readFile(filename, 'utf-8');
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

  console.log(`\n  ✅ ${language.toUpperCase()}: Updated ${updated}/${themes.length} (${skipped} skipped, ${errors} errors)`);

  // Show updated statistics
  const stats = await client.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN theme = 'general' THEN 1 END) as still_general,
      COUNT(CASE WHEN theme != 'general' THEN 1 END) as specific_themes
    FROM ${tableName}
  `);

  const s = stats.rows[0];
  const pct = ((s.specific_themes / s.total) * 100).toFixed(1);
  console.log(`\n  📊 ${language.toUpperCase()} Final Stats:`);
  console.log(`    Total words: ${s.total}`);
  console.log(`    Specific themes: ${s.specific_themes} (${pct}%)`);
  console.log(`    Still 'general': ${s.still_general}\n`);

  await client.end();
}

applyThemes().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
