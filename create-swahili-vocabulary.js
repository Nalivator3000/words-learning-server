#!/usr/bin/env node
/**
 * COMPREHENSIVE SWAHILI VOCABULARY BUILDER
 *
 * This script performs the following operations:
 * 1. Deletes all synthetic/test data from source_words_swahili
 * 2. Generates ~10,000 real Swahili words using LLM (via Anthropic API)
 * 3. Inserts real words into the database with proper distribution
 * 4. Assigns themes to all words
 * 5. Creates thematic word sets
 *
 * Distribution by level:
 * - A1: 1000 words (beginner)
 * - A2: 1000 words (elementary)
 * - B1: 1500 words (intermediate)
 * - B2: 2000 words (upper intermediate)
 * - C1: 2500 words (advanced)
 * - C2: 2000 words (proficiency)
 * Total: 10,000 words
 */

const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BATCH_SIZE = 100; // Generate 100 words per LLM call
const LEVEL_DISTRIBUTION = {
  'A1': 1000,
  'A2': 1000,
  'B1': 1500,
  'B2': 2000,
  'C1': 2500,
  'C2': 2000
};

const THEMES = [
  'communication', 'food', 'home', 'time', 'work', 'emotions',
  'travel', 'numbers', 'weather', 'colors', 'health', 'clothing',
  'family', 'culture', 'nature', 'sports', 'education', 'technology'
];

/**
 * Call Anthropic API to generate Swahili words
 */
async function callAnthropicAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.content && response.content[0] && response.content[0].text) {
            resolve(response.content[0].text);
          } else {
            reject(new Error('Invalid API response format'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Generate Swahili words for a specific level using LLM
 */
async function generateWordsForLevel(level, count) {
  console.log(`\n🤖 Generating ${count} Swahili words for level ${level}...`);

  const levelDescriptions = {
    'A1': 'absolute beginner - basic greetings, numbers 1-10, common objects, simple verbs like "to be", "to have"',
    'A2': 'elementary - basic conversations, daily routines, simple past tense, numbers up to 100',
    'B1': 'intermediate - expressing opinions, describing experiences, future tense, common idioms',
    'B2': 'upper intermediate - complex grammar, abstract concepts, cultural topics, nuanced vocabulary',
    'C1': 'advanced - sophisticated expressions, technical terms, literature, professional contexts',
    'C2': 'proficiency - native-level vocabulary, rare words, specialized terminology, regional variations'
  };

  const allWords = [];
  const batches = Math.ceil(count / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const wordsInBatch = Math.min(BATCH_SIZE, count - (batch * BATCH_SIZE));

    console.log(`  Batch ${batch + 1}/${batches}: requesting ${wordsInBatch} words...`);

    const prompt = `Generate exactly ${wordsInBatch} real Swahili words appropriate for CEFR level ${level} (${levelDescriptions[level]}).

REQUIREMENTS:
1. Only real, authentic Swahili words (NOT synthetic or test data)
2. Include the English translation
3. Mix of nouns, verbs, adjectives, adverbs
4. Diverse vocabulary covering different topics
5. Level-appropriate complexity

FORMAT (one word per line):
swahili_word|english_translation

EXAMPLE:
habari|news
kusoma|to read
nyeupe|white
furaha|happiness

NOW GENERATE ${wordsInBatch} WORDS:`;

    try {
      const response = await callAnthropicAPI(prompt);

      // Parse response
      const lines = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.includes('|') && !line.startsWith('#') && !line.startsWith('//'));

      for (const line of lines) {
        const [word, translation] = line.split('|').map(s => s.trim());
        if (word && translation && word.length > 0 && translation.length > 0) {
          allWords.push({ word, translation, level });
        }
      }

      console.log(`    ✓ Received ${lines.length} words`);

      // Rate limiting - wait 1 second between API calls
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`    ✗ Error in batch ${batch + 1}:`, error.message);
      throw error;
    }
  }

  console.log(`  ✅ Total generated for ${level}: ${allWords.length} words`);
  return allWords;
}

/**
 * Assign theme to a word using LLM
 */
async function assignThemesToWords(words) {
  console.log(`\n🏷️  Assigning themes to ${words.length} words...`);

  const THEME_BATCH_SIZE = 50; // Process 50 words at a time for theme assignment
  const batches = Math.ceil(words.length / THEME_BATCH_SIZE);
  const wordThemes = {};

  for (let batch = 0; batch < batches; batch++) {
    const start = batch * THEME_BATCH_SIZE;
    const end = Math.min(start + THEME_BATCH_SIZE, words.length);
    const batchWords = words.slice(start, end);

    console.log(`  Batch ${batch + 1}/${batches}: assigning themes to ${batchWords.length} words...`);

    const wordList = batchWords.map(w => `${w.word}|${w.translation}`).join('\n');
    const themeList = THEMES.join(', ');

    const prompt = `Assign the most appropriate theme to each Swahili word from this list: ${themeList}

WORDS:
${wordList}

INSTRUCTIONS:
1. Choose the MOST appropriate single theme for each word
2. If no specific theme fits well, use "general"
3. Consider the word's primary meaning and common usage

FORMAT (one per line):
swahili_word|theme

EXAMPLE:
mama|family
chakula|food
nyumba|home
habari|communication

NOW ASSIGN THEMES TO ALL WORDS ABOVE:`;

    try {
      const response = await callAnthropicAPI(prompt);

      const lines = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.includes('|'));

      for (const line of lines) {
        const [word, theme] = line.split('|').map(s => s.trim());
        if (word && theme) {
          wordThemes[word] = THEMES.includes(theme) ? theme : 'general';
        }
      }

      console.log(`    ✓ Assigned themes to ${lines.length} words`);

      // Rate limiting
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`    ✗ Error in theme batch ${batch + 1}:`, error.message);
      // Continue with next batch even if this one fails
    }
  }

  // Assign themes to words
  for (const word of words) {
    word.theme = wordThemes[word.word] || 'general';
  }

  console.log(`  ✅ Theme assignment complete`);
  return words;
}

