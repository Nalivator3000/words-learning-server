const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const SPANISH_URL = 'https://raw.githubusercontent.com/oprogramador/most-common-words-by-language/master/src/resources/spanish.txt';
const ENGLISH_URL = 'https://raw.githubusercontent.com/oprogramador/most-common-words-by-language/master/src/resources/english.txt';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
        }).on('error', reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function assignCEFRLevel(rank) {
  if (rank <= 1000) return 'A1';
  if (rank <= 2000) return 'A2';
  if (rank <= 3500) return 'B1';
  if (rank <= 5500) return 'B2';
  if (rank <= 8000) return 'C1';
  return 'C2';
}

async function importLanguage(lang, url, tableName) {
  const client = await pool.connect();

  try {
    console.log(`\n📥 Downloading ${lang} frequency list...\n`);
    console.log(`Source: ${url}\n`);

    const textData = await fetchText(url);
    const words = textData.split('\n').map(w => w.trim()).filter(w => w);

    console.log(`✅ Downloaded ${words.length} words\n`);
    console.log('📊 Importing to database...\n');
    console.log('='.repeat(70));

    let totalInserted = 0;
    let totalSkipped = 0;
    const levelCounts = {};

    const limit = Math.min(words.length, 10000);

    for (let i = 0; i < limit; i++) {
      const word = words[i];
      const rank = i + 1;
      const level = assignCEFRLevel(rank);

      if (!word || word.length < 2) {
        totalSkipped++;
        continue;
      }

      try {
        await client.query(`
          INSERT INTO ${tableName} (word, level)
          VALUES ($1, $2)
          ON CONFLICT (word) DO UPDATE
          SET level = EXCLUDED.level
        `, [word.toLowerCase().trim(), level]);

        totalInserted++;
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        if (totalInserted % 1000 === 0) {
          console.log(`   ✅ Progress: ${totalInserted}/${limit} words imported`);
        }

      } catch (error) {
        console.error(`   ❌ Error importing "${word}":`, error.message);
        totalSkipped++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`🎉 ${lang} import complete!\n`);
    console.log('📊 Statistics:');
    console.log(`   Total imported: ${totalInserted}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log('\n📈 By CEFR Level:');

    const sortedLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    sortedLevels.forEach(level => {
      if (levelCounts[level]) {
        console.log(`   ${level}: ${levelCounts[level]} words`);
      }
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function importBoth() {
  console.log('🌍 Importing English and Spanish vocabulary from frequency lists');
  console.log('Source: https://github.com/oprogramador/most-common-words-by-language\n');
  console.log('='.repeat(70));

  try {
    await importLanguage('English', ENGLISH_URL, 'source_words_english');
    await importLanguage('Spanish', SPANISH_URL, 'source_words_spanish');

    console.log('\n✅ All imports complete!');

  } finally {
    await pool.end();
  }
}

importBoth().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
