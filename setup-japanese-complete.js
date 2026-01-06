/**
 * Complete Japanese Vocabulary Setup
 * Master script that runs all steps sequentially:
 * 1. Cleanup synthetic data
 * 2. Generate ~10,000 real Japanese words
 * 3. Assign themes to words
 * 4. Create thematic word sets
 */

const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function runScript(scriptName, description) {
  console.log('\n' + '='.repeat(80));
  console.log(`RUNNING: ${description}`);
  console.log('='.repeat(80) + '\n');

  try {
    const { stdout, stderr } = await execAsync(`node ${scriptName}`, {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    console.log(stdout);
    if (stderr) {
      console.error('Warnings:', stderr);
    }
    return true;
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function checkProgress() {
  const stats = await pool.query(`
    SELECT
      COUNT(*) as total_words,
      COUNT(CASE WHEN theme IS NOT NULL THEN 1 END) as themed_words,
      COUNT(CASE WHEN theme IS NULL THEN 1 END) as unthemed_words
    FROM source_words_japanese
  `);

  const sets = await pool.query(`
    SELECT COUNT(*) as count FROM word_sets WHERE source_language = 'japanese'
  `);

  return {
    totalWords: parseInt(stats.rows[0].total_words),
    themedWords: parseInt(stats.rows[0].themed_words),
    unthemedWords: parseInt(stats.rows[0].unthemed_words),
    wordSets: parseInt(sets.rows[0].count)
  };
}

async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  JAPANESE VOCABULARY COMPLETE SETUP'.padEnd(78) + '█');
  console.log('█' + '  Target: 10,000 real Japanese words with themes and sets'.padEnd(78) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80) + '\n');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set!');
    console.error('Please set it with: $env:ANTHROPIC_API_KEY="your-key-here"\n');
    process.exit(1);
  }

  try {
    const startTime = Date.now();

    // Step 1: Cleanup
    console.log('STEP 1/4: Cleanup Synthetic Data');
    const cleanupSuccess = await runScript(
      'cleanup-japanese-synthetic.js',
      'Removing synthetic test data from database'
    );

    if (!cleanupSuccess) {
      console.error('\nCleanup failed. Please check the error and try again.\n');
      process.exit(1);
    }

    const afterCleanup = await checkProgress();
    console.log(`After cleanup: ${afterCleanup.totalWords.toLocaleString()} words remaining\n`);

    // Step 2: Generate vocabulary
    console.log('STEP 2/4: Generate Real Japanese Vocabulary');
    console.log('This may take 30-60 minutes depending on API rate limits...\n');

    const generateSuccess = await runScript(
      'generate-japanese-vocabulary.js',
      'Generating ~10,000 real Japanese words with Claude AI'
    );

    if (!generateSuccess) {
      console.error('\nVocabulary generation failed. Please check the error and try again.\n');
      process.exit(1);
    }

    const afterGenerate = await checkProgress();
    console.log(`After generation: ${afterGenerate.totalWords.toLocaleString()} words in database\n`);

    // Step 3: Assign themes
    console.log('STEP 3/4: Assign Themes to Words');
    console.log('This may take 20-30 minutes...\n');

    const themesSuccess = await runScript(
      'assign-japanese-themes-llm.js',
      'Assigning themes to Japanese words using Claude AI'
    );

    if (!themesSuccess) {
      console.error('\nTheme assignment failed. Please check the error and try again.\n');
      process.exit(1);
    }

    const afterThemes = await checkProgress();
    console.log(`After themes: ${afterThemes.themedWords.toLocaleString()} words with themes\n`);

    // Step 4: Create word sets
    console.log('STEP 4/4: Create Thematic Word Sets');

    const setsSuccess = await runScript(
      'create-japanese-word-sets.js',
      'Creating thematic word sets for Japanese language'
    );

    if (!setsSuccess) {
      console.error('\nWord set creation failed. Please check the error and try again.\n');
      process.exit(1);
    }

    const final = await checkProgress();

    // Final summary
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█' + '  SETUP COMPLETE!'.padEnd(78) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');

    console.log('Final Statistics:');
    console.log(`  Total words:       ${final.totalWords.toLocaleString()}`);
    console.log(`  Themed words:      ${final.themedWords.toLocaleString()}`);
    console.log(`  Word sets created: ${final.wordSets.toLocaleString()}`);
    console.log(`  Duration:          ${duration} minutes\n`);

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

    console.log('Words by level:');
    byLevel.rows.forEach(row => {
      console.log(`  ${row.level}: ${parseInt(row.count).toLocaleString()} words`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('Japanese vocabulary is ready to use!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
