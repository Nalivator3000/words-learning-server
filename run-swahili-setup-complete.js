#!/usr/bin/env node
/**
 * COMPLETE SWAHILI SETUP
 * This script runs the entire Swahili vocabulary setup:
 * 1. Deletes synthetic data
 * 2. Inserts base vocabulary (~300 words)
 * 3. Inserts extended vocabulary (~700 words)
 * 4. Creates word sets
 * 5. Prints final statistics
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║           COMPLETE SWAHILI VOCABULARY SETUP                    ║');
console.log('║                  (~1000 REAL WORDS)                            ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');

async function checkDatabase() {
  console.log('\n🔍 Checking database connection...');
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function deleteSyntheticData() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 1: DELETING SYNTHETIC/TEST DATA');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const beforeCount = await pool.query('SELECT COUNT(*) as total FROM source_words_swahili');
  console.log(`Current total words: ${beforeCount.rows[0].total}`);

  const syntheticCount = await pool.query(`SELECT COUNT(*) as synthetic FROM source_words_swahili WHERE word LIKE '%\_%'`);
  console.log(`Synthetic words (containing underscore): ${syntheticCount.rows[0].synthetic}`);

  const deleteResult = await pool.query(`DELETE FROM source_words_swahili WHERE word LIKE '%\_%'`);
  console.log(`\n✅ Deleted ${deleteResult.rowCount} synthetic words`);

  const afterCount = await pool.query('SELECT COUNT(*) as remaining FROM source_words_swahili');
  console.log(`Remaining real words: ${afterCount.rows[0].remaining}`);
}

async function runManualVocabulary() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 2: RUNNING BASE VOCABULARY SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { spawn } = require('child_process');

  return new Promise((resolve, reject) => {
    const child = spawn('node', ['create-swahili-vocabulary-manual.js'], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runExtendedVocabulary() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 3: RUNNING EXTENDED VOCABULARY SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { spawn } = require('child_process');

  return new Promise((resolve, reject) => {
    const child = spawn('node', ['extend-swahili-vocabulary.js'], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function printFinalStatistics() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL STATISTICS                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const totalResult = await pool.query('SELECT COUNT(*) as total FROM source_words_swahili');
  console.log(`📊 Total words in database: ${totalResult.rows[0].total}`);

  console.log('\n📈 Distribution by level:');
  const levelResult = await pool.query(
    `SELECT level, COUNT(*) as count FROM source_words_swahili GROUP BY level ORDER BY level`
  );
  let levelTable = '';
  for (const row of levelResult.rows) {
    levelTable += `  ${row.level}: ${String(row.count).padStart(4)} words\n`;
  }
  console.log(levelTable);

  console.log('🏷️  Distribution by theme (top 15):');
  const themeResult = await pool.query(
    `SELECT theme, COUNT(*) as count FROM source_words_swahili GROUP BY theme ORDER BY count DESC LIMIT 15`
  );
  let themeTable = '';
  for (const row of themeResult.rows) {
    themeTable += `  ${row.theme.padEnd(15)}: ${String(row.count).padStart(4)} words\n`;
  }
  console.log(themeTable);

  const setsResult = await pool.query(`SELECT COUNT(*) as total FROM word_sets WHERE source_language = 'swahili'`);
  console.log(`📚 Total word sets created: ${setsResult.rows[0].total}`);

  console.log('\n📝 Random sample words:');
  const sampleResult = await pool.query(
    `SELECT word, translation, level, theme FROM source_words_swahili ORDER BY RANDOM() LIMIT 15`
  );
  for (const row of sampleResult.rows) {
    console.log(`  ${row.word.padEnd(20)} → ${row.translation.padEnd(30)} [${row.level}] (${row.theme})`);
  }
}

async function main() {
  try {
    // Check database connection
    const connected = await checkDatabase();
    if (!connected) {
      process.exit(1);
    }

    console.log('\n⏳ Starting complete Swahili vocabulary setup...');
    console.log('This will take a few minutes.\n');

    // Step 1: Delete synthetic data (done here to avoid duplication)
    await deleteSyntheticData();

    // Steps 2-4 are handled by the manual script
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STEP 2-4: INSERTING VOCABULARY AND CREATING WORD SETS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Run manual vocabulary script (which includes word set creation)
    await runManualVocabulary();

    // Run extended vocabulary
    await runExtendedVocabulary();

    // Recreate word sets with all vocabulary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STEP 5: RECREATING WORD SETS WITH COMPLETE VOCABULARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const { spawn } = require('child_process');
    await new Promise((resolve, reject) => {
      const child = spawn('node', ['create-thematic-sets-universal.js', 'swahili'], {
        stdio: 'inherit'
      });
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)));
      child.on('error', reject);
    });

    // Print final statistics
    await printFinalStatistics();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    🎉 SETUP COMPLETE! 🎉                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('✅ All steps completed successfully!');
    console.log('✅ Swahili vocabulary is now ready to use.');
    console.log('\nNext steps:');
    console.log('  1. Test the vocabulary in your application');
    console.log('  2. Verify word quality by sampling random words');
    console.log('  3. Check word sets in the database');
    console.log('  4. Monitor user feedback\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
