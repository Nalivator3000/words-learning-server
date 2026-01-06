const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const languages = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'russian', 'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
  'romanian', 'serbian', 'korean', 'hindi', 'japanese', 'swahili'
];

async function checkAllLanguages() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ПОЛНЫЙ СТАТУС ВСЕХ ЯЗЫКОВ В ПРОЕКТЕ                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const results = {
    complete: [],
    incomplete: [],
    missing: []
  };

  for (const lang of languages) {
    try {
      const wordsResult = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN theme IS NOT NULL THEN 1 END) as with_theme
        FROM source_words_${lang}
      `);

      const setsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM word_sets
        WHERE source_language = $1
      `, [lang]);

      const words = wordsResult.rows[0];
      const sets = parseInt(setsResult.rows[0].count);
      const langName = lang.charAt(0).toUpperCase() + lang.slice(1);

      const hasAllThemes = words.with_theme == words.total;
      const hasSets = sets > 0;

      let status;
      if (hasAllThemes && hasSets) {
        status = '✅';
        results.complete.push(lang);
      } else if (hasAllThemes) {
        status = '⚠️ ';
        results.incomplete.push({ lang, reason: 'no sets' });
      } else {
        status = '❌';
        results.incomplete.push({ lang, reason: 'no themes' });
      }

      console.log(`${status} ${langName.padEnd(12)} │ Words: ${words.total.toString().padStart(5)} │ Themed: ${words.with_theme.toString().padStart(5)} │ Sets: ${sets.toString().padStart(3)}`);

    } catch (e) {
      const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
      console.log(`❌ ${langName.padEnd(12)} │ ERROR: ${e.message}`);
      results.missing.push(lang);
    }
  }

  console.log('\n' + '─'.repeat(65) + '\n');
  console.log(`✅ Готовые языки: ${results.complete.length}`);
  console.log(`⚠️  Неполные: ${results.incomplete.length}`);
  console.log(`❌ Отсутствуют: ${results.missing.length}`);

  if (results.incomplete.length > 0) {
    console.log('\nНеполные языки:');
    results.incomplete.forEach(item => {
      console.log(`  - ${item.lang}: ${item.reason}`);
    });
  }

  await pool.end();
}

checkAllLanguages();
