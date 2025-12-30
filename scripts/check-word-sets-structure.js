const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkWordSetsStructure() {
  try {
    console.log('=== WORD SETS STRUCTURE ANALYSIS ===\n');

    // Check word sets by language pair
    const setsByLanguage = await pool.query(`
      SELECT
        language_pair,
        COUNT(*) as sets_count,
        COUNT(DISTINCT level) as level_count,
        COUNT(DISTINCT theme) as theme_count
      FROM word_sets
      GROUP BY language_pair
      ORDER BY language_pair;
    `);

    console.log('Word Sets by Language Pair:');
    console.table(setsByLanguage.rows);

    // Check levels distribution
    console.log('\n=== LEVELS DISTRIBUTION ===\n');
    const levelsDist = await pool.query(`
      SELECT
        language_pair,
        level,
        COUNT(*) as sets_count
      FROM word_sets
      WHERE level IS NOT NULL
      GROUP BY language_pair, level
      ORDER BY language_pair, level;
    `);

    console.log('Levels by Language Pair:');
    console.table(levelsDist.rows);

    // Check themes
    console.log('\n=== THEMES ===\n');
    const themes = await pool.query(`
      SELECT
        language_pair,
        theme,
        COUNT(*) as sets_count
      FROM word_sets
      WHERE theme IS NOT NULL
      GROUP BY language_pair, theme
      ORDER BY language_pair, theme;
    `);

    console.log('Themes by Language Pair:');
    console.table(themes.rows);

    // Sample word sets for each language pair
    console.log('\n=== SAMPLE WORD SETS (first 3 per language pair) ===\n');
    const samples = await pool.query(`
      WITH ranked AS (
        SELECT
          language_pair,
          name,
          level,
          theme,
          word_count,
          ROW_NUMBER() OVER (PARTITION BY language_pair ORDER BY id) as rn
        FROM word_sets
      )
      SELECT language_pair, name, level, theme, word_count
      FROM ranked
      WHERE rn <= 3
      ORDER BY language_pair, rn;
    `);

    console.log('Sample Word Sets:');
    console.table(samples.rows);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkWordSetsStructure();
