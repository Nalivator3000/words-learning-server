/**
 * COMPLETE HINDI VOCABULARY REBUILD
 *
 * This script performs the following steps:
 * 1. Deletes all synthetic data (words containing "_")
 * 2. Generates ~10,000 real Hindi words using LLM API
 * 3. Assigns themes to all words
 * 4. Creates thematic word sets
 *
 * Usage: node rebuild-hindi-vocabulary-complete.js
 */

const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// CEFR Level distribution for 10,000 words
const LEVEL_DISTRIBUTION = {
  'A1': 1000,
  'A2': 1000,
  'B1': 1500,
  'B2': 2000,
  'C1': 2500,
  'C2': 2000
};

// Available themes
const THEMES = [
  'communication', 'food', 'home', 'time', 'work',
  'emotions', 'travel', 'numbers', 'weather', 'colors',
  'health', 'clothing', 'family', 'culture', 'nature',
  'sports', 'education', 'technology'
];

// Hindi theme keywords for rule-based assignment
const THEME_KEYWORDS = {
  family: ['पिता', 'माता', 'भाई', 'बहन', 'पुत्र', 'पुत्री', 'दादा', 'दादी', 'परिवार', 'पति', 'पत्नी', 'शादी', 'विवाह'],
  food: ['खाना', 'भोजन', 'रोटी', 'चावल', 'दाल', 'सब्जी', 'फल', 'मीठा', 'चाय', 'पानी', 'दूध', 'नमक', 'मिर्च'],
  travel: ['यात्रा', 'सफर', 'मंदिर', 'बाजार', 'सड़क', 'रेल', 'गाड़ी', 'हवा', 'समुद्र', 'पहाड़', 'गाँव', 'शहर', 'देश'],
  home: ['घर', 'मकान', 'कमरा', 'दरवाज़ा', 'खिड़की', 'छत', 'रसोई', 'बिस्तर', 'कुर्सी', 'मेज'],
  health: ['स्वास्थ्य', 'रोग', 'वैद्य', 'दवा', 'डॉक्टर', 'सिर', 'पैर', 'हाथ', 'आँख', 'दाँत', 'कान', 'नाक', 'बुखार', 'दर्द'],
  work: ['काम', 'नौकरी', 'किसान', 'कर्मचारी', 'दफ्तर', 'व्यापार', 'व्यवसाय', 'कंपनी'],
  education: ['शिक्षा', 'विद्या', 'पाठशाला', 'गुरु', 'छात्र', 'पुस्तक', 'पढ़ाई', 'ज्ञान', 'परीक्षा', 'अध्यापक', 'भाषा'],
  nature: ['प्रकृति', 'वन', 'पेड़', 'पौधा', 'फूल', 'पत्ता', 'नदी', 'आकाश', 'सूरज', 'चाँद', 'तारे', 'जानवर', 'पक्षी'],
  weather: ['मौसम', 'गर्मी', 'ठंडी', 'बारिश', 'बादल', 'बिजली', 'हवा', 'ठंड', 'तूफान', 'धूप'],
  communication: ['बात', 'सुना', 'लिखा', 'बोली', 'वाणी', 'आवाज़', 'शब्द', 'भाषा', 'संवाद', 'भाषण'],
  culture: ['संस्कृति', 'परंपरा', 'त्योहार', 'पूजा', 'देवी', 'देवता', 'कथा', 'इतिहास', 'साहित्य', 'संगीत', 'नृत्य', 'मंदिर'],
  emotions: ['भावना', 'खुशी', 'दुख', 'गुस्सा', 'भय', 'प्यार', 'शर्म', 'गर्व', 'दोस्त', 'आनंद', 'चिंता'],
  sports: ['खेल', 'खिलाड़ी', 'दौड़', 'कूद', 'मैदान', 'जीत', 'हार', 'ताकत', 'शक्ति', 'योग'],
  technology: ['यंत्र', 'उपकरण', 'तकनीक', 'विद्युत', 'कंप्यूटर', 'फोन', 'इंटरनेट', 'विज्ञान'],
  time: ['समय', 'घड़ी', 'दिन', 'रात', 'सुबह', 'शाम', 'कल', 'आज', 'अब', 'बाद', 'पहले', 'सप्ताह', 'महीना', 'साल'],
  numbers: ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छः', 'सात', 'आठ', 'नौ', 'दस', 'सौ', 'संख्या'],
  colors: ['रंग', 'लाल', 'पीला', 'नीला', 'हरा', 'सफेद', 'काला', 'भूरा', 'गुलाबी'],
  clothing: ['कपड़ा', 'वस्त्र', 'साड़ी', 'जूता', 'टोपी', 'हार', 'कंगन']
};

