const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkGermanWordSets() {
  try {
    console.log('=== CHECKING GERMAN WORD SETS ===\n');

    // Check word sets with source_language = 'german'
    const germanSets = await pool.query(
      `SELECT id, title, source_language, level, theme, word_count, is_public
       FROM word_sets
       WHERE source_language = 'german'
       ORDER BY level ASC, word_count DESC
       LIMIT 10`
    );

    console.log(`Found ${germanSets.rows.length} German word sets (showing first 10):\n`);
    germanSets.rows.forEach((set, index) => {
      console.log(`${index + 1}. ${set.title}`);
      console.log(`   Source: ${set.source_language}`);
      console.log(`   Level: ${set.level || 'N/A'}, Theme: ${set.theme || 'N/A'}`);
      console.log(`   Words: ${set.word_count}, Public: ${set.is_public}`);
      console.log('');
    });

    // Get total count
    const totalCount = await pool.query(
      `SELECT COUNT(*) as count FROM word_sets WHERE source_language = 'german'`
    );
    console.log(`Total German word sets: ${totalCount.rows[0].count}\n`);

    // Check what the API would return for languagePair=de-ru
    console.log('=== SIMULATING API CALL: /api/word-sets?languagePair=de-ru ===\n');

    const apiSimulation = await pool.query(
      `SELECT id, title, source_language, level, theme, word_count
       FROM word_sets
       WHERE source_language = $1 AND is_public = true
       ORDER BY level ASC, word_count DESC, title ASC
       LIMIT 5`,
      ['german']
    );

    console.log(`API would return ${apiSimulation.rows.length} word sets:\n`);
    apiSimulation.rows.forEach((set, index) => {
      console.log(`${index + 1}. ${set.title} (Level: ${set.level}, Theme: ${set.theme || 'N/A'})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkGermanWordSets();
