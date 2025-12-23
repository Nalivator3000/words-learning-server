const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

/**
 * Translate text using Google Translate (free, no API key required)
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (e.g., 'de')
 * @param {string} targetLang - Target language code (e.g., 'sr')
 * @returns {Promise<string|null>} - Translated text or null if failed
 */
async function translateText(text, sourceLang = 'de', targetLang = 'sr') {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            const translated = parsed[0][0][0];
            resolve(translated);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(`❌ Parse error for "${text}":`, e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Network error:`, err.message);
      resolve(null);
    });
  });
}

/**
 * Translate example sentence if it exists
 * @param {string} exampleDe - German example sentence
 * @returns {Promise<string|null>} - Serbian translation or null
 */
async function translateExample(exampleDe) {
  if (!exampleDe || exampleDe.trim() === '') {
    return null;
  }
  return await translateText(exampleDe, 'de', 'sr');
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main translation function
 */
async function translateAllToSerbian() {
  const client = await pool.connect();

  try {
    console.log('🇷🇸 Starting German → Serbian translation for ALL words...\n');
    console.log('━'.repeat(70));

    // Get total count
    const countResult = await client.query('SELECT COUNT(*) FROM source_words_german');
    const totalWords = parseInt(countResult.rows[0].count);

    console.log(`📚 Total German words in database: ${totalWords}`);

    // Check how many are already translated
    const existingResult = await client.query(`
      SELECT COUNT(*) FROM target_translations_serbian
      WHERE source_lang = 'de'
    `);
    const existingCount = parseInt(existingResult.rows[0].count);

    console.log(`✓ Already translated: ${existingCount}`);
    console.log(`⏳ Remaining to translate: ${totalWords - existingCount}`);
    console.log('━'.repeat(70));
    console.log('');

    // Fetch all German words that need translation
    const words = await client.query(`
      SELECT g.id, g.word, g.level, g.example_de
      FROM source_words_german g
      WHERE NOT EXISTS (
        SELECT 1 FROM target_translations_serbian t
        WHERE t.source_lang = 'de' AND t.source_word_id = g.id
      )
      ORDER BY g.id
    `);

    const wordsToTranslate = words.rows;
    console.log(`🔄 Processing ${wordsToTranslate.length} words...\n`);

    if (wordsToTranslate.length === 0) {
      console.log('✅ All words are already translated!');
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let errorCount = 0;
    const failedWords = [];

    const startTime = Date.now();

    for (let i = 0; i < wordsToTranslate.length; i++) {
      const row = wordsToTranslate[i];
      const progress = i + 1;
      const percentage = ((progress / wordsToTranslate.length) * 100).toFixed(1);

      try {
        // Translate the word
        const translation = await translateText(row.word, 'de', 'sr');

        if (!translation) {
          failCount++;
          failedWords.push({ id: row.id, word: row.word, level: row.level, reason: 'Translation returned null' });
          console.log(`⚠️  [${progress}/${wordsToTranslate.length}] ${percentage}% - Failed: "${row.word}" (ID: ${row.id})`);

          // Add delay before continuing
          await sleep(150);
          continue;
        }

        // Translate example if it exists
        let exampleSr = null;
        if (row.example_de && row.example_de.trim() !== '') {
          exampleSr = await translateExample(row.example_de);
          await sleep(100); // Extra delay for example translation
        }

        // Insert into database
        await client.query(`
          INSERT INTO target_translations_serbian
          (source_lang, source_word_id, translation, example_sr)
          VALUES ('de', $1, $2, $3)
        `, [row.id, translation, exampleSr]);

        successCount++;

        // Progress update every 10 words
        if (progress % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = (progress / elapsed).toFixed(1);
          const eta = ((wordsToTranslate.length - progress) / rate / 60).toFixed(1);

          console.log(`✓ [${progress}/${wordsToTranslate.length}] ${percentage}% - "${row.word}" → "${translation}" | Rate: ${rate}/s | ETA: ${eta}m`);
        }

        // Delay to avoid rate limiting (100-200ms between requests)
        await sleep(150);

      } catch (err) {
        errorCount++;
        failedWords.push({ id: row.id, word: row.word, level: row.level, reason: err.message });
        console.error(`❌ [${progress}/${wordsToTranslate.length}] ${percentage}% - Error translating "${row.word}" (ID: ${row.id}):`, err.message);

        // Longer delay after error
        await sleep(300);
      }
    }

    // Final summary
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

    console.log('\n' + '━'.repeat(70));
    console.log('✅ TRANSLATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   Total words processed: ${wordsToTranslate.length}`);
    console.log(`   ✓ Successfully translated: ${successCount}`);
    console.log(`   ⚠️  Failed translations: ${failCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Total time: ${totalTime} minutes`);
    console.log('━'.repeat(70));

    // Show total in database
    const finalCount = await client.query(`
      SELECT COUNT(*) FROM target_translations_serbian
      WHERE source_lang = 'de'
    `);
    console.log(`\n📚 Total Serbian translations in database: ${finalCount.rows[0].count}`);

    // Show failed words if any
    if (failedWords.length > 0) {
      console.log(`\n⚠️  Failed words (showing first 50):`);
      failedWords.slice(0, 50).forEach((w, idx) => {
        console.log(`   ${idx + 1}. ID ${w.id}: "${w.word}" (${w.level}) - ${w.reason}`);
      });

      if (failedWords.length > 50) {
        console.log(`   ... and ${failedWords.length - 50} more`);
      }

      console.log(`\n💡 You can re-run this script to retry failed translations.`);
    }

  } catch (err) {
    console.error('\n❌ Fatal error during translation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the translation
console.log('\n🚀 German to Serbian Translation Script');
console.log('━'.repeat(70));
translateAllToSerbian().catch(err => {
  console.error('💥 Script failed:', err);
  process.exit(1);
});
