/**
 * Create word sets from existing themes in source_words tables
 * Usage: node create-sets-from-existing-themes.js <language>
 * Example: node create-sets-from-existing-themes.js russian
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function createSetsFromThemes(language) {
  try {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📚 Creating thematic word sets for ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    const tableName = `source_words_${language}`;

    // Step 1: Check existing themes
    console.log('📊 Step 1: Analyzing existing themes...\n');

    const themesResult = await pool.query(`
      SELECT theme, COUNT(*) as word_count
      FROM ${tableName}
      WHERE theme IS NOT NULL
      GROUP BY theme
      ORDER BY word_count DESC
    `);

    console.log('   Themes found:');
    themesResult.rows.forEach(row => {
      console.log(`   - ${row.theme}: ${row.word_count} words`);
    });

    // Step 2: Delete old word sets for this language
    console.log(`\n🗑️  Step 2: Removing old word sets for ${language}...\n`);

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1 AND theme IS NOT NULL
    `, [language]);

    console.log(`   Deleted: ${deleteResult.rowCount} old thematic sets\n`);

    // Step 3: Create new word sets
    console.log('📚 Step 3: Creating new thematic word sets...\n');

    let totalSetsCreated = 0;
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    for (const level of levels) {
      console.log(`   📈 Level ${level}:`);

      // Get all themes for this level with at least 10 words
      const levelThemesResult = await pool.query(`
        SELECT theme, COUNT(*) as word_count
        FROM ${tableName}
        WHERE level = $1 AND theme IS NOT NULL AND theme != 'general'
        GROUP BY theme
        HAVING COUNT(*) >= 10
        ORDER BY theme
      `, [level]);

      for (const themeRow of levelThemesResult.rows) {
        const theme = themeRow.theme;
        const wordCount = parseInt(themeRow.word_count);

        // Create themed set
        const title = `${language.charAt(0).toUpperCase() + language.slice(1)} ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
        const description = `${level} level vocabulary: ${theme}`;

        await pool.query(`
          INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `, [language, title, description, level, theme, wordCount]);

        console.log(`      ✅ ${theme}: ${wordCount} words`);
        totalSetsCreated++;
      }
    }

    console.log(`\n✅ Created ${totalSetsCreated} thematic word sets for ${language}!\n`);
    console.log('═'.repeat(80));
    console.log('🎉 Done!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Main
const language = process.argv[2];

if (!language) {
  console.error('Usage: node create-sets-from-existing-themes.js <language>');
  console.error('Example: node create-sets-from-existing-themes.js russian');
  process.exit(1);
}

createSetsFromThemes(language);
