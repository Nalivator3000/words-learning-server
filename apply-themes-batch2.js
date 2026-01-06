const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

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

async function applyThemes() {
  console.log('🔌 Connecting to database...');
  let client;

  // Retry connection
  for (let i = 0; i < 3; i++) {
    try {
      client = await pool.connect();
      console.log('✅ Connected to database!');
      break;
    } catch (error) {
      console.log(`⚠️  Connection attempt ${i + 1} failed, retrying...`);
      if (i === 2) throw error;
      await sleep(2000);
    }
  }

  try {
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalNotFound = 0;

    for (const { code, file } of languages) {
      console.log(`\n📝 Processing ${code.toUpperCase()} - ${file}...`);

      const filePath = path.join(__dirname, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const themes = JSON.parse(fileContent);

      let updated = 0;
      let skipped = 0;
      let notFound = 0;

      for (const { word, theme } of themes) {
        // Check if word exists
        const checkResult = await client.query(
          'SELECT id, theme FROM words WHERE language = $1 AND word = $2',
          [code, word]
        );

        if (checkResult.rows.length === 0) {
          console.log(`  ⚠️  Word not found: "${word}"`);
          notFound++;
          continue;
        }

        const existingTheme = checkResult.rows[0].theme;

        // Skip if theme already set
        if (existingTheme && existingTheme !== 'general') {
          console.log(`  ⏭️  Skipping "${word}" - already has theme: ${existingTheme}`);
          skipped++;
          continue;
        }

        // Update theme
        await client.query(
          'UPDATE words SET theme = $1 WHERE language = $2 AND word = $3',
          [theme, code, word]
        );

        updated++;
        if (updated % 50 === 0) {
          console.log(`  ✅ Updated ${updated} words...`);
        }
      }

      console.log(`\n  📊 ${code.toUpperCase()} Results:`);
      console.log(`     ✅ Updated: ${updated}`);
      console.log(`     ⏭️  Skipped: ${skipped}`);
      console.log(`     ❌ Not found: ${notFound}`);
      console.log(`     📦 Total processed: ${themes.length}`);

      totalUpdated += updated;
      totalSkipped += skipped;
      totalNotFound += notFound;
    }

    console.log(`\n\n🎉 BATCH 2 COMPLETE!`);
    console.log(`==================`);
    console.log(`✅ Total updated: ${totalUpdated}`);
    console.log(`⏭️  Total skipped: ${totalSkipped}`);
    console.log(`❌ Total not found: ${totalNotFound}`);
    console.log(`📦 Grand total: ${totalUpdated + totalSkipped + totalNotFound}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyThemes().catch(console.error);