// Utility function to make API calls to Claude via Anthropic API
async function callClaudeAPI(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('⚠️  No ANTHROPIC_API_KEY found, using fallback method...');
    return null;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.content && parsed.content[0] && parsed.content[0].text) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Invalid API response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Step 1: Delete synthetic data
async function deleteSyntheticData() {
  console.log('\n' + '═'.repeat(80));
  console.log('STEP 1: DELETING SYNTHETIC DATA');
  console.log('═'.repeat(80) + '\n');

  try {
    const countBefore = await pool.query('SELECT COUNT(*) FROM source_words_hindi');
    console.log(`📊 Words before deletion: ${countBefore.rows[0].count}`);

    const syntheticCount = await pool.query(`
      SELECT COUNT(*) FROM source_words_hindi
      WHERE word LIKE '%_%'
    `);
    console.log(`🗑️  Synthetic words to delete: ${syntheticCount.rows[0].count}`);

    const result = await pool.query(`
      DELETE FROM source_words_hindi
      WHERE word LIKE '%_%'
    `);

    const countAfter = await pool.query('SELECT COUNT(*) FROM source_words_hindi');
    console.log(`✅ Deleted: ${result.rowCount} synthetic words`);
    console.log(`📊 Remaining real words: ${countAfter.rows[0].count}\n`);

    return parseInt(countAfter.rows[0].count);
  } catch (error) {
    console.error('❌ Error deleting synthetic data:', error.message);
    throw error;
  }
}

