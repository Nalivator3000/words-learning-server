const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

const LANGUAGES = [
  { code: 'russian', name: 'Russian 🇷🇺' },
  { code: 'polish', name: 'Polish 🇵🇱' },
  { code: 'arabic', name: 'Arabic 🇸🇦' },
  { code: 'turkish', name: 'Turkish 🇹🇷' },
  { code: 'romanian', name: 'Romanian 🇷🇴' },
  { code: 'serbian', name: 'Serbian 🇷🇸' },
  { code: 'ukrainian', name: 'Ukrainian 🇺🇦' },
  { code: 'english', name: 'English 🇬🇧' },
  { code: 'italian', name: 'Italian 🇮🇹' },
  { code: 'spanish', name: 'Spanish 🇪🇸' },
  { code: 'portuguese', name: 'Portuguese 🇵🇹' },
  { code: 'swahili', name: 'Swahili 🇰🇪' }
];

const TOTAL_WORDS = 10540;

async function checkAllTranslations() {
  const client = await pool.connect();

  try {
    console.log('📊 German Vocabulary Translation Progress\n');
    console.log('='.repeat(70));

    const results = [];

    for (const lang of LANGUAGES) {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM target_translations_${lang.code}
        WHERE source_lang = 'de'
      `);

      const count = parseInt(result.rows[0].count);
      const percent = ((count / TOTAL_WORDS) * 100).toFixed(1);
      const remaining = TOTAL_WORDS - count;

      results.push({
        name: lang.name,
        count,
        percent: parseFloat(percent),
        remaining
      });
    }

    // Sort by percentage (highest first)
    results.sort((a, b) => b.percent - a.percent);

    // Display results
    console.log('\n');
    results.forEach((lang, i) => {
      const status = lang.percent === 100 ? '✅' : lang.percent > 50 ? '🔄' : '⏳';
      const bar = '█'.repeat(Math.floor(lang.percent / 2)) + '░'.repeat(50 - Math.floor(lang.percent / 2));

      console.log(`${i + 1}. ${status} ${lang.name.padEnd(20)} ${lang.percent}%`);
      console.log(`   [${bar}]`);
      console.log(`   ${lang.count.toLocaleString()} / ${TOTAL_WORDS.toLocaleString()} words | ${lang.remaining.toLocaleString()} remaining\n`);
    });

    // Summary
    console.log('='.repeat(70));
    const completed = results.filter(r => r.percent === 100).length;
    const inProgress = results.filter(r => r.percent > 0 && r.percent < 100).length;
    const totalTranslations = results.reduce((sum, r) => sum + r.count, 0);
    const totalPossible = TOTAL_WORDS * LANGUAGES.length;
    const overallPercent = ((totalTranslations / totalPossible) * 100).toFixed(1);

    console.log(`\n📈 Overall Progress: ${overallPercent}%`);
    console.log(`✅ Completed: ${completed}/${LANGUAGES.length} languages`);
    console.log(`🔄 In Progress: ${inProgress}/${LANGUAGES.length} languages`);
    console.log(`📝 Total Translations: ${totalTranslations.toLocaleString()} / ${totalPossible.toLocaleString()}`);
    console.log(`🎯 Remaining: ${(totalPossible - totalTranslations).toLocaleString()} translations\n`);

  } finally {
    client.release();
    await pool.end();
  }
}

checkAllTranslations().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
