const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkUser5() {
  try {
    console.log('=== CHECKING USER 5 (Demo User) ===\n');

    // Check user info
    const user = await pool.query(
      'SELECT id, username, email, name FROM users WHERE id = 5'
    );

    if (user.rows.length === 0) {
      console.log('User 5 not found!');
      return;
    }

    console.log('User info:');
    console.log(user.rows[0]);
    console.log('');

    // Check language pairs
    const pairs = await pool.query(
      'SELECT * FROM language_pairs WHERE user_id = 5'
    );

    console.log(`Language pairs for user 5: ${pairs.rows.length}\n`);
    pairs.rows.forEach((pair, index) => {
      console.log(`${index + 1}. Pair ID: ${pair.id}`);
      console.log(`   Name: ${pair.name}`);
      console.log(`   from_lang: ${pair.from_lang}, to_lang: ${pair.to_lang}`);
      console.log(`   is_active: ${pair.is_active}`);
      console.log('');
    });

    // Check if German word sets exist for this language pair
    const activePair = pairs.rows.find(p => p.is_active);
    if (activePair) {
      console.log(`Active pair: ${activePair.from_lang} → ${activePair.to_lang}\n`);

      // Map language code to full name
      const langMap = {
        'de': 'german',
        'en': 'english',
        'ru': 'russian',
        'es': 'spanish'
      };

      const sourceLanguage = langMap[activePair.from_lang] || activePair.from_lang;

      const wordSets = await pool.query(
        `SELECT COUNT(*) as count
         FROM word_sets
         WHERE source_language = $1 AND is_public = true`,
        [sourceLanguage]
      );

      console.log(`Word sets available for ${activePair.from_lang} (${sourceLanguage}): ${wordSets.rows[0].count}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkUser5();
