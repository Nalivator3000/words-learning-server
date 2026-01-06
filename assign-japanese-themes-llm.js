/**
 * Assign themes to Japanese words using Claude AI
 * Processes words in batches to assign appropriate themes
 */

const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const THEMES = [
  'communication', 'food', 'home', 'time', 'work', 'emotions',
  'travel', 'numbers', 'weather', 'colors', 'health', 'clothing',
  'family', 'culture', 'nature', 'sports', 'education', 'technology'
];

const BATCH_SIZE = 50; // Process 50 words per API call
const DELAY_MS = 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function assignThemesWithClaude(words) {
  const wordList = words.map(w => `"${w.word}" (${w.translation})`).join(', ');

  const prompt = `Assign themes to these Japanese words. Available themes: ${THEMES.join(', ')}.

Words to categorize: ${wordList}

For each word, assign the MOST appropriate theme from the list above. If no theme fits well, use "general".

Return ONLY a JSON array with this exact format:
[
  {
    "word": "こんにちは",
    "theme": "communication"
  },
  {
    "word": "りんご",
    "theme": "food"
  }
]

Provide exactly ${words.length} entries. No additional text, just the JSON array.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON from response
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const themes = JSON.parse(jsonText);

    if (!Array.isArray(themes)) {
      throw new Error('Response is not an array');
    }

    return themes;
  } catch (error) {
    console.error(`Error assigning themes: ${error.message}`);
    return [];
  }
}

async function updateWordThemes(themeAssignments) {
  const updatePromises = themeAssignments.map(item => {
    // Validate theme
    const theme = THEMES.includes(item.theme) ? item.theme : 'general';

    return pool.query(
      `UPDATE source_words_japanese
       SET theme = $1
       WHERE word = $2`,
      [theme, item.word]
    );
  });

  const results = await Promise.all(updatePromises);
  return results.filter(r => r.rowCount > 0).length;
}

async function processThemeAssignment() {
  console.log('\n' + '='.repeat(80));
  console.log('ASSIGN THEMES TO JAPANESE WORDS');
  console.log('='.repeat(80) + '\n');

  try {
    // Get all words without themes
    const wordsQuery = await pool.query(`
      SELECT word, translation
      FROM source_words_japanese
      WHERE theme IS NULL
      ORDER BY word
    `);

    const totalWords = wordsQuery.rows.length;
    console.log(`Total words to process: ${totalWords.toLocaleString()}\n`);

    if (totalWords === 0) {
      console.log('No words to process. All words already have themes.\n');
      return;
    }

    let processed = 0;
    let updated = 0;

    // Process in batches
    for (let i = 0; i < totalWords; i += BATCH_SIZE) {
      const batch = wordsQuery.rows.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalWords / BATCH_SIZE);

      console.log(`Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} words...`);

      const themeAssignments = await assignThemesWithClaude(batch);

      if (themeAssignments.length > 0) {
        const updatedCount = await updateWordThemes(themeAssignments);
        updated += updatedCount;
        console.log(`  Assigned themes to ${updatedCount} words`);
      } else {
        console.log(`  Failed to assign themes, skipping batch`);
      }

      processed += batch.length;
      console.log(`  Progress: ${processed}/${totalWords} (${((processed/totalWords)*100).toFixed(1)}%)\n`);

      if (i + BATCH_SIZE < totalWords) {
        await delay(DELAY_MS); // Rate limiting
      }
    }

    // Show statistics
    console.log('\n' + '='.repeat(80));
    console.log('THEME ASSIGNMENT COMPLETE!');
    console.log('='.repeat(80) + '\n');

    const themeStats = await pool.query(`
      SELECT theme, COUNT(*) as count
      FROM source_words_japanese
      WHERE theme IS NOT NULL
      GROUP BY theme
      ORDER BY count DESC
    `);

    console.log('Theme distribution:');
    themeStats.rows.forEach(row => {
      console.log(`  ${row.theme.padEnd(15)}: ${parseInt(row.count).toLocaleString()} words`);
    });

    const nullThemes = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_japanese
      WHERE theme IS NULL
    `);
    const nullCount = parseInt(nullThemes.rows[0].count);

    if (nullCount > 0) {
      console.log(`  ${('NULL').padEnd(15)}: ${nullCount.toLocaleString()} words`);
    }

    console.log(`\nTotal themed: ${updated.toLocaleString()} words`);
    console.log(`Remaining: ${nullCount.toLocaleString()} words\n`);

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

processThemeAssignment();