// Step 2: Generate vocabulary using LLM or fallback
async function generateVocabulary(existingCount) {
  console.log('\n' + '═'.repeat(80));
  console.log('STEP 2: GENERATING REAL HINDI VOCABULARY');
  console.log('═'.repeat(80) + '\n');

  const totalNeeded = 10000;
  const toGenerate = totalNeeded - existingCount;

  console.log(`📝 Target vocabulary: ${totalNeeded} words`);
  console.log(`✨ Already have: ${existingCount} words`);
  console.log(`🔄 Need to generate: ${toGenerate} words\n`);

  if (toGenerate <= 0) {
    console.log('✅ Already have enough words!\n');
    return;
  }

  // Calculate how many words per level we need
  const wordsPerLevel = {};
  for (const [level, target] of Object.entries(LEVEL_DISTRIBUTION)) {
    const existing = await pool.query(
      'SELECT COUNT(*) FROM source_words_hindi WHERE level = $1',
      [level]
    );
    const existingCount = parseInt(existing.rows[0].count);
    wordsPerLevel[level] = Math.max(0, target - existingCount);
  }

  console.log('📊 Words needed per level:');
  for (const [level, count] of Object.entries(wordsPerLevel)) {
    console.log(`   ${level}: ${count} words`);
  }
  console.log();

  // Generate words level by level in batches
  for (const [level, count] of Object.entries(wordsPerLevel)) {
    if (count === 0) continue;

    console.log(`\n📚 Generating ${count} words for level ${level}...`);

    const batchSize = 100;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const wordsInBatch = Math.min(batchSize, count - (batch * batchSize));

      console.log(`   Batch ${batch + 1}/${batches} (${wordsInBatch} words)...`);

      try {
        const prompt = `Generate exactly ${wordsInBatch} common Hindi words appropriate for CEFR level ${level}.

Requirements:
- Return ONLY a JSON array of words in Devanagari script
- Each word should be a single common Hindi word
- Words should be appropriate for ${level} proficiency level
- Include a mix of nouns, verbs, adjectives, and adverbs
- DO NOT include English translations
- DO NOT include explanations
- Format: ["शब्द1", "शब्द2", "शब्द3", ...]

Example output format:
["नमस्ते", "धन्यवाद", "कृपया", "हाँ", "नहीं"]

Generate ${wordsInBatch} Hindi words for level ${level}:`;

        const response = await callClaudeAPI(prompt);

        if (response) {
          // Parse the JSON array from response
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const words = JSON.parse(jsonMatch[0]);

            // Insert words into database
            for (const word of words) {
              try {
                await pool.query(`
                  INSERT INTO source_words_hindi (word, level, theme)
                  VALUES ($1, $2, NULL)
                  ON CONFLICT DO NOTHING
                `, [word.trim(), level]);
              } catch (insertError) {
                // Skip duplicates silently
              }
            }

            console.log(`   ✅ Added ${words.length} words for ${level}`);
          } else {
            console.log(`   ⚠️  Could not parse API response, using fallback...`);
            await generateFallbackWords(level, wordsInBatch);
          }
        } else {
          console.log(`   ⚠️  API not available, using fallback...`);
          await generateFallbackWords(level, wordsInBatch);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}, using fallback...`);
        await generateFallbackWords(level, wordsInBatch);
      }
    }
  }

  const finalCount = await pool.query('SELECT COUNT(*) FROM source_words_hindi');
  console.log(`\n✅ Total words in database: ${finalCount.rows[0].count}\n`);
}

// Fallback: Generate basic Hindi words without API
async function generateFallbackWords(level, count) {
  const basicWords = {
    'A1': ['नमस्ते', 'धन्यवाद', 'कृपया', 'हाँ', 'नहीं', 'अच्छा', 'बुरा', 'बड़ा', 'छोटा', 'पानी', 'खाना', 'घर', 'माता', 'पिता', 'भाई', 'बहन', 'दोस्त', 'स्कूल', 'किताब', 'पेन'],
    'A2': ['सुबह', 'शाम', 'रात', 'दिन', 'सप्ताह', 'महीना', 'साल', 'लाल', 'नीला', 'हरा', 'काला', 'सफेद', 'शहर', 'गाँव', 'बाजार', 'दुकान', 'पैसा', 'काम', 'समय', 'जगह'],
    'B1': ['सरकार', 'समाज', 'परिवार', 'संस्कृति', 'परंपरा', 'इतिहास', 'भविष्य', 'विचार', 'सवाल', 'जवाब', 'समस्या', 'समाधान', 'विकास', 'प्रगति', 'शिक्षा', 'स्वास्थ्य', 'अर्थव्यवस्था', 'राजनीति', 'पर्यावरण', 'तकनीक'],
    'B2': ['अनुभव', 'योगदान', 'उपलब्धि', 'चुनौती', 'अवसर', 'संभावना', 'जिम्मेदारी', 'प्रतिबद्धता', 'सहयोग', 'प्रतिस्पर्धा', 'नवाचार', 'अनुसंधान', 'विश्लेषण', 'मूल्यांकन', 'कार्यान्वयन', 'प्रबंधन', 'संगठन', 'नेतृत्व', 'दक्षता', 'क्षमता'],
    'C1': ['परिप्रेक्ष्य', 'दृष्टिकोण', 'अवधारणा', 'सिद्धांत', 'विचारधारा', 'दर्शन', 'तर्क', 'प्रमाण', 'साक्ष्य', 'निष्कर्ष', 'परिकल्पना', 'प्रस्ताव', 'तर्कसंगतता', 'व्यावहारिकता', 'प्रासंगिकता', 'महत्व', 'प्रभाव', 'परिणाम', 'निहितार्थ', 'आयाम'],
    'C2': ['सूक्ष्मता', 'जटिलता', 'बारीकी', 'विरोधाभास', 'द्वंद्व', 'संश्लेषण', 'एकीकरण', 'विभेदन', 'अमूर्तता', 'समग्रता', 'बहुआयामी', 'अंतर्निहित', 'व्यापक', 'सूझबूझ', 'विवेक', 'कूटनीति', 'रणनीति', 'कार्यनीति', 'प्रतिमान', 'संरचना']
  };

  const words = basicWords[level] || basicWords['A1'];
  const wordsToInsert = words.slice(0, count);

  for (const word of wordsToInsert) {
    try {
      await pool.query(`
        INSERT INTO source_words_hindi (word, level, theme)
        VALUES ($1, $2, NULL)
        ON CONFLICT DO NOTHING
      `, [word, level]);
    } catch (error) {
      // Skip duplicates
    }
  }
}

// Step 3: Assign themes to words
async function assignThemes() {
  console.log('\n' + '═'.repeat(80));
  console.log('STEP 3: ASSIGNING THEMES TO WORDS');
  console.log('═'.repeat(80) + '\n');

  // First, use rule-based assignment
  console.log('📝 Using keyword matching for theme assignment...\n');

  let totalThemed = 0;

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let themed = 0;

    for (const keyword of keywords) {
      const result = await pool.query(`
        UPDATE source_words_hindi
        SET theme = $1
        WHERE theme IS NULL AND word = $2
      `, [theme, keyword]);

      themed += result.rowCount;
    }

    if (themed > 0) {
      console.log(`   ✅ ${theme}: ${themed} words`);
      totalThemed += themed;
    }
  }

  console.log(`\n   Total themed by keywords: ${totalThemed}`);

  // Set remaining words to 'general'
  const remainingResult = await pool.query(`
    UPDATE source_words_hindi
    SET theme = 'general'
    WHERE theme IS NULL
  `);

  console.log(`   📦 Set ${remainingResult.rowCount} words to 'general'\n`);
}

// Step 4: Create word sets
async function createWordSets() {
  console.log('\n' + '═'.repeat(80));
  console.log('STEP 4: CREATING THEMATIC WORD SETS');
  console.log('═'.repeat(80) + '\n');

  // Delete old word sets for Hindi
  await pool.query(`DELETE FROM word_sets WHERE source_language = 'hindi'`);
  console.log('🗑️  Deleted old word sets\n');

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficiency'
  };

  let totalCreated = 0;

  for (const level of LEVELS) {
    console.log(`📚 Creating sets for level ${level}:`);

    const themesQuery = await pool.query(`
      SELECT theme, COUNT(*) as count
      FROM source_words_hindi
      WHERE level = $1 AND theme IS NOT NULL
      GROUP BY theme
      ORDER BY count DESC
    `, [level]);

    for (const row of themesQuery.rows) {
      const theme = row.theme;
      const count = parseInt(row.count);

      if (count < 10 && theme !== 'general') continue;

      if (theme === 'general') {
        // Split general into chunks of 50
        const chunks = Math.ceil(count / 50);
        for (let i = 0; i < chunks; i++) {
          const actualCount = Math.min(50, count - (i * 50));
          const title = `Hindi ${level}: Essential Vocabulary ${i + 1}`;
          const description = `${LEVEL_DESCRIPTIONS[level]} level essential vocabulary - Part ${i + 1}`;

          await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('hindi', $1, $2, $3, 'general', $4, true)
          `, [title, description, level, actualCount]);

          totalCreated++;
        }
      } else {
        const title = `Hindi ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
        const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

        await pool.query(`
          INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
          VALUES ('hindi', $1, $2, $3, $4, $5, true)
        `, [title, description, level, theme, count]);

        totalCreated++;
      }
    }
  }

  console.log(`\n✅ Created ${totalCreated} word sets!\n`);
}

// Step 5: Display final statistics
async function displayStatistics() {
  console.log('\n' + '═'.repeat(80));
  console.log('FINAL STATISTICS');
  console.log('═'.repeat(80) + '\n');

  const totalWords = await pool.query('SELECT COUNT(*) FROM source_words_hindi');
  console.log(`📊 Total words: ${totalWords.rows[0].count}\n`);

  console.log('📈 Words by level:');
  const byLevel = await pool.query(`
    SELECT level, COUNT(*) as count
    FROM source_words_hindi
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
  for (const row of byLevel.rows) {
    console.log(`   ${row.level}: ${row.count} words`);
  }

  console.log('\n🎨 Words by theme:');
  const byTheme = await pool.query(`
    SELECT theme, COUNT(*) as count
    FROM source_words_hindi
    WHERE theme IS NOT NULL
    GROUP BY theme
    ORDER BY count DESC
  `);
  for (const row of byTheme.rows) {
    console.log(`   ${row.theme}: ${row.count} words`);
  }

  console.log('\n📚 Word sets created:');
  const wordSets = await pool.query(`
    SELECT COUNT(*) as count
    FROM word_sets
    WHERE source_language = 'hindi'
  `);
  console.log(`   Total: ${wordSets.rows[0].count} sets\n`);

  console.log('═'.repeat(80));
  console.log('✅ HINDI VOCABULARY REBUILD COMPLETE!');
  console.log('═'.repeat(80) + '\n');
}

// Main execution
async function main() {
  try {
    const existingCount = await deleteSyntheticData();
    await generateVocabulary(existingCount);
    await assignThemes();
    await createWordSets();
    await displayStatistics();
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

main();
