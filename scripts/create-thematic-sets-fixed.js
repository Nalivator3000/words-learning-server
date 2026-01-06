/**
 * FIXED VERSION: Universal script to create thematic word sets for any language
 * FIX: Removes chunking of 'general' theme to prevent duplicate level+theme combinations
 *
 * Usage: node create-thematic-sets-fixed.js <language>
 * Example: node create-thematic-sets-fixed.js arabic
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
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
    // Step 1: Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      )
    `, [tableName]);

    if (!tableCheck.rows[0].exists) {
      console.log(`⚠️  Table ${tableName} does not exist. Skipping...`);
      return;
    }

    // Step 2: Check if level and theme columns exist
    const levelCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'level'
      )
    `, [tableName]);

    const themeCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'theme'
      )
    `, [tableName]);

    if (!levelCheck.rows[0].exists) {
      console.log(`⚠️  No 'level' column in ${tableName}. Skipping...`);
      return;
    }

    if (!themeCheck.rows[0].exists) {
      console.log(`⚠️  No 'theme' column in ${tableName}. Skipping...`);
      return;
    }

    // Step 3: Delete old word sets for this language
    console.log('🗑️  Removing old word sets...\n');

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1
    `, [language]);

    console.log(`   Deleted: ${deleteResult.rowCount} old sets\n`);

    // Step 4: Create new thematic sets
    console.log('📚 Creating new thematic word sets...\n');

    let totalCreated = 0;

    for (const level of LEVELS) {
      console.log(`   📈 Level ${level}:`);

      // Get all themes for this level
      const themesQuery = await pool.query(`
        SELECT theme, COUNT(*) as count
        FROM ${tableName}
        WHERE level = $1 AND theme IS NOT NULL
        GROUP BY theme
        ORDER BY count DESC
      `, [level]);

      if (themesQuery.rows.length === 0) {
        console.log(`      ⏭️  No words found for this level`);
        continue;
      }

      for (const themeRow of themesQuery.rows) {
        const theme = themeRow.theme;
        const count = parseInt(themeRow.count);

        // Skip small themes (except 'general')
        if (count < MIN_THEME_SIZE && theme !== 'general') {
          console.log(`      ⏭️  Skipping '${theme}' (only ${count} words)`);
          continue;
        }

        // Create ONE set per level+theme combination
        const title = theme === 'general'
          ? `${langDisplay} ${level}: General Vocabulary`
          : `${langDisplay} ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;

        const description = theme === 'general'
          ? `${LEVEL_DESCRIPTIONS[level]} level general vocabulary`
          : `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

        await pool.query(`
          INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `, [language, title, description, level, theme, count]);

        console.log(`      ✅ ${theme}: ${count} words`);
        totalCreated++;
      }
    }

    console.log(`\n   ✨ Created ${totalCreated} word sets for ${langDisplay}!\n`);

  } catch (error) {
    console.error(`❌ Error processing ${langDisplay}:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const language = process.argv[2];

  if (!language) {
    console.error('❌ Please specify a language!');
    console.error('Usage: node create-thematic-sets-fixed.js <language>');
    console.error('Example: node create-thematic-sets-fixed.js arabic');
    console.error('\nSupported languages:');
    console.error('  german, english, spanish, french, russian, italian, polish,');
    console.error('  portuguese, romanian, serbian, turkish, ukrainian, arabic,');
    console.error('  swahili, chinese, hindi, japanese, korean');
    await pool.end();
    process.exit(1);
  }

  try {
    await processLanguage(language);
    console.log('═'.repeat(80));
    console.log('🎉 Done!');
    console.log('═'.repeat(80) + '\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();
