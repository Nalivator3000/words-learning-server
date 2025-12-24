const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

/**
 * Translate text from German to Romanian using Google Translate (free API)
 * @param {string} text - Text to translate
 * @returns {Promise<string|null>} - Translated text or null on error
 */
function translateToRomanian(text) {
  return new Promise((resolve) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=ro&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Google Translate API returns an array: [[["translation", "original", null, null, 3]]]
          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            resolve(parsed[0][0][0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(`Parse error for "${text}": ${e.message}`);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`HTTP error for "${text}": ${err.message}`);
      resolve(null);
    });
  });
}

/**
 * Delay function to avoid rate limiting
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main translation function
 */
async function translateAllToRomanian() {
  const client = await pool.connect();

  try {
    console.log('🇷🇴 Starting German → Romanian translation for ALL words...\n');

    // Count total words
    const countResult = await client.query('SELECT COUNT(*) FROM source_words_german');
    const totalWords = parseInt(countResult.rows[0].count);
    console.log(`📊 Total German words to translate: ${totalWords}\n`);

    // Fetch all German words
    const wordsResult = await client.query(`
      SELECT id, word, level, example_de
      FROM source_words_german
      ORDER BY id
    `);

    const words = wordsResult.rows;
    console.log(`✅ Loaded ${words.length} German words from database\n`);

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const failedWords = [];

    // Process each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const progress = `[${i + 1}/${words.length}]`;

      // Check if translation already exists
      const existingResult = await client.query(`
        SELECT id FROM target_translations_romanian
        WHERE source_lang = 'de' AND source_word_id = $1
      `, [word.id]);

      if (existingResult.rows.length > 0) {
        skipped++;
        if (skipped % 100 === 0) {
          process.stdout.write(`\r${progress} Skipped: ${skipped} (already exists)`);
        }
        continue;
      }

      // Translate the word
      const translation = await translateToRomanian(word.word);

      if (!translation) {
        failed++;
        failedWords.push({ id: word.id, word: word.word, level: word.level });
        console.log(`\n❌ ${progress} Failed to translate: "${word.word}"`);
        continue;
      }

      // Translate example sentence if exists
      let exampleRo = null;
      if (word.example_de) {
        await delay(100); // Small delay between translations
        exampleRo = await translateToRomanian(word.example_de);
      }

      // Insert translation into database
      try {
        await client.query(`
          INSERT INTO target_translations_romanian
          (source_lang, source_word_id, translation, example_ro)
          VALUES ('de', $1, $2, $3)
        `, [word.id, translation, exampleRo]);

        translated++;

        // Progress update every 50 words
        if (translated % 50 === 0) {
          const percentage = ((i + 1) / words.length * 100).toFixed(1);
          process.stdout.write(`\r${progress} Progress: ${percentage}% | Translated: ${translated} | Skipped: ${skipped} | Failed: ${failed}`);
        }

        // Add delay to avoid rate limiting (100-200ms between requests)
        await delay(150);

      } catch (err) {
        failed++;
        failedWords.push({ id: word.id, word: word.word, level: word.level, error: err.message });
        console.log(`\n❌ ${progress} Database error for "${word.word}": ${err.message}`);
      }
    }

    // Final summary
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ TRANSLATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   Total words processed: ${words.length}`);
    console.log(`   Successfully translated: ${translated}`);
    console.log(`   Already existed (skipped): ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log('='.repeat(70));

    // Show failed words if any
    if (failedWords.length > 0) {
      console.log(`\n⚠️  Failed translations (${failedWords.length} words):`);
      failedWords.slice(0, 20).forEach(w => {
        console.log(`   - "${w.word}" (ID: ${w.id}, Level: ${w.level})${w.error ? ' - ' + w.error : ''}`);
      });
      if (failedWords.length > 20) {
        console.log(`   ... and ${failedWords.length - 20} more`);
      }
    }

    // Verify final count
    const finalCount = await client.query('SELECT COUNT(*) FROM target_translations_romanian WHERE source_lang = $1', ['de']);
    console.log(`\n✅ Total Romanian translations in database: ${finalCount.rows[0].count}`);

  } catch (err) {
    console.error('\n❌ Fatal error during translation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🏁 Script finished.');
  }
}

// Run the translation
translateAllToRomanian().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
