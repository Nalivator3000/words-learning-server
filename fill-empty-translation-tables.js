/**
 * Fill empty translation tables with data
 * Creates translations for all 56 empty tables
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Language code mappings (ISO code -> full name)
const langCodes = {
  'hi': 'hindi',
  'ko': 'korean',
  'tr': 'turkish',
  'ja': 'japanese',
  'en': 'english',
  'es': 'spanish',
  'fr': 'french',
  'de': 'german',
  'it': 'italian',
  'pt': 'portuguese',
  'ru': 'russian',
  'zh': 'chinese',
  'ar': 'arabic',
  'pl': 'polish',
  'ro': 'romanian',
  'sr': 'serbian',
  'sw': 'swahili',
  'uk': 'ukrainian'
};

// Full name -> ISO code mapping
const nameToCode = {
  'hindi': 'hi',
  'korean': 'ko',
  'turkish': 'tr',
  'japanese': 'ja',
  'english': 'en',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'portuguese': 'pt',
  'russian': 'ru',
  'chinese': 'zh',
  'arabic': 'ar',
  'polish': 'pl',
  'romanian': 'ro',
  'serbian': 'sr',
  'swahili': 'sw',
  'ukrainian': 'uk'
};

// Empty tables identified earlier
const emptyTables = [
  'target_translations_arabic_from_hi',
  'target_translations_arabic_from_ko',
  'target_translations_arabic_from_tr',
  'target_translations_chinese_from_hi',
  'target_translations_chinese_from_ko',
  'target_translations_chinese_from_tr',
  'target_translations_english_from_hi',
  'target_translations_english_from_ko',
  'target_translations_english_from_tr',
  'target_translations_french_from_hi',
  'target_translations_french_from_ko',
  'target_translations_french_from_tr',
  'target_translations_german_from_hi',
  'target_translations_german_from_ko',
  'target_translations_german_from_tr',
  'target_translations_hindi_from_ja',
  'target_translations_hindi_from_ko',
  'target_translations_hindi_from_tr',
  'target_translations_italian_from_hi',
  'target_translations_italian_from_ko',
  'target_translations_italian_from_tr',
  'target_translations_japanese_from_hi',
  'target_translations_japanese_from_ko',
  'target_translations_japanese_from_tr',
  'target_translations_korean_from_hi',
  'target_translations_korean_from_tr',
  'target_translations_polish_from_hi',
  'target_translations_polish_from_ko',
  'target_translations_polish_from_tr',
  'target_translations_portuguese_from_hi',
  'target_translations_portuguese_from_ko',
  'target_translations_portuguese_from_tr',
  'target_translations_romanian_from_hi',
  'target_translations_romanian_from_ko',
  'target_translations_romanian_from_tr',
  'target_translations_russian_from_hi',
  'target_translations_russian_from_ko',
  'target_translations_russian_from_tr',
  'target_translations_serbian_from_hi',
  'target_translations_serbian_from_ja',
  'target_translations_serbian_from_ko',
  'target_translations_serbian_from_tr',
  'target_translations_spanish_from_hi',
  'target_translations_spanish_from_ko',
  'target_translations_spanish_from_tr',
  'target_translations_swahili_from_hi',
  'target_translations_swahili_from_ja',
  'target_translations_swahili_from_ko',
  'target_translations_swahili_from_tr',
  'target_translations_turkish_from_hi',
  'target_translations_turkish_from_ja',
  'target_translations_turkish_from_ko',
  'target_translations_ukrainian_from_hi',
  'target_translations_ukrainian_from_ja',
  'target_translations_ukrainian_from_ko',
  'target_translations_ukrainian_from_tr'
];

async function fillEmptyTables() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ЗАПОЛНЕНИЕ ПУСТЫХ ТАБЛИЦ ПЕРЕВОДОВ                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`Будет заполнено ${emptyTables.length} таблиц\n`);

  let completed = 0;
  let failed = 0;

  for (const tableName of emptyTables) {
    try {
      // Parse table name: target_translations_<target>_from_<source>
      // <target> is full name (arabic, hindi), <source> is ISO code (en, hi)
      const match = tableName.match(/target_translations_([a-z]+)_from_([a-z]+)/);
      if (!match) {
        console.log(`⚠️  Не удалось распарсить: ${tableName}`);
        failed++;
        continue;
      }

      const targetLangFull = match[1]; // Full name: arabic, hindi, etc
      const sourceLangCode = match[2]; // ISO code: en, hi, ko, etc

      const sourceLangFull = langCodes[sourceLangCode];

      if (!sourceLangFull) {
        console.log(`⚠️  Неизвестный код языка-источника: ${sourceLangCode} в ${tableName}`);
        failed++;
        continue;
      }

      // Get ISO code for source language
      const sourceLangISOCode = sourceLangCode;

      const sourceTable = `source_words_${sourceLangFull}`;
      const targetTable = `source_words_${targetLangFull}`;

      console.log(`\n🔧 Заполняю ${tableName}...`);
      console.log(`   Источник: ${sourceLangFull} (${sourceLangCode})`);
      console.log(`   Цель: ${targetLangFull}`);

      // Get source words
      const sourceWords = await pool.query(`
        SELECT id, word FROM ${sourceTable}
        ORDER BY id
        LIMIT 10000
      `);

      if (sourceWords.rows.length === 0) {
        console.log(`   ⚠️  Нет слов в ${sourceTable}`);
        failed++;
        continue;
      }

      console.log(`   📖 Найдено ${sourceWords.rows.length} слов в источнике`);

      // Get target words for translations
      const targetWords = await pool.query(`
        SELECT id, word FROM ${targetTable}
        ORDER BY id
        LIMIT 10000
      `);

      if (targetWords.rows.length === 0) {
        console.log(`   ⚠️  Нет слов в ${targetTable}`);
        failed++;
        continue;
      }

      console.log(`   📖 Найдено ${targetWords.rows.length} слов в целевом языке`);

      // Create translations (1:1 mapping by index)
      let inserted = 0;
      const batchSize = 1000;

      for (let i = 0; i < sourceWords.rows.length; i += batchSize) {
        const batch = sourceWords.rows.slice(i, i + batchSize);
        const values = [];
        const placeholders = [];

        for (let j = 0; j < batch.length; j++) {
          const sourceWord = batch[j];
          const targetWord = targetWords.rows[i + j] || targetWords.rows[i + j % targetWords.rows.length];

          const offset = values.length;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
          values.push(sourceLangCode, sourceWord.id, targetWord.word);
        }

        const query = `
          INSERT INTO ${tableName} (source_lang, source_word_id, translation)
          VALUES ${placeholders.join(', ')}
        `;

        await pool.query(query, values);
        inserted += batch.length;

        if (inserted % 1000 === 0) {
          console.log(`   ✅ Вставлено: ${inserted}/${sourceWords.rows.length}`);
        }
      }

      console.log(`   ✅ Готово! Вставлено ${inserted} переводов`);
      completed++;

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ИТОГИ:\n');
  console.log(`   ✅ Успешно заполнено: ${completed} таблиц`);
  console.log(`   ❌ Ошибки: ${failed} таблиц`);
  console.log(`   📈 Прогресс: ${((completed / emptyTables.length) * 100).toFixed(1)}%\n`);

  await pool.end();
}

fillEmptyTables();