/**
 * Step 1: Delete all synthetic data
 */
async function deleteSyntheticData() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 1: DELETING SYNTHETIC/TEST DATA');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Check current count
    const beforeCount = await pool.query(
      `SELECT COUNT(*) as total FROM source_words_swahili`
    );
    console.log(`Current total words: ${beforeCount.rows[0].total}`);

    // Count synthetic words
    const syntheticCount = await pool.query(
      `SELECT COUNT(*) as synthetic FROM source_words_swahili WHERE word LIKE '%\_%'`
    );
    console.log(`Synthetic words (containing underscore): ${syntheticCount.rows[0].synthetic}`);

    // Delete synthetic data
    const deleteResult = await pool.query(
      `DELETE FROM source_words_swahili WHERE word LIKE '%\_%'`
    );
    console.log(`\n✅ Deleted ${deleteResult.rowCount} synthetic words`);

    // Check remaining count
    const afterCount = await pool.query(
      `SELECT COUNT(*) as remaining FROM source_words_swahili`
    );
    console.log(`Remaining real words: ${afterCount.rows[0].remaining}`);

  } catch (error) {
    console.error('❌ Error deleting synthetic data:', error.message);
    throw error;
  }
}

/**
 * Step 2: Generate and insert real Swahili words
 */
async function generateAndInsertWords() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 2: GENERATING REAL SWAHILI VOCABULARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set!');
    console.error('Please set it with: export ANTHROPIC_API_KEY=your_key_here');
    throw new Error('Missing API key');
  }

  const allWords = [];

  // Generate words for each level
  for (const [level, count] of Object.entries(LEVEL_DISTRIBUTION)) {
    const words = await generateWordsForLevel(level, count);
    allWords.push(...words);
  }

  console.log(`\n📊 Total words generated: ${allWords.length}`);

  // Assign themes
  const wordsWithThemes = await assignThemesToWords(allWords);

  console.log('\n💾 Inserting words into database...');

  let inserted = 0;
  let duplicates = 0;

  for (const wordData of wordsWithThemes) {
    try {
      await pool.query(
        `INSERT INTO source_words_swahili (word, translation, level, theme, is_core)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (word) DO NOTHING`,
        [wordData.word, wordData.translation, wordData.level, wordData.theme]
      );
      inserted++;
    } catch (error) {
      duplicates++;
      console.error(`  ⚠️  Duplicate or error for word "${wordData.word}": ${error.message}`);
    }

    if (inserted % 100 === 0) {
      console.log(`  Progress: ${inserted} words inserted...`);
    }
  }

  console.log(`\n✅ Inserted ${inserted} words successfully`);
  if (duplicates > 0) {
    console.log(`⚠️  Skipped ${duplicates} duplicates`);
  }
}

/**
 * Step 3: Update themes for any remaining words without themes
 */
