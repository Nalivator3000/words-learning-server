const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Use the free Google Translate API for translations
async function translateWithGoogleAPI(text) {
  const https = require('https');

  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=sw&dt=t&q=${encodedText}`;

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

// Enhanced translation function with German grammar context
async function translateGermanToSwahili(germanWord) {
  // Clean the word
  let word = germanWord.trim();

  // Handle articles and extract gender information
  let gender = '';
  let baseWord = word;

  if (word.startsWith('der ')) {
    gender = 'm'; // masculine
    baseWord = word.substring(4);
  } else if (word.startsWith('die ')) {
    gender = 'f'; // feminine
    baseWord = word.substring(4);
  } else if (word.startsWith('das ')) {
    gender = 'n'; // neuter
    baseWord = word.substring(4);
  } else if (word.startsWith('ein ')) {
    baseWord = word.substring(4);
  } else if (word.startsWith('eine ')) {
    baseWord = word.substring(5);
  }

  // Translate the base word
  let translation = await translateWithGoogleAPI(baseWord);

  if (!translation) {
    return null;
  }

  // For nouns with articles, try to preserve Swahili grammar hints
  // Swahili uses noun classes but we can add gender hints for learners
  if (gender && translation) {
    // Just return the translation without article since Swahili doesn't use articles
    // But we keep the capitalization for nouns
    return translation;
  }

  return translation;
}

async function translateAllToSwahili() {
  const client = await pool.connect();

  try {
    console.log('🇹🇿 Starting German → Swahili translation for ALL words...\n');

    // Get total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM source_words_german');
    const totalWords = parseInt(countResult.rows[0].total);
    console.log(`📊 Total German words in database: ${totalWords.toLocaleString()}\n`);

    // Check existing translations
    const existingResult = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_swahili
      WHERE source_lang = 'de'
    `);
    const existingCount = parseInt(existingResult.rows[0].count);
    console.log(`✓ Already translated: ${existingCount.toLocaleString()}`);
    console.log(`⏳ Remaining: ${(totalWords - existingCount).toLocaleString()}\n`);

    if (existingCount >= totalWords) {
      console.log('✅ All words already translated! Nothing to do.');
      return;
    }

    // Fetch all German words that don't have Swahili translations yet
    const words = await client.query(`
      SELECT sw.id, sw.word, sw.level, sw.example_de
      FROM source_words_german sw
      LEFT JOIN target_translations_swahili ts ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
      WHERE ts.id IS NULL
      ORDER BY sw.id
    `);

    console.log(`🔄 Processing ${words.rows.length.toLocaleString()} words...\n`);

    let translated = 0;
    let failed = 0;
    let batchInserts = [];
    const BATCH_SIZE = 100;
    const failedWords = [];

    const startTime = Date.now();
    let lastProgressTime = Date.now();

    for (let i = 0; i < words.rows.length; i++) {
      const row = words.rows[i];

      // Get Swahili translation
      const translation = await translateGermanToSwahili(row.word);

      if (!translation) {
        failed++;
        failedWords.push({
          id: row.id,
          word: row.word,
          level: row.level
        });

        // Show progress every 100 words or every 5 seconds
        const now = Date.now();
        if ((i + 1) % 100 === 0 || now - lastProgressTime >= 5000) {
          const percentage = ((i + 1) / words.rows.length * 100).toFixed(1);
          const elapsed = ((now - startTime) / 1000).toFixed(0);
          const rate = ((i + 1) / (now - startTime) * 1000).toFixed(1);
          const eta = (((words.rows.length - i - 1) / rate) / 60).toFixed(1);
          console.log(`⏳ Progress: ${i + 1}/${words.rows.length} (${percentage}%) | ${rate} words/sec | ETA: ${eta} min | Translated: ${translated} | Failed: ${failed}`);
          lastProgressTime = now;
        }

        continue;
      }

      // Add to batch
      batchInserts.push({
        source_word_id: row.id,
        translation: translation
      });

      translated++;

      // Insert batch every 100 translations or at the end
      if (batchInserts.length >= BATCH_SIZE || i === words.rows.length - 1) {
        if (batchInserts.length > 0) {
          try {
            // Build multi-row insert query
            const values = batchInserts.map((item, idx) => {
              const offset = idx * 2;
              return `('de', $${offset + 1}, $${offset + 2})`;
            }).join(', ');

            const params = batchInserts.flatMap(item => [item.source_word_id, item.translation]);

            await client.query(`
              INSERT INTO target_translations_swahili
              (source_lang, source_word_id, translation)
              VALUES ${values}
              ON CONFLICT (source_lang, source_word_id) DO NOTHING
            `, params);

            const now = Date.now();
            const percentage = ((i + 1) / words.rows.length * 100).toFixed(1);
            const elapsed = ((now - startTime) / 1000).toFixed(0);
            const rate = ((i + 1) / (now - startTime) * 1000).toFixed(1);
            const eta = (((words.rows.length - i - 1) / rate) / 60).toFixed(1);
            console.log(`✓ Batch inserted: ${batchInserts.length} | Progress: ${i + 1}/${words.rows.length} (${percentage}%) | ${rate} words/sec | ETA: ${eta} min`);

            batchInserts = [];
            lastProgressTime = now;
          } catch (err) {
            console.error(`❌ Batch insert failed:`, err.message);
          }
        }
      }

      // Small delay to avoid rate limiting (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(1);
    const avgRate = (translated / (endTime - startTime) * 1000).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('✅ TRANSLATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`📊 Statistics:`);
    console.log(`   Total words processed: ${words.rows.length.toLocaleString()}`);
    console.log(`   Successfully translated: ${translated.toLocaleString()}`);
    console.log(`   Failed: ${failed.toLocaleString()}`);
    console.log(`   Total time: ${totalTime} minutes`);
    console.log(`   Average rate: ${avgRate} words/second`);
    console.log('='.repeat(70));

    // Verify final count
    const finalResult = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_swahili
      WHERE source_lang = 'de'
    `);
    const finalCount = parseInt(finalResult.rows[0].count);
    console.log(`\n✓ Total Swahili translations in database: ${finalCount.toLocaleString()}/${totalWords.toLocaleString()}`);

    if (failedWords.length > 0) {
      console.log(`\n⚠️  Words that failed to translate (first 50):`);
      failedWords.slice(0, 50).forEach((w, idx) => {
        console.log(`   ${idx + 1}. [${w.level}] "${w.word}" (ID: ${w.id})`);
      });

      if (failedWords.length > 50) {
        console.log(`   ... and ${failedWords.length - 50} more`);
      }

      console.log(`\n💡 Tip: You can re-run this script to retry failed translations.`);
    }

    console.log('\n🎉 German → Swahili translation job complete!');

  } catch (err) {
    console.error('\n❌ Error during translation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the translation
translateAllToSwahili().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
