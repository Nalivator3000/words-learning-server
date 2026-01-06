const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function testWordSetsAPI() {
  try {
    console.log('=== TESTING /api/word-sets?languagePair=de-ru ===\n');

    // Simulate what the API does
    const languagePair = 'de-ru';
    const parts = languagePair.split('-');
    const sourceLanguage = parts[0]; // 'de'

    const langMap = {
      'de': 'german',
      'en': 'english',
      'hi': 'hindi',
      'es': 'spanish',
      'fr': 'french',
      'it': 'italian',
      'pt': 'portuguese',
      'ru': 'russian',
      'uk': 'ukrainian'
    };

    const fullLanguageName = langMap[sourceLanguage] || sourceLanguage;

    console.log(`languagePair parameter: "${languagePair}"`);
    console.log(`Extracted source language code: "${sourceLanguage}"`);
    console.log(`Mapped to full name: "${fullLanguageName}"`);
    console.log('');

    // Build the query exactly as the API does
    let query = 'SELECT * FROM word_sets WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    query += ` AND source_language = $${paramIndex}`;
    params.push(fullLanguageName);
    paramIndex++;

    // Default to public collections only
    query += ` AND is_public = true`;

    query += ' ORDER BY level ASC, word_count DESC, title ASC';

    console.log('SQL Query:');
    console.log(query);
    console.log('');
    console.log('Params:');
    console.log(JSON.stringify(params));
    console.log('');

    const result = await pool.query(query, params);

    console.log(`Results: ${result.rows.length} word sets found\n`);

    if (result.rows.length > 0) {
      console.log('First 5 word sets:');
      result.rows.slice(0, 5).forEach((set, index) => {
        console.log(`${index + 1}. ${set.title} (Level: ${set.level}, Words: ${set.word_count})`);
      });
    } else {
      console.log('❌ NO WORD SETS FOUND!');

      // Debug: check what's actually in the table
      console.log('\nDEBUG: Checking what source_language values exist:');
      const sourceLangs = await pool.query(
        `SELECT DISTINCT source_language, COUNT(*) as count
         FROM word_sets
         WHERE is_public = true
         GROUP BY source_language
         ORDER BY count DESC`
      );
      console.table(sourceLangs.rows);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testWordSetsAPI();
