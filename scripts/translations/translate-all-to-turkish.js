const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Free Google Translate API (no API key required)
async function translateText(text, targetLang = 'tr', sourceLang = 'de') {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translated = parsed[0][0][0];
          resolve(translated);
        } catch (e) {
          console.error(`Failed to parse translation for: "${text}"`, e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`Network error translating: "${text}"`, err.message);
      resolve(null);
    });
  });
}

// Add delay to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateAllToTurkish() {
  const client = await pool.connect();

  try {
    console.log('🇹🇷 Translating ALL German words → Turkish...\n');

    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM source_words_german
    `);
    const totalWords = parseInt(countResult.rows[0].count);
    console.log(`📊 Total German words to translate: ${totalWords}\n`);

    // Fetch all German words ordered by ID
    const words = await client.query(`
      SELECT id, word, level, example_de
      FROM source_words_german
      ORDER BY id
    `);

    console.log(`🔍 Found ${words.rows.length} German words\n`);

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const failedWords = [];

    // Process in batches for better progress tracking
    const batchSize = 100;
    const totalBatches = Math.ceil(words.rows.length / batchSize);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const startIdx = batchNum * batchSize;
      const endIdx = Math.min(startIdx + batchSize, words.rows.length);
      const batch = words.rows.slice(startIdx, endIdx);

      console.log(`\n📦 Processing batch ${batchNum + 1}/${totalBatches} (words ${startIdx + 1}-${endIdx})...`);

      for (const row of batch) {
        const progress = `[${translated + skipped + failed + 1}/${words.rows.length}]`;

        // Check if translation already exists
        const existing = await client.query(`
          SELECT id FROM target_translations_turkish
          WHERE source_lang = 'de' AND source_word_id = $1
        `, [row.id]);

        if (existing.rows.length > 0) {
          skipped++;
          if (skipped % 50 === 0) {
            process.stdout.write(`\r${progress} ⏭️  Skipped: ${skipped}`);
          }
          continue;
        }

        // Get Turkish translation
        const translation = await translateText(row.word, 'tr', 'de');

        if (!translation) {
          failed++;
          failedWords.push({ id: row.id, word: row.word, level: row.level });
          console.log(`\n${progress} ❌ Failed: "${row.word}" (ID: ${row.id})`);

          // Continue with delay even on failure
          await delay(200);
          continue;
        }

        // Insert translation into database
        try {
          await client.query(`
            INSERT INTO target_translations_turkish
            (source_lang, source_word_id, translation)
            VALUES ('de', $1, $2)
          `, [row.id, translation]);

          translated++;

          if (translated % 10 === 0) {
            process.stdout.write(`\r${progress} ✅ Translated: ${translated} | Skipped: ${skipped} | Failed: ${failed}`);
          }

          // Small delay to avoid overwhelming the API
          await delay(200);

        } catch (dbError) {
          failed++;
          failedWords.push({ id: row.id, word: row.word, level: row.level, error: dbError.message });
          console.log(`\n${progress} ❌ DB Error for "${row.word}": ${dbError.message}`);
        }
      }

      // Longer delay between batches
      if (batchNum < totalBatches - 1) {
        console.log(`\n⏸️  Pausing 2 seconds before next batch...`);
        await delay(2000);
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ Translation complete!\n');
    console.log('📊 Final Statistics:');
    console.log(`   Total words processed: ${words.rows.length}`);
    console.log(`   Successfully translated: ${translated}`);
    console.log(`   Already existed (skipped): ${skipped}`);
    console.log(`   Failed translations: ${failed}`);
    console.log(`   Success rate: ${((translated / (translated + failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    if (failedWords.length > 0) {
      console.log(`\n⚠️  Failed words (${failedWords.length}):`);
      failedWords.slice(0, 50).forEach(w => {
        console.log(`   ID ${w.id}: "${w.word}" [${w.level}]${w.error ? ' - ' + w.error : ''}`);
      });

      if (failedWords.length > 50) {
        console.log(`   ... and ${failedWords.length - 50} more`);
      }

      console.log('\n💡 Tip: You can run this script again to retry failed translations');
    }

    // Verify total count in target table
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM target_translations_turkish
      WHERE source_lang = 'de'
    `);
    console.log(`\n✅ Total Turkish translations in database: ${verifyResult.rows[0].count}`);

  } catch (err) {
    console.error('\n❌ Fatal error during translation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the translation
translateAllToTurkish().catch(err => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
