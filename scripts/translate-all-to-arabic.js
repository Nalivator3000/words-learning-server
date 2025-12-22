const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Configuration
const BATCH_SIZE = 100; // Process 100 words at a time
const DELAY_BETWEEN_BATCHES = 1500; // 1.5 seconds between batches to avoid rate limits
const MAX_RETRIES = 3;

/**
 * Translate text from German to Arabic using Google Translate API
 * @param {string} text - Text to translate
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<string>} - Translated text in Arabic
 */
async function translateToArabic(text, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=ar&dt=t&q=${encodedText}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            // Extract translation and ensure RTL formatting
            const translation = parsed[0][0][0];

            // Verify it's actually Arabic (contains Arabic characters)
            const hasArabic = /[\u0600-\u06FF]/.test(translation);

            if (!hasArabic) {
              console.warn(`Warning: Translation for "${text}" doesn't contain Arabic characters: "${translation}"`);
            }

            resolve(translation);
          } else {
            reject(new Error(`Invalid translation response for: ${text}`));
          }
        } catch (err) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for: ${text}`);
            setTimeout(() => {
              translateToArabic(text, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (retryCount + 1)); // Exponential backoff
          } else {
            reject(new Error(`Failed to parse translation for: ${text} - ${err.message}`));
          }
        }
      });
    }).on('error', (err) => {
      if (retryCount < MAX_RETRIES) {
        console.log(`Network error, retry ${retryCount + 1}/${MAX_RETRIES} for: ${text}`);
        setTimeout(() => {
          translateToArabic(text, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, 1000 * (retryCount + 1));
      } else {
        reject(new Error(`Translation request failed for: ${text} - ${err.message}`));
      }
    });
  });
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process a batch of words for translation
 * @param {object} client - Database client
 * @param {Array} words - Array of word objects to translate
 * @param {object} stats - Statistics object to update
 * @returns {Promise<void>}
 */
async function processBatch(client, words, stats) {
  for (const word of words) {
    try {
      // Check if translation already exists
      const existing = await client.query(`
        SELECT id FROM target_translations_arabic
        WHERE source_lang = 'de' AND source_word_id = $1
      `, [word.id]);

      if (existing.rows.length > 0) {
        stats.skipped++;
        continue;
      }

      // Translate the word
      const translation = await translateToArabic(word.word);

      // Insert translation
      await client.query(`
        INSERT INTO target_translations_arabic
        (source_lang, source_word_id, translation)
        VALUES ('de', $1, $2)
      `, [word.id, translation]);

      stats.translated++;
      stats.lastTranslated = { word: word.word, translation, level: word.level };

      // Small delay between individual translations within a batch
      await delay(100);

    } catch (err) {
      stats.failed++;
      stats.errors.push({
        id: word.id,
        word: word.word,
        level: word.level,
        error: err.message
      });
      console.error(`Failed to translate "${word.word}": ${err.message}`);
    }
  }
}

/**
 * Display progress statistics
 * @param {object} stats - Statistics object
 * @param {number} totalWords - Total number of words to translate
 */
function displayProgress(stats, totalWords) {
  const total = stats.translated + stats.skipped + stats.failed;
  const percentage = ((total / totalWords) * 100).toFixed(1);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Progress: ${total}/${totalWords} (${percentage}%)`);
  console.log(`  Translated: ${stats.translated}`);
  console.log(`  Skipped (already exist): ${stats.skipped}`);
  console.log(`  Failed: ${stats.failed}`);

  if (stats.lastTranslated) {
    console.log(`\nLast translation:`);
    console.log(`  DE: ${stats.lastTranslated.word}`);
    console.log(`  AR: ${stats.lastTranslated.translation}`);
    console.log(`  Level: ${stats.lastTranslated.level}`);
  }

  console.log(`${'='.repeat(70)}\n`);
}

/**
 * Main translation function
 */
