/**
 * Check which language pairs exist in the database and which are missing
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const languages = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'russian', 'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
  'romanian', 'serbian', 'korean', 'hindi', 'japanese', 'swahili'
];

const langMap = {
  english: 'English',
  spanish: 'Spanish',
  french: 'French',
  german: 'German',
  italian: 'Italian',
  portuguese: 'Portuguese',
  russian: 'Russian',
  chinese: 'Chinese',
  arabic: 'Arabic',
  turkish: 'Turkish',
  ukrainian: 'Ukrainian',
  polish: 'Polish',
  romanian: 'Romanian',
  serbian: 'Serbian',
  korean: 'Korean',
  hindi: 'Hindi',
  japanese: 'Japanese',
  swahili: 'Swahili'
};

async function checkLanguagePairs() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ПРОВЕРКА ЯЗЫКОВЫХ ПАР В БАЗЕ ДАННЫХ                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Get all existing language pairs from the database
    const result = await pool.query(`
      SELECT DISTINCT from_lang, to_lang
      FROM language_pairs
      ORDER BY from_lang, to_lang
    `);

    const existingPairs = new Set();
    result.rows.forEach(row => {
      const pair = `${row.from_lang}-${row.to_lang}`;
      existingPairs.add(pair);
    });

    // Generate all possible pairs
    const allPossiblePairs = [];
    for (let i = 0; i < languages.length; i++) {
      for (let j = i + 1; j < languages.length; j++) {
        allPossiblePairs.push({
          lang1: languages[i],
          lang2: languages[j],
          pair: `${languages[i]}-${languages[j]}`,
          reversePair: `${languages[j]}-${languages[i]}`
        });
      }
    }

    const totalPossible = allPossiblePairs.length;

    // Check which pairs exist and which are missing
    const existing = [];
    const missing = [];

    for (const pair of allPossiblePairs) {
      const hasForward = existingPairs.has(pair.pair);
      const hasReverse = existingPairs.has(pair.reversePair);

      if (hasForward || hasReverse) {
        existing.push({
          ...pair,
          direction: hasForward ? 'forward' : 'reverse',
          dbPair: hasForward ? pair.pair : pair.reversePair
        });
      } else {
        missing.push(pair);
      }
    }

    // Display statistics
    console.log('📊 СТАТИСТИКА:\n');
    console.log(`   Всего возможных пар: ${totalPossible}`);
    console.log(`   ✅ Существует в БД: ${existing.length}`);
    console.log(`   ❌ Отсутствует в БД: ${missing.length}`);
    console.log(`   📈 Прогресс: ${((existing.length / totalPossible) * 100).toFixed(1)}%\n`);

    // Show existing pairs summary
    if (existing.length > 0) {
      console.log('═'.repeat(65));
      console.log('\n✅ СУЩЕСТВУЮЩИЕ ЯЗЫКОВЫЕ ПАРЫ:\n');

      // Group by first language
      const byFirstLang = {};
      existing.forEach(pair => {
        if (!byFirstLang[pair.lang1]) {
          byFirstLang[pair.lang1] = [];
        }
        byFirstLang[pair.lang1].push(langMap[pair.lang2]);
      });

      for (const [lang, targets] of Object.entries(byFirstLang)) {
        console.log(`${langMap[lang]} ↔ (${targets.length}):`);
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
        if (!missingByFirstLang[pair.lang1]) {
          missingByFirstLang[pair.lang1] = [];
        }
        missingByFirstLang[pair.lang1].push(langMap[pair.lang2]);
      });

      for (const [lang, targets] of Object.entries(missingByFirstLang)) {
        console.log(`${langMap[lang]} ↔ (${targets.length}):`);
        console.log(`   ${targets.join(', ')}\n`);
      }

      // Show as list for easier copying
      console.log('═'.repeat(65));
      console.log('\n📋 СПИСОК ОТСУТСТВУЮЩИХ ПАР (для копирования):\n');

      missing.forEach((pair, idx) => {
        console.log(`${(idx + 1).toString().padStart(3)}. ${langMap[pair.lang1]} ↔ ${langMap[pair.lang2]} (${pair.pair})`);
      });
    } else {
      console.log('═'.repeat(65));
      console.log('\n🎉 ВСЕ ЯЗЫКОВЫЕ ПАРЫ СОЗДАНЫ!\n');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkLanguagePairs();
