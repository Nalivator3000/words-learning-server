const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Simple password hash (matches server logic)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

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

// Key language pairs to test (most common ones with good translation coverage)
const testLanguagePairs = [
  // From German
  { from: 'de', to: 'en', priority: 'high' },
  { from: 'de', to: 'ru', priority: 'high' },
  { from: 'de', to: 'es', priority: 'medium' },
  { from: 'de', to: 'fr', priority: 'medium' },
  { from: 'de', to: 'it', priority: 'medium' },
  { from: 'de', to: 'pt', priority: 'medium' },
  { from: 'de', to: 'ar', priority: 'low' },
  { from: 'de', to: 'zh', priority: 'low' },
  { from: 'de', to: 'ja', priority: 'low' },
  { from: 'de', to: 'tr', priority: 'low' },

  // From English
  { from: 'en', to: 'ru', priority: 'high' },
  { from: 'en', to: 'de', priority: 'high' },
  { from: 'en', to: 'es', priority: 'medium' },
  { from: 'en', to: 'fr', priority: 'medium' },
  { from: 'en', to: 'it', priority: 'medium' },
  { from: 'en', to: 'pt', priority: 'medium' },
  { from: 'en', to: 'ar', priority: 'low' },
  { from: 'en', to: 'zh', priority: 'low' },
  { from: 'en', to: 'ja', priority: 'low' },
  { from: 'en', to: 'tr', priority: 'low' },

  // From Spanish
  { from: 'es', to: 'en', priority: 'medium' },
  { from: 'es', to: 'de', priority: 'medium' },
  { from: 'es', to: 'fr', priority: 'low' },
  { from: 'es', to: 'pt', priority: 'low' },

  // From French
  { from: 'fr', to: 'en', priority: 'medium' },
  { from: 'fr', to: 'de', priority: 'medium' },
  { from: 'fr', to: 'es', priority: 'low' },

  // From Italian
  { from: 'it', to: 'en', priority: 'medium' },
  { from: 'it', to: 'de', priority: 'medium' },

  // From Portuguese
  { from: 'pt', to: 'en', priority: 'medium' },
  { from: 'pt', to: 'de', priority: 'medium' },

  // From Arabic
  { from: 'ar', to: 'en', priority: 'low' },
  { from: 'ar', to: 'de', priority: 'low' },

  // From Chinese
  { from: 'zh', to: 'en', priority: 'low' },
  { from: 'zh', to: 'de', priority: 'low' },

  // From Russian
  { from: 'ru', to: 'en', priority: 'medium' },
  { from: 'ru', to: 'de', priority: 'medium' },

  // From Hindi
  { from: 'hi', to: 'en', priority: 'medium' },
  { from: 'hi', to: 'de', priority: 'low' },
];

async function createTestUsers() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== CREATING TEST USERS FOR LANGUAGE PAIRS ===\n');

    // Default password for all test users
    const password = 'test123';
    const hashedPassword = hashPassword(password);

    const createdUsers = [];
    const failedPairs = [];

    for (const { from, to, priority } of testLanguagePairs) {
      const fromLang = languageNames[from] || from;
      const toLang = languageNames[to] || to;

      const username = `test_${from}_${to}`;
      const email = `test.${from}.${to}@lexibooster.test`;

      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT id, username FROM users WHERE username = $1',
          [username]
        );

        let userId;

        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
          console.log(`✓ User exists: ${username} (ID: ${userId})`);
        } else {
          // Create user
          const userResult = await client.query(
            `INSERT INTO users (username, name, email, password, createdat)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id`,
            [username, username, email, hashedPassword]
          );

          userId = userResult.rows[0].id;
          console.log(`✓ Created user: ${username} (ID: ${userId})`);
        }

        // Check if language pair already exists for user
        const existingPair = await client.query(
          'SELECT id FROM language_pairs WHERE user_id = $1',
          [userId]
        );

        if (existingPair.rows.length === 0) {
          // Create language pair
          const pairName = `${fromLang} → ${toLang}`;
          await client.query(
            `INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active, createdat)
             VALUES ($1, $2, $3, $4, true, NOW())`,
            [userId, pairName, from, to]
          );

          console.log(`  → Added language pair: ${from} → ${to} (${fromLang} → ${toLang})`);
        } else {
          console.log(`  → Language pair already exists`);
        }

        createdUsers.push({
          username,
          email,
          from_lang: from,
          to_lang: to,
          from_lang_name: fromLang,
          to_lang_name: toLang,
          priority,
          user_id: userId
        });

      } catch (error) {
        console.error(`✗ Failed to create ${username}: ${error.message}`);
        failedPairs.push({ from, to, error: error.message });
      }
    }

    await client.query('COMMIT');

    console.log('\n=== SUMMARY ===\n');
    console.log(`Total users created/verified: ${createdUsers.length}`);
    console.log(`Failed: ${failedPairs.length}`);

    if (createdUsers.length > 0) {
      console.log('\n=== TEST USERS CREDENTIALS ===\n');
      console.log('Password for all test users: test123\n');

      console.log('High Priority Pairs:');
      createdUsers
        .filter(u => u.priority === 'high')
        .forEach(u => {
          console.log(`  ${u.username} - ${u.from_lang_name} → ${u.to_lang_name}`);
        });

      console.log('\nMedium Priority Pairs:');
      createdUsers
        .filter(u => u.priority === 'medium')
        .forEach(u => {
          console.log(`  ${u.username} - ${u.from_lang_name} → ${u.to_lang_name}`);
        });

      console.log('\nLow Priority Pairs:');
      createdUsers
        .filter(u => u.priority === 'low')
        .forEach(u => {
          console.log(`  ${u.username} - ${u.from_lang_name} → ${u.to_lang_name}`);
        });
    }

    if (failedPairs.length > 0) {
      console.log('\n=== FAILED PAIRS ===\n');
      console.table(failedPairs);
    }

    // Save user list to file for easy reference
    const fs = require('fs');
    const userListPath = 'test-users-list.json';
    fs.writeFileSync(userListPath, JSON.stringify(createdUsers, null, 2));
    console.log(`\n✓ User list saved to ${userListPath}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUsers();
