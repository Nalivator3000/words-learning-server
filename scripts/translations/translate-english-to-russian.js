#!/usr/bin/env node
/**
 * Translate English words to Russian
 * Creates translations for ru→en language pair
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Free Google Translate API
async function translateWithGoogleAPI(text, from, to) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodedText}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            resolve(parsed[0][0][0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(`Failed to parse translation for: "${text}"`, e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`Network error for: "${text}"`, err.message);
      resolve(null);
    });
  });
}

async function translateEnglishToRussian() {
  const client = await pool.connect();

  try {
    console.log('🇷🇺 Starting English → Russian translation...\n');

    // Get total count of English words
    const countResult = await client.query('SELECT COUNT(*) as total FROM source_words_english');
    const totalWords = parseInt(countResult.rows[0].total);
    console.log(`📊 Total English words: ${totalWords.toLocaleString()}\n`);

    // Check existing translations
    const existingResult = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_russian
      WHERE source_lang = 'en'
    `);
    const existingCount = parseInt(existingResult.rows[0].count);
    console.log(`✓ Already translated: ${existingCount.toLocaleString()}`);
    console.log(`⏳ Remaining: ${(totalWords - existingCount).toLocaleString()}\n`);

    if (existingCount >= totalWords) {
      console.log('✅ All English words already translated to Russian!');
      return;
    }

    // Get words that need translation
    const wordsToTranslate = await client.query(`
      SELECT sw.id, sw.word
      FROM source_words_english sw
      LEFT JOIN target_translations_russian tt
        ON tt.source_word_id = sw.id AND tt.source_lang = 'en'
      WHERE tt.id IS NULL
      ORDER BY sw.id
    `);

    const wordsNeedingTranslation = wordsToTranslate.rows;
    console.log(`🔄 Translating ${wordsNeedingTranslation.length} words...\n`);
    console.log('='.repeat(70));

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (let i = 0; i < wordsNeedingTranslation.length; i++) {
      const {id, word} = wordsNeedingTranslation[i];

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        const progress = ((i + 1) / wordsNeedingTranslation.length * 100).toFixed(1);
        console.log(`\n📊 Progress: ${i + 1}/${wordsNeedingTranslation.length} (${progress}%)`);
        console.log(`   ✅ Success: ${successCount} | ❌ Errors: ${errorCount} | ⏭️  Skipped: ${skipCount}\n`);
      }

      try {
        // Translate
        const translation = await translateWithGoogleAPI(word, 'en', 'ru');

        if (!translation) {
          console.error(`   ⚠️  No translation for: "${word}"`);
          errorCount++;
          continue;
        }

        // Insert translation
        await client.query(`
          INSERT INTO target_translations_russian (source_lang, source_word_id, translation)
          VALUES ('en', $1, $2)
          ON CONFLICT (source_lang, source_word_id) DO UPDATE
          SET translation = EXCLUDED.translation
        `, [id, translation]);

        successCount++;

        // Rate limiting - delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error translating "${word}":`, error.message);
        errorCount++;

        // If error, wait a bit longer
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 Translation complete!\n');
    console.log('📊 Final Statistics:');
    console.log(`   ✅ Successfully translated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📊 Total processed: ${wordsNeedingTranslation.length}`);
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

translateEnglishToRussian().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
