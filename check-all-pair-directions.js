/**
 * Check all language pair directions in the database
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkAllDirections() {
  try {
    const result = await pool.query(`
      SELECT from_lang, to_lang, COUNT(*) as count
      FROM language_pairs
      GROUP BY from_lang, to_lang
      ORDER BY from_lang, to_lang
    `);

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       ВСЕ НАПРАВЛЕНИЯ ЯЗЫКОВЫХ ПАР В БД                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('Уникальные направления (from_lang -> to_lang):\n');
    result.rows.forEach(r => {
      console.log(`  ${r.from_lang} -> ${r.to_lang} (${r.count} записей)`);
    });

    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`\nВсего уникальных направлений: ${result.rows.length}`);

    // Count unique bidirectional pairs
    const pairs = new Set();
    result.rows.forEach(r => {
      const normalized = [r.from_lang, r.to_lang].sort().join('-');
      pairs.add(normalized);
    });

    console.log(`Уникальных пар (с учётом обоих направлений): ${pairs.size}\n`);

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllDirections();
