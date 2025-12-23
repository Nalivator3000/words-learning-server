const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkVocabStatus() {
  const client = await pool.connect();

  try {
    console.log('📊 VOCABULARY DATABASE STATUS\n');
    console.log('='.repeat(70));
    console.log('SOURCE WORDS BY LANGUAGE:\n');

    const langs = ['german', 'english', 'spanish', 'french', 'russian', 'italian'];

    for (const lang of langs) {
      try {
        const r = await client.query(`SELECT COUNT(*) as count FROM source_words_${lang}`);
        const count = parseInt(r.rows[0].count);
        console.log(`  ${lang.padEnd(15)}: ${count.toLocaleString()} words`);
      } catch (e) {
        console.log(`  ${lang.padEnd(15)}: ERROR - ${e.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('TRANSLATION PAIRS:\n');

    const translationPairs = [
      ['de', 'russian', 'German → Russian'],
      ['de', 'english', 'German → English'],
      ['es', 'english', 'Spanish → English'],
      ['es', 'russian', 'Spanish → Russian'],
      ['en', 'russian', 'English → Russian'],
      ['en', 'spanish', 'English → Spanish'],
      ['en', 'german', 'English → German'],
      ['fr', 'english', 'French → English'],
      ['ru', 'english', 'Russian → English'],
      ['it', 'english', 'Italian → English']
    ];

    for (const [sourceLang, targetLang, label] of translationPairs) {
      try {
        const r = await client.query(
          `SELECT COUNT(*) as count FROM target_translations_${targetLang} WHERE source_lang = $1`,
          [sourceLang]
        );
        const count = parseInt(r.rows[0].count);
        if (count > 0) {
          console.log(`  ${label.padEnd(30)}: ${count.toLocaleString()} translations`);
        }
      } catch (e) {
        // Skip if table doesn't exist or query fails
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkVocabStatus().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
