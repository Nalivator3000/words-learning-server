const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Using Berehulia/Oxford-3000-5000 repository - CSV format
const OXFORD_5000_CSV_URL = 'https://raw.githubusercontent.com/Berehulia/Oxford-3000-5000/main/Oxford_5000.csv';

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
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

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',');
    const record = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ? values[index].trim() : '';
    });

    if (record.word || record.headword) {
      records.push(record);
    }
  }

  return records;
}

async function importOxford5000CSV() {
  const client = await pool.connect();

  try {
    console.log('📥 Downloading Oxford 5000 CSV from GitHub...\n');
    console.log('Source: https://github.com/Berehulia/Oxford-3000-5000\n');

    const csvData = await fetchCSV(OXFORD_5000_CSV_URL);
    console.log(`✅ Downloaded CSV (${csvData.length} bytes)\n`);

    const oxfordWords = parseCSV(csvData);
    console.log(`✅ Parsed ${oxfordWords.length} words\n`);

    console.log('📊 Importing to database...\n');
    console.log('='.repeat(70));

    let totalInserted = 0;
    let totalSkipped = 0;
    const levelCounts = {};

    for (let i = 0; i < oxfordWords.length; i++) {
      const entry = oxfordWords[i];

      // Expected CSV format: word, cefr_level, pos, ...
      const word = entry.word || entry.headword || entry.lemma || '';
      const level = entry.cefr || entry.cefr_level || entry.level || 'B1';
      const pos = entry.pos || entry.part_of_speech || '';

      if (!word) {
        totalSkipped++;
        continue;
      }

      try {
        await client.query(`
          INSERT INTO source_words_english (word, level, part_of_speech)
          VALUES ($1, $2, $3)
          ON CONFLICT (word) DO UPDATE
          SET level = EXCLUDED.level,
              part_of_speech = EXCLUDED.part_of_speech
        `, [word.toLowerCase().trim(), level, pos]);

        totalInserted++;
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        if (totalInserted % 500 === 0) {
          console.log(`   ✅ Progress: ${totalInserted}/${oxfordWords.length} words imported`);
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

importOxford5000CSV().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
