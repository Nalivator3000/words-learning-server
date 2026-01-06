/**
 * Check final status of all 6 improved languages
 */

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkFinalStatus() {
  const languages = ['italian', 'portuguese', 'turkish', 'russian', 'arabic', 'ukrainian'];

  console.log('\n' + '═'.repeat(80));
  console.log('📊 ФИНАЛЬНЫЙ СТАТУС ВСЕХ 6 ЯЗЫКОВ');
  console.log('═'.repeat(80) + '\n');

  let totalWords = 0;
  let totalReal = 0;
  let totalPlaceholders = 0;

  for (const lang of languages) {
    const total = await pool.query(`SELECT COUNT(*) as count FROM source_words_${lang}`);
    const placeholders = await pool.query(`SELECT COUNT(*) as count FROM source_words_${lang} WHERE word LIKE '%_word_%'`);

    const totalCount = parseInt(total.rows[0].count);
    const placeholderCount = parseInt(placeholders.rows[0].count);
    const realCount = totalCount - placeholderCount;
    const percentage = ((realCount / totalCount) * 100).toFixed(1);

    totalWords += totalCount;
    totalReal += realCount;
    totalPlaceholders += placeholderCount;

    const status = percentage == 100.0 ? '✅' : '⚠️';
    const langName = lang.charAt(0).toUpperCase() + lang.slice(1);

    console.log(`${status} ${langName.padEnd(12)} | Всего: ${totalCount.toString().padStart(5)} | Реальных: ${realCount.toString().padStart(5)} (${percentage}%) | Плейсхолдеров: ${placeholderCount}`);
  }

  console.log('\n' + '─'.repeat(80));
  console.log(`📈 ИТОГО: ${totalWords} слов | Реальных: ${totalReal} | Плейсхолдеров: ${totalPlaceholders}`);
  console.log(`📊 Средний процент: ${((totalReal / totalWords) * 100).toFixed(1)}%`);
  console.log('═'.repeat(80) + '\n');

  await pool.end();
}

checkFinalStatus().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
