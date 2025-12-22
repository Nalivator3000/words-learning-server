const { Pool } = require('pg');
const translate = require('@vitalets/google-translate-api');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Helper function to add delay between requests to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to extract base word from German word with article
function extractBaseWord(germanWord) {
  // Remove articles (der, die, das, ein, eine) for better translation
  const withoutArticle = germanWord
    .replace(/^(der|die|das|ein|eine)\s+/i, '')
    .trim();

  return withoutArticle || germanWord;
}

// Helper function to translate a single word with retry logic
async function translateWord(germanWord, retries = 3) {
  const baseWord = extractBaseWord(germanWord);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await translate(baseWord, { from: 'de', to: 'sw' });
      return result.text;
    } catch (error) {
      if (attempt === retries) {
        console.error(`   ❌ Failed to translate "${germanWord}" after ${retries} attempts:`, error.message);
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      console.log(`   ⚠️  Retry ${attempt}/${retries} for "${germanWord}" in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }

  return null;
}

async function translateAllToSwahili() {
  const client = await pool.connect();

  try {
    console.log('🌍 Translating ALL German words → Swahili...\n');
    console.log('📊 Fetching German words from database...\n');

    // Get total count first
    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM source_words_german
    `);
    const totalWords = parseInt(countResult.rows[0].total);
    console.log(`Found ${totalWords} total German words in database\n`);

    // Fetch all German words ordered by ID
    const words = await client.query(`
      SELECT id, word, level, example_de
      FROM source_words_german
      ORDER BY id
    `);

    console.log(`Starting translation process...\n`);
    console.log('─'.repeat(60));

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const failedWords = [];
    const batchSize = 50;
    let batchCount = 0;

    for (let i = 0; i < words.rows.length; i++) {
      const row = words.rows[i];

      // Check if translation already exists
      const existing = await client.query(`
        SELECT id FROM target_translations_swahili
        WHERE source_lang = 'de' AND source_word_id = $1
      `, [row.id]);

      if (existing.rows.length > 0) {
        skipped++;
        if (skipped % 100 === 0) {
          console.log(`⏭️  Skipped (already exists): ${skipped}`);
        }
        continue;
      }

      // Translate the word
      const translation = await translateWord(row.word);

      if (!translation) {
        failed++;
        failedWords.push({
          id: row.id,
          word: row.word,
          level: row.level
        });
        continue;
      }

      // Insert translation into database
      try {
        await client.query(`
          INSERT INTO target_translations_swahili
          (source_lang, source_word_id, translation)
          VALUES ('de', $1, $2)
          ON CONFLICT (source_lang, source_word_id)
          DO UPDATE SET
            translation = EXCLUDED.translation,
            updated_at = NOW()
        `, [row.id, translation]);

        translated++;

        // Progress updates
        if (translated % 50 === 0) {
          const progress = ((i + 1) / words.rows.length * 100).toFixed(1);
          console.log(`✓ Translated: ${translated} | Progress: ${progress}% | Failed: ${failed} | Skipped: ${skipped}`);
        }

        // Add small delay to avoid overwhelming the API
        if (translated % 10 === 0) {
          await delay(500); // 500ms delay every 10 words
        }

      } catch (dbError) {
        console.error(`   ❌ Database error for word "${row.word}":`, dbError.message);
        failed++;
        failedWords.push({
          id: row.id,
          word: row.word,
          level: row.level,
          error: 'Database insertion failed'
        });
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Translation complete!\n');
    console.log('📈 Summary:');
    console.log(`   Total words in database: ${totalWords}`);
    console.log(`   Successfully translated: ${translated}`);
    console.log(`   Already existed (skipped): ${skipped}`);
    console.log(`   Failed to translate: ${failed}`);
    console.log(`   Coverage: ${((translated + skipped) / totalWords * 100).toFixed(2)}%`);

    if (failedWords.length > 0) {
      console.log(`\n⚠️  Failed translations (${failedWords.length} words):`);
      console.log('\nFirst 50 failed words:');
      failedWords.slice(0, 50).forEach((w, idx) => {
        console.log(`   ${idx + 1}. ID ${w.id}: "${w.word}" [${w.level}]${w.error ? ` - ${w.error}` : ''}`);
      });

      if (failedWords.length > 50) {
        console.log(`   ... and ${failedWords.length - 50} more`);
      }

      // Save failed words to a file for review
      const fs = require('fs');
      const failedWordsJson = JSON.stringify(failedWords, null, 2);
      fs.writeFileSync('scripts/failed-swahili-translations.json', failedWordsJson);
      console.log('\n💾 Failed words saved to: scripts/failed-swahili-translations.json');
    }

    // Verify final count
    const finalCount = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_swahili
      WHERE source_lang = 'de'
    `);

    console.log(`\n✅ Total Swahili translations in database: ${finalCount.rows[0].count}`);

  } catch (err) {
    console.error('\n❌ Critical error during translation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the translation
console.log('🚀 Starting Swahili translation script...\n');
translateAllToSwahili()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Script failed:', err);
    process.exit(1);
  });
