const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Test accounts configuration based on TEST_ACCOUNTS_READY.md
const testAccounts = [
  // High Priority
  { id: 50, email: 'test.de.en@lexibooster.test', from: 'de', to: 'en', fromName: 'German', toName: 'English' },
  { id: 51, email: 'test.de.ru@lexibooster.test', from: 'de', to: 'ru', fromName: 'German', toName: 'Russian' },
  { id: 60, email: 'test.en.ru@lexibooster.test', from: 'en', to: 'ru', fromName: 'English', toName: 'Russian' },
  { id: 61, email: 'test.en.de@lexibooster.test', from: 'en', to: 'de', fromName: 'English', toName: 'German' },

  // Medium Priority
  { id: 52, email: 'test.de.es@lexibooster.test', from: 'de', to: 'es', fromName: 'German', toName: 'Spanish' },
  { id: 53, email: 'test.de.fr@lexibooster.test', from: 'de', to: 'fr', fromName: 'German', toName: 'French' },
  { id: 62, email: 'test.en.es@lexibooster.test', from: 'en', to: 'es', fromName: 'English', toName: 'Spanish' },
  { id: 87, email: 'test.hi.en@lexibooster.test', from: 'hi', to: 'en', fromName: 'Hindi', toName: 'English' },
  { id: 88, email: 'test.hi.de@lexibooster.test', from: 'hi', to: 'de', fromName: 'Hindi', toName: 'German' },

  // Low Priority
  { id: 81, email: 'test.ar.en@lexibooster.test', from: 'ar', to: 'en', fromName: 'Arabic', toName: 'English' },
  { id: 83, email: 'test.zh.en@lexibooster.test', from: 'zh', to: 'en', fromName: 'Chinese', toName: 'English' },

  // All German → other
  { id: 54, email: 'test.de.it@lexibooster.test', from: 'de', to: 'it', fromName: 'German', toName: 'Italian' },
  { id: 55, email: 'test.de.pt@lexibooster.test', from: 'de', to: 'pt', fromName: 'German', toName: 'Portuguese' },
  { id: 56, email: 'test.de.ar@lexibooster.test', from: 'de', to: 'ar', fromName: 'German', toName: 'Arabic' },
  { id: 57, email: 'test.de.zh@lexibooster.test', from: 'de', to: 'zh', fromName: 'German', toName: 'Chinese' },
  { id: 58, email: 'test.de.ja@lexibooster.test', from: 'de', to: 'ja', fromName: 'German', toName: 'Japanese' },
  { id: 59, email: 'test.de.tr@lexibooster.test', from: 'de', to: 'tr', fromName: 'German', toName: 'Turkish' },

  // All English → other
  { id: 63, email: 'test.en.fr@lexibooster.test', from: 'en', to: 'fr', fromName: 'English', toName: 'French' },
  { id: 64, email: 'test.en.it@lexibooster.test', from: 'en', to: 'it', fromName: 'English', toName: 'Italian' },
  { id: 65, email: 'test.en.pt@lexibooster.test', from: 'en', to: 'pt', fromName: 'English', toName: 'Portuguese' },
  { id: 66, email: 'test.en.ar@lexibooster.test', from: 'en', to: 'ar', fromName: 'English', toName: 'Arabic' },
  { id: 67, email: 'test.en.zh@lexibooster.test', from: 'en', to: 'zh', fromName: 'English', toName: 'Chinese' },
  { id: 68, email: 'test.en.ja@lexibooster.test', from: 'en', to: 'ja', fromName: 'English', toName: 'Japanese' },
  { id: 69, email: 'test.en.tr@lexibooster.test', from: 'en', to: 'tr', fromName: 'English', toName: 'Turkish' },

  // Spanish → other
  { id: 70, email: 'test.es.en@lexibooster.test', from: 'es', to: 'en', fromName: 'Spanish', toName: 'English' },
  { id: 71, email: 'test.es.de@lexibooster.test', from: 'es', to: 'de', fromName: 'Spanish', toName: 'German' },
  { id: 72, email: 'test.es.fr@lexibooster.test', from: 'es', to: 'fr', fromName: 'Spanish', toName: 'French' },
  { id: 73, email: 'test.es.pt@lexibooster.test', from: 'es', to: 'pt', fromName: 'Spanish', toName: 'Portuguese' },

  // French → other
  { id: 74, email: 'test.fr.en@lexibooster.test', from: 'fr', to: 'en', fromName: 'French', toName: 'English' },
  { id: 75, email: 'test.fr.de@lexibooster.test', from: 'fr', to: 'de', fromName: 'French', toName: 'German' },
  { id: 76, email: 'test.fr.es@lexibooster.test', from: 'fr', to: 'es', fromName: 'French', toName: 'Spanish' },

  // Italian → other
  { id: 77, email: 'test.it.en@lexibooster.test', from: 'it', to: 'en', fromName: 'Italian', toName: 'English' },
  { id: 78, email: 'test.it.de@lexibooster.test', from: 'it', to: 'de', fromName: 'Italian', toName: 'German' },

  // Portuguese → other
  { id: 79, email: 'test.pt.en@lexibooster.test', from: 'pt', to: 'en', fromName: 'Portuguese', toName: 'English' },
  { id: 80, email: 'test.pt.de@lexibooster.test', from: 'pt', to: 'de', fromName: 'Portuguese', toName: 'German' },

  // Arabic → other
  { id: 82, email: 'test.ar.de@lexibooster.test', from: 'ar', to: 'de', fromName: 'Arabic', toName: 'German' },

  // Chinese → other
  { id: 84, email: 'test.zh.de@lexibooster.test', from: 'zh', to: 'de', fromName: 'Chinese', toName: 'German' },

  // Russian → other (EMPTY - intentionally no word sets)
  { id: 85, email: 'test.ru.en@lexibooster.test', from: 'ru', to: 'en', fromName: 'Russian', toName: 'English' },
  { id: 86, email: 'test.ru.de@lexibooster.test', from: 'ru', to: 'de', fromName: 'Russian', toName: 'German' },
];

