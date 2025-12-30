const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function testHindiWordSets() {
  const client = await pool.connect();

  try {
    console.log('=== TESTING HINDI WORD SETS ===\n');

    // 1. Check total Hindi words in source table
    const totalWords = await client.query('SELECT COUNT(*) FROM source_words_hindi');
    console.log('Total Hindi source words:', totalWords.rows[0].count);

    // 2. Check word sets
    const wordSets = await client.query(
      'SELECT id, title, level, theme, word_count FROM word_sets WHERE source_language = $1 ORDER BY level NULLS LAST, theme NULLS LAST',
      ['hindi']
    );
    console.log('\nHindi Word Sets:', wordSets.rows.length);

    // 3. Group by type
    const levelSets = wordSets.rows.filter(s => s.level !== null);
    const themeSets = wordSets.rows.filter(s => s.theme !== null);

    console.log('\nLevel-based sets:', levelSets.length);
    console.table(levelSets.map(s => ({
      Title: s.title,
      Level: s.level,
      'Word Count': s.word_count
    })));

    console.log('\nThematic sets:', themeSets.length);
    console.table(themeSets.map(s => ({
      Title: s.title,
      Theme: s.theme,
      'Word Count': s.word_count
    })));

    // 4. Verify total coverage
    const levelTotal = levelSets.reduce((sum, s) => sum + s.word_count, 0);
    const themeTotal = themeSets.reduce((sum, s) => sum + s.word_count, 0);

    console.log('\n=== COVERAGE ===');
    console.log('Words in level-based sets:', levelTotal);
    console.log('Words in thematic sets:', themeTotal);
    console.log('Total unique words in source:', totalWords.rows[0].count);

    // 5. Check test users
    const testUsers = await client.query(
      `SELECT u.id, u.username, lp.from_lang, lp.to_lang
       FROM users u
       JOIN language_pairs lp ON u.id = lp.user_id
       WHERE u.username LIKE $1`,
      ['test_hi_%']
    );

    console.log('\n=== TEST USERS ===');
    console.log('Test Users for Hindi:', testUsers.rows.length);
    testUsers.rows.forEach(u => {
      console.log(`  - ${u.username} | ${u.from_lang} → ${u.to_lang}`);
    });

    console.log('\n✓ Hindi word sets are ready for testing!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Username: test_hi_en or test_hi_de');
    console.log('Password: test123');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

testHindiWordSets();
