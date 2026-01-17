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

// Language names for display
const languageNames = {
  'ar': 'Arabic',
  'zh': 'Chinese (Mandarin)',
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

// Test users to create:
// - German learners with native: Swahili, Romanian, Serbian, Turkish
// - Spanish learners with native: Russian, English
// - Chinese (Mandarin) learners with native: German
//
// Format: { target: 'language to learn', native: 'native/interface language' }
const testUsers = [
  // German learners
  { target: 'de', native: 'sw', description: 'German for Swahili speakers' },
  { target: 'de', native: 'ro', description: 'German for Romanian speakers' },
  { target: 'de', native: 'sr', description: 'German for Serbian speakers' },
  { target: 'de', native: 'tr', description: 'German for Turkish speakers' },

  // Spanish learners
  { target: 'es', native: 'ru', description: 'Spanish for Russian speakers' },
  { target: 'es', native: 'en', description: 'Spanish for English speakers' },

  // Chinese (Mandarin) learners
  { target: 'zh', native: 'de', description: 'Chinese for German speakers' },
];

async function createManualTestUsers() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== CREATING MANUAL TEST USERS ===\n');

    const password = 'test123';
    const hashedPassword = hashPassword(password);

    const createdUsers = [];

    for (const user of testUsers) {
      const targetName = languageNames[user.target] || user.target;
      const nativeName = languageNames[user.native] || user.native;

      // Username format: manual_test_<target>_<native>
      const username = `manual_test_${user.target}_${user.native}`;
      const email = `manual.test.${user.target}.${user.native}@lexibooster.test`;

      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE username = $1',
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

        // Check if language pair already exists
        const existingPair = await client.query(
          'SELECT id FROM language_pairs WHERE user_id = $1',
          [userId]
        );

        if (existingPair.rows.length === 0) {
          // Create language pair
          // from_lang = target language (what user is learning)
          // to_lang = native language (translations shown in this language)
          const pairName = `${targetName} → ${nativeName}`;
          await client.query(
            `INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active, createdat)
             VALUES ($1, $2, $3, $4, true, NOW())`,
            [userId, pairName, user.target, user.native]
          );

          console.log(`  → Added language pair: ${user.target} → ${user.native}`);
        } else {
          console.log(`  → Language pair already exists`);
        }

        // Set interface language in user_settings (same as native language)
        const existingSettings = await client.query(
          'SELECT id FROM user_settings WHERE user_id = $1',
          [userId]
        );

        if (existingSettings.rows.length === 0) {
          await client.query(
            `INSERT INTO user_settings (user_id, language)
             VALUES ($1, $2)`,
            [userId, user.native]
          );
          console.log(`  → Set interface language to: ${user.native} (${nativeName})`);
        } else {
          await client.query(
            `UPDATE user_settings SET language = $1 WHERE user_id = $2`,
            [user.native, userId]
          );
          console.log(`  → Updated interface language to: ${user.native} (${nativeName})`);
        }

        createdUsers.push({
          username,
          email,
          userId,
          target: user.target,
          native: user.native,
          targetName,
          nativeName,
          description: user.description
        });

        console.log('');

      } catch (error) {
        console.error(`✗ Failed to create ${username}: ${error.message}`);
      }
    }

    await client.query('COMMIT');

    console.log('\n=== SUMMARY ===\n');
    console.log(`Total users created/verified: ${createdUsers.length}`);
    console.log(`Password for all users: ${password}\n`);

    console.log('=== TEST ACCOUNTS ===\n');
    console.log('┌──────────────────────────────────┬────────┬─────────────────────────────────────┬──────────────────────────────────┐');
    console.log('│ Username                         │ ID     │ Learning                            │ Interface Language               │');
    console.log('├──────────────────────────────────┼────────┼─────────────────────────────────────┼──────────────────────────────────┤');

    for (const u of createdUsers) {
      const username = u.username.padEnd(32);
      const id = String(u.userId).padEnd(6);
      const learning = `${u.targetName} (${u.target})`.padEnd(35);
      const interfaceLang = `${u.nativeName} (${u.native})`.padEnd(32);
      console.log(`│ ${username} │ ${id} │ ${learning} │ ${interfaceLang} │`);
    }

    console.log('└──────────────────────────────────┴────────┴─────────────────────────────────────┴──────────────────────────────────┘');

    console.log('\n=== LOGIN CREDENTIALS ===\n');
    for (const u of createdUsers) {
      console.log(`${u.description}:`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Password: ${password}`);
      console.log('');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

createManualTestUsers();