async function translateAllToArabic() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log('Starting German to Arabic translation for ALL words...\n');
    console.log('Configuration:');
    console.log(`  Batch size: ${BATCH_SIZE} words`);
    console.log(`  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
    console.log(`  Max retries per word: ${MAX_RETRIES}`);
    console.log(`  RTL text handling: Enabled\n`);

    // Get total count
    const countResult = await client.query('SELECT COUNT(*) FROM source_words_german');
    const totalWords = parseInt(countResult.rows[0].count);

    console.log(`Total German words in database: ${totalWords}\n`);
    console.log(`${'='.repeat(70)}\n`);

    // Check how many are already translated
    const existingCount = await client.query(`
      SELECT COUNT(*) FROM target_translations_arabic
      WHERE source_lang = 'de'
    `);
    const alreadyTranslated = parseInt(existingCount.rows[0].count);

    if (alreadyTranslated > 0) {
      console.log(`Found ${alreadyTranslated} existing Arabic translations`);
      console.log(`Remaining to translate: ${totalWords - alreadyTranslated}\n`);
    }

    // Statistics
    const stats = {
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      lastTranslated: null
    };

    // Process in batches
    let offset = 0;
    let batchNumber = 0;

    while (offset < totalWords) {
      batchNumber++;

      // Fetch batch
      const batchResult = await client.query(`
        SELECT id, word, level, example_de
        FROM source_words_german
        ORDER BY id
        LIMIT $1 OFFSET $2
      `, [BATCH_SIZE, offset]);

      const batch = batchResult.rows;

      if (batch.length === 0) break;

      console.log(`Processing batch ${batchNumber} (words ${offset + 1}-${offset + batch.length})...`);

      // Process this batch
      await processBatch(client, batch, stats);

      // Display progress
      displayProgress(stats, totalWords);

      offset += BATCH_SIZE;

      // Delay between batches (except for the last one)
      if (offset < totalWords) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    // Final summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log('\n' + '='.repeat(70));
    console.log('TRANSLATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`\nFinal Statistics:`);
    console.log(`  Total words processed: ${totalWords}`);
    console.log(`  Successfully translated: ${stats.translated}`);
    console.log(`  Already existed (skipped): ${stats.skipped}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Total time: ${duration} minutes`);
    console.log(`  Average: ${(stats.translated / (duration || 1)).toFixed(1)} words/minute`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors encountered (${stats.errors.length}):`);
      stats.errors.slice(0, 20).forEach(err => {
        console.log(`  [${err.level}] "${err.word}" - ${err.error}`);
      });

      if (stats.errors.length > 20) {
        console.log(`  ... and ${stats.errors.length - 20} more errors`);
      }

      // Save errors to file for review
      const fs = require('fs');
      const errorLog = {
        timestamp: new Date().toISOString(),
        totalErrors: stats.errors.length,
        errors: stats.errors
      };
      fs.writeFileSync(
        'translation-errors-arabic.json',
        JSON.stringify(errorLog, null, 2)
      );
      console.log(`\nError details saved to: translation-errors-arabic.json`);
    }

    // Verify final counts
    const finalCount = await client.query(`
      SELECT COUNT(*) FROM target_translations_arabic
      WHERE source_lang = 'de'
    `);
    console.log(`\nDatabase verification:`);
    console.log(`  Total Arabic translations now in database: ${finalCount.rows[0].count}`);

    // Sample some translations
    const samples = await client.query(`
      SELECT sw.word, sw.level, ta.translation
      FROM source_words_german sw
      JOIN target_translations_arabic ta ON ta.source_word_id = sw.id
      WHERE ta.source_lang = 'de'
      ORDER BY RANDOM()
      LIMIT 10
    `);

    console.log(`\nRandom sample of translations:`);
    samples.rows.forEach(s => {
      console.log(`  [${s.level}] ${s.word} → ${s.translation}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('All translations completed successfully!');
    console.log('='.repeat(70) + '\n');

  } catch (err) {
    console.error('\nFATAL ERROR:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the translation
translateAllToArabic().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
