const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuration
const BATCH_SIZE = 50; // Process 50 words at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const DELAY_BETWEEN_WORDS = 1000; // 1 second between individual translations
const MAX_RETRIES = 3;

/**
 * Translate text from Arabic to English using Google Translate API
 */
async function translateToEnglish(text, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodedText}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            const translation = parsed[0][0][0];
            resolve(translation);
          } else {
            reject(new Error(`Invalid translation response for: ${text}`));
          }
        } catch (error) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for: ${text}`);
            setTimeout(() => {
              translateToEnglish(text, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 2000 * (retryCount + 1));
          } else {
            reject(error);
          }
        }
      });
    }).on('error', (error) => {
      if (retryCount < MAX_RETRIES) {
        console.log(`Network error, retry ${retryCount + 1}/${MAX_RETRIES}`);
        setTimeout(() => {
          translateToEnglish(text, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, 2000 * (retryCount + 1));
      } else {
        reject(error);
      }
    });
  });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function translateArabicToEnglish() {
  let totalTranslated = 0;
  let totalErrors = 0;
  let batchNumber = 0;

  try {
    console.log('Starting Arabic to English translation...\n');

    while (true) {
      // Get batch of words that need translation
      const wordsResult = await pool.query(`
        SELECT swa.id, swa.word
        FROM source_words_arabic swa
        WHERE NOT EXISTS (
          SELECT 1 FROM target_translations_english_from_ar tt
          WHERE tt.source_word_id = swa.id
        )
        ORDER BY swa.id
        LIMIT $1
      `, [BATCH_SIZE]);

      if (wordsResult.rows.length === 0) {
        console.log('\n✅ All Arabic words have been translated!');
        break;
      }

      batchNumber++;
      console.log(`\n📦 Batch ${batchNumber}: Processing ${wordsResult.rows.length} words...`);

      let batchSuccess = 0;
      let batchErrors = 0;

      for (const word of wordsResult.rows) {
        try {
          const translation = await translateToEnglish(word.word);

          await pool.query(`
            INSERT INTO target_translations_english_from_ar (source_lang, source_word_id, translation)
            VALUES ('ar', $1, $2)
          `, [word.id, translation]);

          batchSuccess++;
          totalTranslated++;

          if (batchSuccess % 10 === 0) {
            console.log(`  Progress: ${batchSuccess}/${wordsResult.rows.length}`);
          }

          await delay(DELAY_BETWEEN_WORDS);

        } catch (error) {
          batchErrors++;
          totalErrors++;
          console.error(`  ✗ Failed: ${word.word} - ${error.message}`);
          await delay(2000);
        }
      }

      console.log(`  Batch complete: ${batchSuccess} successful, ${batchErrors} errors`);
      console.log(`  Total progress: ${totalTranslated} translated, ${totalErrors} errors`);

      // Get remaining count
      const remainingResult = await pool.query(`
        SELECT COUNT(*) FROM source_words_arabic swa
        WHERE NOT EXISTS (
          SELECT 1 FROM target_translations_english_from_ar tt
          WHERE tt.source_word_id = swa.id
        )
      `);

      console.log(`  Remaining: ${remainingResult.rows[0].count} words`);

      if (wordsResult.rows.length === BATCH_SIZE) {
        console.log(`  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`\n✅ Translation complete!`);
    console.log(`   Total translated: ${totalTranslated}`);
    console.log(`   Total errors: ${totalErrors}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run the translation
translateArabicToEnglish();
