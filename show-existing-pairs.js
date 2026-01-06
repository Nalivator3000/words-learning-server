/**
 * Show all existing language pairs clearly
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

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

async function showExistingPairs() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT from_lang, to_lang
      FROM language_pairs
      WHERE from_lang IS NOT NULL AND to_lang IS NOT NULL
      ORDER BY from_lang, to_lang
    `);

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       СУЩЕСТВУЮЩИЕ ЯЗЫКОВЫЕ ПАРЫ                             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Normalize pairs
    const pairs = new Set();
    const pairsList = [];

    result.rows.forEach(r => {
      const normalized = [r.from_lang, r.to_lang].sort().join('-');
      if (!pairs.has(normalized)) {
        pairs.add(normalized);
        const [lang1, lang2] = normalized.split('-');
        pairsList.push({
          code: normalized,
          name1: langCodes[lang1] || lang1,
          name2: langCodes[lang2] || lang2
        });
      }
    });

    console.log(`Всего уникальных пар: ${pairsList.length}\n`);
    console.log('═'.repeat(65));
    console.log('\nСписок всех пар:\n');

    pairsList.sort((a, b) => a.code.localeCompare(b.code));
    pairsList.forEach((pair, idx) => {
      console.log(`${(idx + 1).toString().padStart(3)}. ${pair.name1} ↔ ${pair.name2} (${pair.code})`);
    });

    console.log('\n' + '═'.repeat(65) + '\n');

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

showExistingPairs();
