/**
 * Recreate all word sets for all languages WITH PROPER CHUNKING
 * Uses word_set_items to store actual word IDs for each set
 * This allows splitting large 'general' themes into smaller parts with unique words
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

const LANGUAGES = [
  'german', 'english', 'spanish', 'french', 'russian', 'italian',
  'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian',
  'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50; // Words per chunk for 'general' theme
const MIN_THEME_SIZE = 10; // Minimum words to create a themed collection

const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficiency'
};

async function processLanguage(language) {
  const tableName = `source_words_${language}`;
  const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🌍 Processing ${langDisplay.toUpperCase()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      )
    `, [tableName]);

    if (!tableCheck.rows[0].exists) {
      console.log(`⏭️  Table ${tableName} does not exist. Skipping...\n`);
      return { language, created: 0, skipped: true };
    }

    // Check if level column exists
    const levelCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'level'
      )
    `, [tableName]);

    if (!levelCheck.rows[0].exists) {
      console.log(`⏭️  No 'level' column in ${tableName}. Skipping...\n`);
      return { language, created: 0, skipped: true };
    }

    // Delete old word sets for this language
    console.log('🗑️  Removing old word sets...');

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1
    `, [language]);

    console.log(`   Deleted: ${deleteResult.rowCount} old sets\n`);

    // Create new thematic sets
    console.log('📚 Creating new word sets...\n');

    let totalCreated = 0;

    for (const level of LEVELS) {
      // Get all themes for this level
      const themesQuery = await pool.query(`
        SELECT theme, COUNT(*) as count
        FROM ${tableName}
        WHERE level = $1 AND theme IS NOT NULL
        GROUP BY theme
        ORDER BY count DESC
      `, [level]);

      if (themesQuery.rows.length === 0) {
        continue;
      }

      for (const themeRow of themesQuery.rows) {
        const theme = themeRow.theme;
        const count = parseInt(themeRow.count);

        // Skip small themes (except 'general')
        if (count < MIN_THEME_SIZE && theme !== 'general') {
          continue;
        }

        // For 'general' theme - split into chunks with unique words in each
        if (theme === 'general') {
          const chunks = Math.ceil(count / CHUNK_SIZE);

          console.log(`   📦 ${level} General: Splitting ${count} words into ${chunks} parts`);

          // Get all word IDs for this level+theme
          const wordsQuery = await pool.query(`
            SELECT id
            FROM ${tableName}
            WHERE level = $1 AND theme = $2
            ORDER BY word
          `, [level, theme]);

          const allWordIds = wordsQuery.rows.map(row => row.id);

          // Create chunks
          for (let i = 0; i < chunks; i++) {
            const offset = i * CHUNK_SIZE;
            const chunkWordIds = allWordIds.slice(offset, offset + CHUNK_SIZE);
            const actualCount = chunkWordIds.length;

            if (actualCount === 0) break;

            const partNum = i + 1;
            const title = `${langDisplay} ${level}: General ${partNum}`;
            const description = `${LEVEL_DESCRIPTIONS[level]} level general vocabulary - Part ${partNum} of ${chunks}`;

            // Create word set
            const setResult = await pool.query(`
              INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
              VALUES ($1, $2, $3, $4, $5, $6, true)
              RETURNING id
            `, [language, title, description, level, theme, actualCount]);

            const setId = setResult.rows[0].id;

            // Populate word_set_items with specific word IDs
            const itemsValues = chunkWordIds.map((wordId, index) =>
              `(${setId}, ${wordId}, ${index})`
            ).join(',');

            await pool.query(`
              INSERT INTO word_set_items (word_set_id, word_id, order_index)
              VALUES ${itemsValues}
            `);

            console.log(`      ✅ Part ${partNum}: ${actualCount} words (Set ID: ${setId})`);
            totalCreated++;
          }

        } else {
          // For specific themes - create one set with all words
          const title = `${langDisplay} ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
          const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

          // Create word set
          const setResult = await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING id
          `, [language, title, description, level, theme, count]);

          const setId = setResult.rows[0].id;

          // Get all word IDs for this theme
          const wordsQuery = await pool.query(`
            SELECT id
            FROM ${tableName}
            WHERE level = $1 AND theme = $2
            ORDER BY word
          `, [level, theme]);

          const wordIds = wordsQuery.rows.map(row => row.id);

          // Populate word_set_items
          if (wordIds.length > 0) {
            const itemsValues = wordIds.map((wordId, index) =>
              `(${setId}, ${wordId}, ${index})`
            ).join(',');

            await pool.query(`
              INSERT INTO word_set_items (word_set_id, word_id, order_index)
              VALUES ${itemsValues}
            `);
          }

          console.log(`   ✅ ${theme}: ${count} words (Set ID: ${setId})`);
          totalCreated++;
        }
      }
    }

    console.log(`\n✅ Created ${totalCreated} word sets for ${langDisplay}\n`);
    return { language, created: totalCreated, skipped: false };

  } catch (error) {
    console.error(`❌ Error processing ${langDisplay}:`, error.message);
    console.error(error.stack);
    return { language, created: 0, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 RECREATING ALL WORD SETS WITH PROPER CHUNKING');
  console.log('═'.repeat(80) + '\n');

  const results = [];

  for (const language of LANGUAGES) {
    const result = await processLanguage(language);
    results.push(result);
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80) + '\n');

  let totalCreated = 0;
  let processedLanguages = 0;
  let skippedLanguages = 0;

  results.forEach(result => {
    if (result.skipped) {
      console.log(`⏭️  ${result.language.padEnd(15)} - Skipped (no data)`);
      skippedLanguages++;
    } else if (result.error) {
      console.log(`❌ ${result.language.padEnd(15)} - Error: ${result.error}`);
    } else {
      console.log(`✅ ${result.language.padEnd(15)} - Created ${result.created} sets`);
      totalCreated += result.created;
      processedLanguages++;
    }
  });

  console.log('\n' + '-'.repeat(80));
  console.log(`Total languages processed: ${processedLanguages}`);
  console.log(`Total languages skipped: ${skippedLanguages}`);
  console.log(`Total word sets created: ${totalCreated}`);
  console.log('═'.repeat(80) + '\n');

  // Verify no duplicates remain
  console.log('🔍 Verifying no duplicate level+theme combinations...\n');

  const duplicateCheck = await pool.query(`
    SELECT
      source_language,
      level,
      theme,
      COUNT(*) as count
    FROM word_sets
    WHERE level IS NOT NULL
    GROUP BY source_language, level, theme
    HAVING COUNT(*) > 1
  `);

  if (duplicateCheck.rows.length === 0) {
    console.log('✅ No duplicate level+theme found! But chunks are OK (different titles).\n');
  } else {
    console.log(`⚠️  Found ${duplicateCheck.rows.length} level+theme combinations with multiple sets:`);
    console.log('   (This is OK for "general" theme split into parts)\n');
    duplicateCheck.rows.forEach(row => {
      console.log(`   ${row.source_language} | ${row.level} | ${row.theme} → ${row.count} sets`);
    });
    console.log('');
  }

  // Check word_set_items population
  const itemsCheck = await pool.query(`
    SELECT COUNT(*) as total_items
    FROM word_set_items
  `);

  console.log(`📊 Total word_set_items created: ${itemsCheck.rows[0].total_items}\n`);

  console.log('═'.repeat(80));
  console.log('🎉 Done!');
  console.log('═'.repeat(80) + '\n');
}

main()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    pool.end();
    process.exit(1);
  });
