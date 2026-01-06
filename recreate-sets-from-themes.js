/**
 * Recreate word sets based on existing themes in the database
 * Usage: node recreate-sets-from-themes.js <language>
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language');
  process.exit(1);
}

async function recreateSets() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log(`📚 Recreating word sets for ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    // Step 1: Delete old word sets
    console.log('🗑️  Step 1: Removing old word sets...\n');

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1
    `, [language]);

    console.log(`   Deleted: ${deleteResult.rowCount} old sets\n`);

    // Step 2: Create new word sets
    console.log('📝 Step 2: Creating new word sets...\n');

    let totalSetsCreated = 0;

    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      console.log(`   📈 Level ${level}:`);

      // Get all themes for this level
      const themesResult = await pool.query(`
        SELECT theme, COUNT(*) as word_count
        FROM source_words_${language}
        WHERE level = $1 AND theme IS NOT NULL
        GROUP BY theme
        HAVING COUNT(*) >= 10
        ORDER BY theme
      `, [level]);

      for (const themeRow of themesResult.rows) {
        const theme = themeRow.theme;
        const wordCount = parseInt(themeRow.word_count);

        if (theme === 'general') {
          // Split general into 50-word chunks
          const chunks = Math.ceil(wordCount / 50);

          for (let i = 0; i < chunks; i++) {
            const title = `${language.charAt(0).toUpperCase() + language.slice(1)} ${level}: General ${i + 1}`;
            const description = `${level} level vocabulary - General collection ${i + 1}`;
            const setWordCount = Math.min(50, wordCount - (i * 50));

            await pool.query(`
              INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
              VALUES ($1, $2, $3, $4, 'general', $5, true)
            `, [language, title, description, level, setWordCount]);

            totalSetsCreated++;
          }
          console.log(`      general: ${chunks} sets (${wordCount} words)`);
        } else {
          // Create themed set
          const title = `${language.charAt(0).toUpperCase() + language.slice(1)} ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
          const description = `${level} level vocabulary: ${theme}`;

          await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, true)
          `, [language, title, description, level, theme, wordCount]);

          totalSetsCreated++;
          console.log(`      ${theme}: 1 set (${wordCount} words)`);
        }
      }
    }

    console.log(`\n✅ Created ${totalSetsCreated} word sets for ${language}!\n`);
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

recreateSets();