async function fixLanguagePairs() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== CHECKING AND FIXING LANGUAGE PAIRS FOR TEST ACCOUNTS ===\n');

    const results = {
      checked: 0,
      existing: 0,
      created: 0,
      failed: []
    };

    for (const account of testAccounts) {
      results.checked++;

      try {
        // Check if user exists
        const userCheck = await client.query(
          'SELECT id, email FROM users WHERE id = $1',
          [account.id]
        );

        if (userCheck.rows.length === 0) {
          console.log(`⚠️  User ${account.id} (${account.email}) not found - skipping`);
          results.failed.push({ id: account.id, email: account.email, error: 'User not found' });
          continue;
        }

        // Check if language pair already exists for this user
        const pairCheck = await client.query(
          'SELECT id FROM language_pairs WHERE user_id = $1 AND from_lang = $2 AND to_lang = $3',
          [account.id, account.from, account.to]
        );

        if (pairCheck.rows.length > 0) {
          console.log(`✓ User ${account.id}: Language pair ${account.from}→${account.to} already exists (ID: ${pairCheck.rows[0].id})`);
          results.existing++;
        } else {
          // Create language pair
          const pairName = `${account.fromName} → ${account.toName}`;
          const newPair = await client.query(
            `INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active, createdat)
             VALUES ($1, $2, $3, $4, true, NOW())
             RETURNING id`,
            [account.id, pairName, account.from, account.to]
          );

          console.log(`✅ User ${account.id}: Created language pair ${account.from}→${account.to} (ID: ${newPair.rows[0].id})`);
          results.created++;
        }

      } catch (error) {
        console.error(`✗ Failed for user ${account.id}: ${error.message}`);
        results.failed.push({ id: account.id, email: account.email, error: error.message });
      }
    }

    await client.query('COMMIT');

    console.log('\n=== SUMMARY ===');
    console.log(`Checked: ${results.checked} accounts`);
    console.log(`Already had pairs: ${results.existing}`);
    console.log(`Created new pairs: ${results.created}`);
    console.log(`Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\n=== FAILED ACCOUNTS ===');
      results.failed.forEach(f => {
        console.log(`  User ${f.id} (${f.email}): ${f.error}`);
      });
    }

    console.log('\n✅ Done!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixLanguagePairs();
