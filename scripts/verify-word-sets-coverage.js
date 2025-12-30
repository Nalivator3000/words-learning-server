const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Mapping of language codes to full names
const languageNames = {
  'ar': 'Arabic',
  'zh': 'Chinese',
  'en': 'English',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sr': 'Serbian',
  'es': 'Spanish',
  'sw': 'Swahili',
  'tr': 'Turkish',
  'uk': 'Ukrainian'
};

async function verifyWordSetsCoverage() {
  try {
    console.log('=== WORD SETS COVERAGE ANALYSIS ===\n');

    // Get all test users
    const testUsers = await pool.query(`
      SELECT u.id, u.username, lp.from_lang, lp.to_lang
      FROM users u
      JOIN language_pairs lp ON lp.user_id = u.id
      WHERE u.username LIKE 'test_%'
      ORDER BY u.username;
    `);

    console.log(`Found ${testUsers.rows.length} test users\n`);

    // Check word sets coverage for each language pair
    const coverageReport = [];

    for (const user of testUsers.rows) {
      const { username, from_lang, to_lang } = user;
      const languagePair = `${from_lang}-${to_lang}`;

      // Convert language code to full name (e.g., 'de' -> 'german')
      const sourceLangFull = languageNames[from_lang]?.toLowerCase() || from_lang;

      // Check if word sets exist for this source language
      const wordSets = await pool.query(`
        SELECT
          level,
          COUNT(*) as sets_count,
          SUM(word_count) as total_words
        FROM word_sets
        WHERE source_language = $1
        GROUP BY level
        ORDER BY level;
      `, [sourceLangFull]);

      // Check themes
      const themes = await pool.query(`
        SELECT DISTINCT theme
        FROM word_sets
        WHERE source_language = $1
        ORDER BY theme;
      `, [sourceLangFull]);

      const hasWordSets = wordSets.rows.length > 0;
      const levels = wordSets.rows.map(r => r.level);
      const themesList = themes.rows.map(r => r.theme);

      coverageReport.push({
        username,
        language_pair: languagePair,
        from_lang_name: languageNames[from_lang] || from_lang,
        to_lang_name: languageNames[to_lang] || to_lang,
        has_word_sets: hasWordSets,
        levels_count: wordSets.rows.length,
        levels: levels.join(', ') || 'NONE',
        themes_count: themesList.length,
        themes: themesList.join(', ') || 'NONE',
        total_sets: wordSets.rows.reduce((sum, r) => sum + parseInt(r.sets_count), 0),
        total_words: wordSets.rows.reduce((sum, r) => sum + parseInt(r.total_words || 0), 0)
      });
    }

    // Categorize results
    const withWordSets = coverageReport.filter(r => r.has_word_sets);
    const withoutWordSets = coverageReport.filter(r => !r.has_word_sets);

    console.log('=== LANGUAGE PAIRS WITH WORD SETS ===\n');
    if (withWordSets.length > 0) {
      console.table(withWordSets.map(r => ({
        'User': r.username,
        'Pair': `${r.from_lang_name} → ${r.to_lang_name}`,
        'Sets': r.total_sets,
        'Words': r.total_words,
        'Levels': r.levels,
        'Themes': r.themes
      })));
    } else {
      console.log('No language pairs with word sets found.');
    }

    console.log('\n=== LANGUAGE PAIRS WITHOUT WORD SETS (NEED CREATION) ===\n');
    if (withoutWordSets.length > 0) {
      console.table(withoutWordSets.map(r => ({
        'User': r.username,
        'Pair': `${r.from_lang_name} → ${r.to_lang_name}`,
        'Code': r.language_pair
      })));

      console.log(`\nTotal language pairs without word sets: ${withoutWordSets.length}`);
      console.log('\nThese pairs need word sets to be created for proper testing.');

      // Group by priority
      const missingPairs = withoutWordSets.map(r => r.language_pair);
      console.log('\n=== MISSING WORD SETS BY PRIORITY ===\n');

      const highPriority = ['de-en', 'de-ru', 'en-ru', 'en-de'];
      const mediumPriority = ['de-es', 'de-fr', 'de-it', 'de-pt', 'en-es', 'en-fr', 'en-it', 'en-pt'];

      const missingHigh = missingPairs.filter(p => highPriority.includes(p));
      const missingMedium = missingPairs.filter(p => mediumPriority.includes(p));
      const missingLow = missingPairs.filter(p => !highPriority.includes(p) && !mediumPriority.includes(p));

      if (missingHigh.length > 0) {
        console.log('HIGH PRIORITY (main language pairs):');
        missingHigh.forEach(p => console.log(`  - ${p}`));
      }

      if (missingMedium.length > 0) {
        console.log('\nMEDIUM PRIORITY (popular language pairs):');
        missingMedium.forEach(p => console.log(`  - ${p}`));
      }

      if (missingLow.length > 0) {
        console.log('\nLOW PRIORITY (less common pairs):');
        missingLow.forEach(p => console.log(`  - ${p}`));
      }
    } else {
      console.log('All language pairs have word sets!');
    }

    // Summary
    console.log('\n=== SUMMARY ===\n');
    console.log(`Total test users: ${testUsers.rows.length}`);
    console.log(`Language pairs with word sets: ${withWordSets.length}`);
    console.log(`Language pairs without word sets: ${withoutWordSets.length}`);
    console.log(`Coverage: ${((withWordSets.length / testUsers.rows.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

verifyWordSetsCoverage();