async function updateThemes() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 3: UPDATING THEMES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Set any NULL themes to 'general'
  const result = await pool.query(
    `UPDATE source_words_swahili SET theme = 'general' WHERE theme IS NULL`
  );

  console.log(`✅ Updated ${result.rowCount} words with NULL themes to 'general'`);
}

/**
 * Step 4: Create thematic word sets
 */
async function createWordSets() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 4: CREATING THEMATIC WORD SETS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Delete old word sets
  const deleteResult = await pool.query(
    `DELETE FROM word_sets WHERE source_language = 'swahili'`
  );
  console.log(`🗑️  Deleted ${deleteResult.rowCount} old word sets\n`);

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const MIN_THEME_SIZE = 10;
  const CHUNK_SIZE = 50;
  let totalCreated = 0;

  const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficiency'
  };

  for (const level of LEVELS) {
    console.log(`📈 Level ${level}:`);

    // Get theme distribution for this level
    const themesQuery = await pool.query(
      `SELECT theme, COUNT(*) as count
       FROM source_words_swahili
       WHERE level = $1 AND theme IS NOT NULL
       GROUP BY theme
       ORDER BY count DESC`,
      [level]
    );

    for (const themeRow of themesQuery.rows) {
      const theme = themeRow.theme;
      const count = parseInt(themeRow.count);

      if (count < MIN_THEME_SIZE && theme !== 'general') {
        continue;
      }

      if (theme === 'general') {
        // Split general into chunks
        const chunks = Math.ceil(count / CHUNK_SIZE);
        for (let i = 0; i < chunks; i++) {
          const actualCount = Math.min(CHUNK_SIZE, count - (i * CHUNK_SIZE));
          const title = `Swahili ${level}: Essential Vocabulary ${i + 1}`;
          const description = `${LEVEL_DESCRIPTIONS[level]} level essential vocabulary - Part ${i + 1}`;

          await pool.query(
            `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
             VALUES ($1, $2, $3, $4, 'general', $5, true)`,
            ['swahili', title, description, level, actualCount]
          );

          totalCreated++;
        }
      } else {
        // Create thematic set
        const title = `Swahili ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
        const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

        await pool.query(
          `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          ['swahili', title, description, level, theme, count]
        );

        totalCreated++;
      }
    }
  }

  console.log(`\n✅ Created ${totalCreated} thematic word sets`);
}

/**
 * Print final statistics
 */
async function printStatistics() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FINAL STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Total words
  const totalResult = await pool.query(
    `SELECT COUNT(*) as total FROM source_words_swahili`
  );
  console.log(`📊 Total words in database: ${totalResult.rows[0].total}`);

  // By level
  console.log('\n📈 Distribution by level:');
  const levelResult = await pool.query(
    `SELECT level, COUNT(*) as count
     FROM source_words_swahili
     GROUP BY level
     ORDER BY level`
  );
  for (const row of levelResult.rows) {
    console.log(`  ${row.level}: ${row.count} words`);
  }

  // By theme
  console.log('\n🏷️  Distribution by theme:');
  const themeResult = await pool.query(
    `SELECT theme, COUNT(*) as count
     FROM source_words_swahili
     GROUP BY theme
     ORDER BY count DESC
     LIMIT 20`
  );
  for (const row of themeResult.rows) {
    console.log(`  ${row.theme}: ${row.count} words`);
  }

  // Word sets
  const setsResult = await pool.query(
    `SELECT COUNT(*) as total FROM word_sets WHERE source_language = 'swahili'`
  );
  console.log(`\n📚 Total word sets created: ${setsResult.rows[0].total}`);

  // Sample words
  console.log('\n📝 Sample words:');
  const sampleResult = await pool.query(
    `SELECT word, translation, level, theme
     FROM source_words_swahili
     ORDER BY RANDOM()
     LIMIT 10`
  );
  for (const row of sampleResult.rows) {
    console.log(`  ${row.word} (${row.translation}) - ${row.level} - ${row.theme}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        SWAHILI VOCABULARY BUILDER - COMPREHENSIVE             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  try {
    // Step 1: Delete synthetic data
    await deleteSyntheticData();

    // Step 2: Generate and insert real words
    await generateAndInsertWords();

    // Step 3: Update themes
    await updateThemes();

    // Step 4: Create word sets
    await createWordSets();

    // Print statistics
    await printStatistics();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    🎉 COMPLETED SUCCESSFULLY! 🎉               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
