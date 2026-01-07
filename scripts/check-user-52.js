const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'words_app',
  password: 'Poiuytrewq1',
  port: 5432,
});

async function checkUser52() {
  try {
    console.log('🔍 Checking user 52 (test.de.es@lexibooster.test)...\n');

    // Get user info
    const userResult = await pool.query(`
      SELECT user_id, username, email, native_language, learning_language
      FROM users
      WHERE user_id = 52
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ User 52 not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 User Info:');
    console.log(`ID: ${user.user_id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Native Language: ${user.native_language}`);
    console.log(`Learning Language: ${user.learning_language}`);
    console.log('\n---\n');

    // Get user's progress with word details
    const progressResult = await pool.query(`
      SELECT
        up.word_id,
        w.word,
        w.language,
        w.translation,
        w.theme,
        up.status,
        up.next_review_date
      FROM user_progress up
      JOIN words w ON up.word_id = w.word_id
      WHERE up.user_id = 52
      ORDER BY w.word
      LIMIT 100
    `);

    console.log(`📚 Found ${progressResult.rows.length} words in progress:\n`);

    // Group by language
    const byLanguage = {};
    for (const row of progressResult.rows) {
      if (!byLanguage[row.language]) {
        byLanguage[row.language] = [];
      }
      byLanguage[row.language].push(row);
    }

    for (const [lang, words] of Object.entries(byLanguage)) {
      console.log(`\n🌍 Language: ${lang} (${words.length} words)`);
      console.log('='.repeat(50));

      for (const word of words.slice(0, 20)) {  // Show first 20 per language
        console.log(`  ${word.word} → ${word.translation}`);
        console.log(`    Language: ${word.language}, Theme: ${word.theme || 'N/A'}, Status: ${word.status}`);
      }

      if (words.length > 20) {
        console.log(`  ... and ${words.length - 20} more words`);
      }
    }

    // Check for suspicious words (where word language doesn't match learning language)
    console.log('\n\n🔍 Checking for suspicious words...\n');

    const suspiciousResult = await pool.query(`
      SELECT
        w.word_id,
        w.word,
        w.language as word_language,
        w.translation,
        $2 as user_learning_language
      FROM user_progress up
      JOIN words w ON up.word_id = w.word_id
      WHERE up.user_id = $1
        AND w.language != $2
      ORDER BY w.word
    `, [user.user_id, user.learning_language]);

    if (suspiciousResult.rows.length > 0) {
      console.log(`⚠️ Found ${suspiciousResult.rows.length} words with wrong language:\n`);
      for (const row of suspiciousResult.rows) {
        console.log(`  Word: ${row.word} → ${row.translation}`);
        console.log(`    Word language: ${row.word_language}, Expected: ${row.user_learning_language}`);
        console.log(`    ID: ${row.word_id}`);
        console.log('  ---');
      }
    } else {
      console.log('✅ All words match the learning language');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkUser52();
