/**
 * Create thematic word sets for Japanese language
 * Based on themes assigned to words
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50; // Max words per general set
const MIN_THEME_SIZE = 10; // Minimum words to create a theme set

const LEVEL_DESCRIPTIONS = {
  'A1': 'Beginner',
  'A2': 'Elementary',
  'B1': 'Intermediate',
  'B2': 'Upper Intermediate',
  'C1': 'Advanced',
  'C2': 'Proficiency'
};

async function createWordSets() {
  console.log('\n' + '='.repeat(80));
  console.log('CREATE JAPANESE WORD SETS');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Delete old Japanese word sets
    console.log('Step 1: Removing old Japanese word sets...\n');

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = 'japanese'
    `);

    console.log(`Deleted: ${deleteResult.rowCount} old sets\n`);

    // Step 2: Create new thematic sets
    console.log('Step 2: Creating new thematic word sets...\n');

    let totalCreated = 0;

    for (const level of LEVELS) {
      console.log(`Level ${level}:`);

      // Get theme statistics for this level
      const themesQuery = await pool.query(`
        SELECT theme, COUNT(*) as count
        FROM source_words_japanese
        WHERE level = $1 AND theme IS NOT NULL
        GROUP BY theme
        ORDER BY count DESC
      `, [level]);

      for (const themeRow of themesQuery.rows) {
        const theme = themeRow.theme;
        const count = parseInt(themeRow.count);

        // Skip themes with too few words (except general)
        if (count < MIN_THEME_SIZE && theme !== 'general') {
          console.log(`  Skipping ${theme} (only ${count} words)`);
          continue;
        }

        if (theme === 'general') {
          // Split general vocabulary into chunks
          const chunks = Math.ceil(count / CHUNK_SIZE);
          for (let i = 0; i < chunks; i++) {
            const actualCount = Math.min(CHUNK_SIZE, count - (i * CHUNK_SIZE));
            const title = `Japanese ${level}: Essential Vocabulary ${i + 1}`;
            const description = `${LEVEL_DESCRIPTIONS[level]} level essential vocabulary - Part ${i + 1}`;

            await pool.query(`
              INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
              VALUES ($1, $2, $3, $4, 'general', $5, true)
            `, ['japanese', title, description, level, actualCount]);

            totalCreated++;
          }
          console.log(`  Created ${chunks} general sets (${count} words)`);
        } else {
          // Create theme-specific set
          const title = `Japanese ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
          const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

          await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, true)
          `, ['japanese', title, description, level, theme, count]);

          totalCreated++;
          console.log(`  Created ${theme} set (${count} words)`);
        }
      }

      console.log('');
    }

    // Step 3: Show final statistics
    console.log('\n' + '='.repeat(80));
    console.log('WORD SETS CREATED!');
    console.log('='.repeat(80) + '\n');

    const finalSets = await pool.query(`
      SELECT COUNT(*) as count
      FROM word_sets
      WHERE source_language = 'japanese'
    `);

    console.log(`Total Japanese word sets: ${parseInt(finalSets.rows[0].count).toLocaleString()}`);

    // Show sets by level
    const setsByLevel = await pool.query(`
      SELECT level, COUNT(*) as count, SUM(word_count) as total_words
      FROM word_sets
      WHERE source_language = 'japanese'
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

    console.log('\nSets by level:');
    setsByLevel.rows.forEach(row => {
      console.log(`  ${row.level}: ${parseInt(row.count)} sets (${parseInt(row.total_words).toLocaleString()} words)`);
    });

    // Show theme distribution
    const setsByTheme = await pool.query(`
      SELECT theme, COUNT(*) as count, SUM(word_count) as total_words
      FROM word_sets
      WHERE source_language = 'japanese'
      GROUP BY theme
      ORDER BY count DESC
    `);

    console.log('\nSets by theme:');
    setsByTheme.rows.forEach(row => {
      console.log(`  ${row.theme.padEnd(15)}: ${parseInt(row.count).toString().padStart(3)} sets (${parseInt(row.total_words).toLocaleString().padStart(5)} words)`);
    });

    // Show sample sets
    console.log('\nSample word sets:');
    const sampleSets = await pool.query(`
      SELECT title, level, theme, word_count
      FROM word_sets
      WHERE source_language = 'japanese'
      ORDER BY RANDOM()
      LIMIT 10
    `);

    sampleSets.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.title} (${row.word_count} words)`);
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

createWordSets();
