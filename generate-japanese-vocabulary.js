/**
 * Generate complete Japanese vocabulary (~10,000 words) using Anthropic Claude API
 * This script will:
 * 1. Clean up synthetic data
 * 2. Generate real Japanese words with translations
 * 3. Insert them into source_words_japanese table
 *
 * Distribution by level:
 * - A1: 1,000 words (basic)
 * - A2: 1,000 words (elementary)
 * - B1: 1,500 words (intermediate)
 * - B2: 2,000 words (upper intermediate)
 * - C1: 2,500 words (advanced)
 * - C2: 2,000 words (proficiency)
 * Total: 10,000 words
 */

const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const LEVEL_CONFIG = {
  'A1': { count: 1000, description: 'Basic everyday words and phrases' },
  'A2': { count: 1000, description: 'Elementary level common vocabulary' },
  'B1': { count: 1500, description: 'Intermediate level general vocabulary' },
  'B2': { count: 2000, description: 'Upper intermediate level complex vocabulary' },
  'C1': { count: 2500, description: 'Advanced level specialized vocabulary' },
  'C2': { count: 2000, description: 'Proficiency level sophisticated vocabulary' }
};

const BATCH_SIZE = 100; // Generate 100 words per API call
const DELAY_MS = 1000; // Delay between API calls to avoid rate limiting

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanupSyntheticData() {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 1: CLEANUP SYNTHETIC DATA');
  console.log('='.repeat(80) + '\n');

  const totalBefore = await pool.query('SELECT COUNT(*) as count FROM source_words_japanese');
  console.log(`Total words before cleanup: ${parseInt(totalBefore.rows[0].count).toLocaleString()}`);

  const deleteResult = await pool.query(`DELETE FROM source_words_japanese WHERE word LIKE '%_%'`);
  console.log(`Deleted synthetic records: ${deleteResult.rowCount.toLocaleString()}`);

  const totalAfter = await pool.query('SELECT COUNT(*) as count FROM source_words_japanese');
  console.log(`Total words after cleanup: ${parseInt(totalAfter.rows[0].count).toLocaleString()}\n`);
}

async function generateWordsWithClaude(level, batchNumber, batchSize, existingWords) {
  const levelInfo = LEVEL_CONFIG[level];

  const prompt = `Generate exactly ${batchSize} unique Japanese vocabulary words appropriate for JLPT ${level} level.

Requirements:
1. Words must be real, commonly used Japanese words
2. Include a mix of kanji, hiragana, and katakana as appropriate
3. Each word should have an accurate English translation
4. Words should be appropriate for ${level} level (${levelInfo.description})
5. DO NOT include any of these words: ${existingWords.slice(0, 50).join(', ')}
6. Provide diverse vocabulary covering different topics

Return ONLY a JSON array with this exact format:
[
  {
    "word": "こんにちは",
    "translation": "hello"
  },
  {
    "word": "ありがとう",
    "translation": "thank you"
  }
]

Generate exactly ${batchSize} words. No additional text, just the JSON array.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON from response (in case there's markdown formatting)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const words = JSON.parse(jsonText);

    if (!Array.isArray(words)) {
      throw new Error('Response is not an array');
    }

    return words.filter(w => w.word && w.translation);
  } catch (error) {
    console.error(`Error generating words: ${error.message}`);
    console.error('Response text:', error.response?.data || 'N/A');
    return [];
  }
}

async function insertWords(words, level) {
  const insertPromises = words.map(word => {
    return pool.query(
      `INSERT INTO source_words_japanese (word, translation, level)
       VALUES ($1, $2, $3)
       ON CONFLICT (word) DO NOTHING`,
      [word.word, word.translation, level]
    );
  });

  const results = await Promise.all(insertPromises);
  const inserted = results.filter(r => r.rowCount > 0).length;
  return inserted;
}

async function generateVocabularyForLevel(level) {
  const config = LEVEL_CONFIG[level];
  const targetCount = config.count;

  console.log('\n' + '-'.repeat(80));
  console.log(`GENERATING ${level} LEVEL (Target: ${targetCount} words)`);
  console.log('-'.repeat(80) + '\n');

  let totalGenerated = 0;
  let totalInserted = 0;
  let batchNumber = 1;
  const existingWords = [];

  while (totalInserted < targetCount) {
    const remaining = targetCount - totalInserted;
    const batchSize = Math.min(BATCH_SIZE, remaining + 20); // Generate extra to account for duplicates

    console.log(`Batch ${batchNumber}: Generating ${batchSize} words...`);

    const words = await generateWordsWithClaude(level, batchNumber, batchSize, existingWords);

    if (words.length === 0) {
      console.log('Failed to generate words, retrying...');
      await delay(DELAY_MS * 2);
      continue;
    }

    const inserted = await insertWords(words, level);
    totalGenerated += words.length;
    totalInserted += inserted;

    // Track existing words to avoid duplicates
    words.forEach(w => existingWords.push(w.word));

    console.log(`  Generated: ${words.length} words`);
    console.log(`  Inserted: ${inserted} new words`);
    console.log(`  Progress: ${totalInserted}/${targetCount} (${((totalInserted/targetCount)*100).toFixed(1)}%)\n`);

    if (totalInserted >= targetCount) {
      break;
    }

    batchNumber++;
    await delay(DELAY_MS); // Rate limiting
  }

  console.log(`${level} Complete: ${totalInserted} words inserted\n`);
  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('JAPANESE VOCABULARY GENERATION');
  console.log('Target: 10,000 real Japanese words');
  console.log('='.repeat(80));

  try {
    // Step 1: Cleanup
    await cleanupSyntheticData();

    // Step 2: Generate vocabulary for each level
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: GENERATE VOCABULARY');
    console.log('='.repeat(80));

    const results = {};

    for (const [level, config] of Object.entries(LEVEL_CONFIG)) {
      const inserted = await generateVocabularyForLevel(level);
      results[level] = inserted;
    }

    // Step 3: Final statistics
    console.log('\n' + '='.repeat(80));
    console.log('GENERATION COMPLETE!');
    console.log('='.repeat(80) + '\n');

    const finalCount = await pool.query('SELECT COUNT(*) as count FROM source_words_japanese');
    const total = parseInt(finalCount.rows[0].count);

    console.log('Words by level:');
    for (const [level, count] of Object.entries(results)) {
      console.log(`  ${level}: ${count.toLocaleString()} words`);
    }
    console.log(`\nTotal: ${total.toLocaleString()} words`);

    // Show distribution by level
    const byLevel = await pool.query(`
      SELECT level, COUNT(*) as count
      FROM source_words_japanese
      GROUP BY level
      ORDER BY
        CASE level
          WHEN 'A1' THEN 1
          WHEN 'A2' THEN 2
          WHEN 'B1' THEN 3
          WHEN 'B2' THEN 4
          WHEN 'C1' THEN 5
          WHEN 'C2' THEN 6
        END
    `);

    console.log('\nActual distribution in database:');
    byLevel.rows.forEach(row => {
      console.log(`  ${row.level}: ${parseInt(row.count).toLocaleString()} words`);
    });

    // Show sample words
    console.log('\nSample words:');
    const sample = await pool.query(`
      SELECT word, translation, level
      FROM source_words_japanese
      ORDER BY RANDOM()
      LIMIT 10
    `);
    sample.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.word} (${row.translation}) - ${row.level}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('SUCCESS!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\nERROR:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\nERROR: ANTHROPIC_API_KEY environment variable is not set!');
  console.error('Please set it with: $env:ANTHROPIC_API_KEY="your-key-here"\n');
  process.exit(1);
}

main();
