const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Oxford 5000 JSON from GitHub: winterdl/oxford-5000-vocabulary-audio-definition
const OXFORD_5000_URL = 'https://raw.githubusercontent.com/winterdl/oxford-5000-vocabulary-audio-definition/master/data/json/oxford_5000.json';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function importOxford5000() {
  const client = await pool.connect();

  try {
    console.log('📥 Downloading Oxford 5000 from GitHub...\n');
    console.log('Source: https://github.com/winterdl/oxford-5000-vocabulary-audio-definition\n');

    const oxfordData = await fetchJSON(OXFORD_5000_URL);
    console.log(`✅ Downloaded ${oxfordData.length} words\n`);

    console.log('📊 Importing to database...\n');
    console.log('='.repeat(70));

    let totalInserted = 0;
    let totalSkipped = 0;
    const levelCounts = {};

    for (let i = 0; i < oxfordData.length; i++) {
      const entry = oxfordData[i];

      // Extract fields from Oxford data structure
      // Expected format: { word, cefr, pos, definition, example, ... }
      const word = entry.word || entry.headword || '';
      const level = entry.cefr || entry.level || 'B1'; // Default to B1 if missing
      const pos = entry.pos || entry.part_of_speech || '';
      const example = entry.example || '';

      if (!word) {
        totalSkipped++;
        continue;
      }

      try {
        await client.query(`
          INSERT INTO source_words_english (word, level, part_of_speech, example_en)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (word) DO UPDATE
          SET level = EXCLUDED.level,
              part_of_speech = EXCLUDED.part_of_speech,
              example_en = EXCLUDED.example_en
        `, [word.toLowerCase().trim(), level, pos, example]);

        totalInserted++;
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        if (totalInserted % 500 === 0) {
          console.log(`   ✅ Progress: ${totalInserted}/${oxfordData.length} words imported`);
        }

      } catch (error) {
        console.error(`   ❌ Error importing "${word}":`, error.message);
        totalSkipped++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 Oxford 5000 import complete!\n');
    console.log('📊 Statistics:');
    console.log(`   Total imported: ${totalInserted}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log('\n📈 By CEFR Level:');

    // Sort levels: A1, A2, B1, B2, C1, C2
    const sortedLevels = Object.keys(levelCounts).sort((a, b) => {
      const order = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
      return (order[a] || 99) - (order[b] || 99);
    });

    sortedLevels.forEach(level => {
      console.log(`   ${level}: ${levelCounts[level]} words`);
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importOxford5000().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
