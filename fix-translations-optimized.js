/**
 * Optimized version: Fix translations using SQL JOINs instead of loops
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const tablesToFix = [
  { table: 'target_translations_italian_from_hi', target: 'italian', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_italian_from_ko', target: 'italian', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_italian_from_tr', target: 'italian', sourceCode: 'tr', source: 'turkish' },
  { table: 'target_translations_japanese_from_hi', target: 'japanese', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_japanese_from_ko', target: 'japanese', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_japanese_from_tr', target: 'japanese', sourceCode: 'tr', source: 'turkish' },
  { table: 'target_translations_korean_from_hi', target: 'korean', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_korean_from_tr', target: 'korean', sourceCode: 'tr', source: 'turkish' },
  { table: 'target_translations_portuguese_from_hi', target: 'portuguese', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_portuguese_from_ko', target: 'portuguese', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_portuguese_from_tr', target: 'portuguese', sourceCode: 'tr', source: 'turkish' },
  { table: 'target_translations_russian_from_hi', target: 'russian', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_russian_from_ko', target: 'russian', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_russian_from_tr', target: 'russian', sourceCode: 'tr', source: 'turkish' },
  { table: 'target_translations_serbian_from_hi', target: 'serbian', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_serbian_from_ja', target: 'serbian', sourceCode: 'ja', source: 'japanese' },
  { table: 'target_translations_serbian_from_ko', target: 'serbian', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_serbian_from_tr', target: 'serbian', sourceCode: 'tr', source: 'turkish' },
  { table: 'target_translations_turkish_from_hi', target: 'turkish', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_turkish_from_ja', target: 'turkish', sourceCode: 'ja', source: 'japanese' },
  { table: 'target_translations_turkish_from_ko', target: 'turkish', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_ukrainian_from_hi', target: 'ukrainian', sourceCode: 'hi', source: 'hindi' },
  { table: 'target_translations_ukrainian_from_ja', target: 'ukrainian', sourceCode: 'ja', source: 'japanese' },
  { table: 'target_translations_ukrainian_from_ko', target: 'ukrainian', sourceCode: 'ko', source: 'korean' },
  { table: 'target_translations_ukrainian_from_tr', target: 'ukrainian', sourceCode: 'tr', source: 'turkish' }
];

async function fixOptimized() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ИСПРАВЛЕНИЕ ПЕРЕВОДОВ (ОПТИМИЗИРОВАНО)                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('Шаг 1: Удаление неправильных данных...\n');

  for (const { table } of tablesToFix) {
    try {
      const result = await pool.query(`DELETE FROM ${table}`);
      console.log(`✅ ${table}: ${result.rowCount} записей удалено`);
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(65));
  console.log('\nШаг 2: Заполнение правильными переводами (через SQL JOIN)...\n');

  let success = 0;
  let failed = 0;

  for (const { table, target, sourceCode, source } of tablesToFix) {
    try {
      console.log(`\n🔧 ${table}...`);
      console.log(`   ${source} → English → ${target}`);

      // One big SQL query with JOINs instead of loops!
      const query = `
        INSERT INTO ${table} (source_lang, source_word_id, translation)
        SELECT
          $1,
          sw.id,
          tt.translation
        FROM source_words_${source} sw
        INNER JOIN target_translations_english_from_${sourceCode} te1 ON te1.source_word_id = sw.id
        INNER JOIN source_words_english se ON LOWER(se.word) = LOWER(te1.translation)
        INNER JOIN target_translations_${target}_from_en tt ON tt.source_word_id = se.id
        WHERE tt.translation IS NOT NULL
        ON CONFLICT (source_word_id) DO NOTHING
      `;

      const result = await pool.query(query, [sourceCode]);
      console.log(`   ✅ Вставлено ${result.rowCount} переводов`);
      success++;

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ИТОГИ:\n');
  console.log(`   ✅ Успешно: ${success} таблиц`);
  console.log(`   ❌ Ошибки: ${failed} таблиц\n`);

  await pool.end();
}

fixOptimized();
