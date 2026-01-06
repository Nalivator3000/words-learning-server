/**
 * Analyze which translation pairs exist based on target_translations_* tables
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

const langNames = {
  'english': 'en',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'portuguese': 'pt',
  'russian': 'ru',
  'chinese': 'zh',
  'arabic': 'ar',
  'turkish': 'tr',
  'ukrainian': 'uk',
  'polish': 'pl',
  'romanian': 'ro',
  'serbian': 'sr',
  'korean': 'ko',
  'hindi': 'hi',
  'japanese': 'ja',
  'swahili': 'sw'
};

async function analyzeTranslationTables() {
  try {
    // Get all translation tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'target_translations_%'
      ORDER BY table_name
    `);

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       АНАЛИЗ ТАБЛИЦ ПЕРЕВОДОВ                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const pairs = new Set();
    const byTargetLang = {};

    result.rows.forEach(row => {
      const tableName = row.table_name;

      // Parse table name: target_translations_<target>_from_<source>
      // or target_translations_<target> (legacy, probably from English)

      if (tableName.includes('_from_')) {
        const match = tableName.match(/target_translations_([a-z]+)_from_([a-z]+)/);
        if (match) {
          const targetLang = langNames[match[1]];
          const sourceLang = langNames[match[2]];

          if (targetLang && sourceLang) {
            const pair = [sourceLang, targetLang].sort().join('-');
            pairs.add(pair);

            if (!byTargetLang[targetLang]) {
              byTargetLang[targetLang] = [];
            }
            byTargetLang[targetLang].push(sourceLang);
          }
        }
      } else {
        // Legacy format: target_translations_<target> (assumed from English)
        const match = tableName.match(/target_translations_([a-z]+)$/);
        if (match) {
          const targetLang = langNames[match[1]];
          if (targetLang) {
            const pair = ['en', targetLang].sort().join('-');
            pairs.add(pair);

            if (!byTargetLang[targetLang]) {
              byTargetLang[targetLang] = [];
            }
            byTargetLang[targetLang].push('en');
          }
        }
      }
    });

    console.log(`📊 Всего таблиц переводов: ${result.rows.length}`);
    console.log(`🔗 Уникальных языковых пар: ${pairs.size}\n`);

    // Generate all possible pairs to compare
    const codes = Object.values(langCodes).filter((v, i, a) => a.indexOf(v) === i);
    const allPossiblePairs = [];
    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        allPossiblePairs.push(`${codes[i]}-${codes[j]}`);
      }
    }

    console.log('═'.repeat(65));
    console.log('\n📊 СТАТИСТИКА:\n');
    console.log(`   Всего возможных пар: ${allPossiblePairs.length}`);
    console.log(`   ✅ Есть таблицы переводов: ${pairs.size}`);
    console.log(`   ❌ Отсутствуют: ${allPossiblePairs.length - pairs.size}`);
    console.log(`   📈 Покрытие: ${((pairs.size / allPossiblePairs.length) * 100).toFixed(1)}%\n`);

    // Show by target language
    console.log('═'.repeat(65));
    console.log('\n🌍 ПОКРЫТИЕ ПО ЦЕЛЕВЫМ ЯЗЫКАМ:\n');

    const sortedTargets = Object.keys(byTargetLang).sort();
    for (const target of sortedTargets) {
      const sources = byTargetLang[target].sort();
      console.log(`${langCodes[target]} (${target}): ${sources.length} языков-источников`);
      console.log(`   Из: ${sources.map(s => langCodes[s] + ' (' + s + ')').join(', ')}\n`);
    }

    // Find missing pairs
    const pairsArray = Array.from(pairs).sort();
    const missing = allPossiblePairs.filter(p => !pairs.has(p));

    if (missing.length > 0) {
      console.log('═'.repeat(65));
      console.log(`\n❌ ОТСУТСТВУЮЩИЕ ПАРЫ (${missing.length}):\n`);

      missing.slice(0, 20).forEach((pair, idx) => {
        const [code1, code2] = pair.split('-');
        console.log(`${(idx + 1).toString().padStart(3)}. ${langCodes[code1]} ↔ ${langCodes[code2]} (${pair})`);
      });

      if (missing.length > 20) {
        console.log(`\n... и ещё ${missing.length - 20} пар\n`);
      }
    } else {
      console.log('\n🎉 ВСЕ ЯЗЫКОВЫЕ ПАРЫ ПОКРЫТЫ!\n');
    }

    console.log('');

  } catch (error) {
    console.error('Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

analyzeTranslationTables();
