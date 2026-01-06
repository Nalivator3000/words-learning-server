/**
 * Check which language pairs are available and which need to be created
 * Uses ISO language codes as stored in the database
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// ISO language codes mapping
const langCodes = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'pl': 'Polish',
  'ro': 'Romanian',
  'sr': 'Serbian',
  'ko': 'Korean',
  'hi': 'Hindi',
  'ja': 'Japanese',
  'sw': 'Swahili'
};

const codes = Object.keys(langCodes);

async function checkAvailablePairs() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ДОСТУПНЫЕ ЯЗЫКОВЫЕ ПАРЫ В СИСТЕМЕ                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Get all unique language pairs from database (both directions)
    const result = await pool.query(`
      SELECT DISTINCT from_lang, to_lang
      FROM language_pairs
      WHERE from_lang IS NOT NULL AND to_lang IS NOT NULL
      ORDER BY from_lang, to_lang
    `);

    console.log(`📊 Всего записей в language_pairs: ${result.rows.length}\n`);

    // Store existing pairs (normalize to bidirectional)
    const existingPairs = new Set();
    result.rows.forEach(row => {
      const lang1 = row.from_lang;
      const lang2 = row.to_lang;

      // Normalize: always store in alphabetical order
      const pair = [lang1, lang2].sort().join('-');
      existingPairs.add(pair);
    });

    // Generate all possible pairs
    const allPossiblePairs = [];
    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        allPossiblePairs.push({
          code1: codes[i],
          code2: codes[j],
          name1: langCodes[codes[i]],
          name2: langCodes[codes[j]],
          pair: `${codes[i]}-${codes[j]}`
        });
      }
    }

    const totalPossible = allPossiblePairs.length;

    // Check which pairs exist and which are missing
    const available = [];
    const missing = [];

    for (const pair of allPossiblePairs) {
      if (existingPairs.has(pair.pair)) {
        available.push(pair);
      } else {
        missing.push(pair);
      }
    }

    // Display statistics
    console.log('═'.repeat(65));
    console.log('\n📊 СТАТИСТИКА:\n');
    console.log(`   Всего возможных пар: ${totalPossible}`);
    console.log(`   ✅ Доступно в системе: ${available.length}`);
    console.log(`   ❌ Отсутствует: ${missing.length}`);
    console.log(`   📈 Прогресс: ${((available.length / totalPossible) * 100).toFixed(1)}%\n`);

    // Show available pairs
    if (available.length > 0) {
      console.log('═'.repeat(65));
      console.log('\n✅ ДОСТУПНЫЕ ЯЗЫКОВЫЕ ПАРЫ:\n');

      // Group by first language
      const byFirstLang = {};
      available.forEach(pair => {
        if (!byFirstLang[pair.code1]) {
          byFirstLang[pair.code1] = [];
        }
        byFirstLang[pair.code1].push(`${pair.name2} (${pair.code2})`);
      });

      for (const [code, targets] of Object.entries(byFirstLang)) {
        console.log(`${langCodes[code]} (${code}) ↔ ${targets.length} пар:`);
        console.log(`   ${targets.join(', ')}\n`);
      }
    }

    // Show missing pairs
    if (missing.length > 0) {
      console.log('═'.repeat(65));
      console.log('\n❌ ОТСУТСТВУЮЩИЕ ЯЗЫКОВЫЕ ПАРЫ:\n');

      // Group by first language
      const missingByFirstLang = {};
      missing.forEach(pair => {
        if (!missingByFirstLang[pair.code1]) {
          missingByFirstLang[pair.code1] = [];
        }
        missingByFirstLang[pair.code1].push(`${pair.name2} (${pair.code2})`);
      });

      for (const [code, targets] of Object.entries(missingByFirstLang)) {
        console.log(`${langCodes[code]} (${code}) ↔ ${targets.length} пар:`);
        console.log(`   ${targets.join(', ')}\n`);
      }

      // Show as list for easier copying
      console.log('═'.repeat(65));
      console.log('\n📋 СПИСОК ОТСУТСТВУЮЩИХ ПАР (для создания):\n');

      missing.forEach((pair, idx) => {
        console.log(`${(idx + 1).toString().padStart(3)}. ${pair.name1} ↔ ${pair.name2} (${pair.pair})`);
      });
    } else {
      console.log('═'.repeat(65));
      console.log('\n🎉 ВСЕ ЯЗЫКОВЫЕ ПАРЫ ДОСТУПНЫ В СИСТЕМЕ!\n');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkAvailablePairs();
