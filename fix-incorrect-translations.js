/**
 * Fix incorrect translations by using English as pivot language
 * Step 1: Delete incorrect data
 * Step 2: Fill with correct translations via English
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Tables that were filled incorrectly (the 25 successful ones from previous run)
const tablesToFix = [
  'target_translations_italian_from_hi',
  'target_translations_italian_from_ko',
  'target_translations_italian_from_tr',
  'target_translations_japanese_from_hi',
  'target_translations_japanese_from_ko',
  'target_translations_japanese_from_tr',
  'target_translations_korean_from_hi',
  'target_translations_korean_from_tr',
  'target_translations_portuguese_from_hi',
  'target_translations_portuguese_from_ko',
  'target_translations_portuguese_from_tr',
  'target_translations_russian_from_hi',
  'target_translations_russian_from_ko',
  'target_translations_russian_from_tr',
  'target_translations_serbian_from_hi',
  'target_translations_serbian_from_ja',
  'target_translations_serbian_from_ko',
  'target_translations_serbian_from_tr',
  'target_translations_turkish_from_hi',
  'target_translations_turkish_from_ja',
  'target_translations_turkish_from_ko',
  'target_translations_ukrainian_from_hi',
  'target_translations_ukrainian_from_ja',
  'target_translations_ukrainian_from_ko',
  'target_translations_ukrainian_from_tr'
];

const langCodes = {
  'hi': 'hindi',
  'ko': 'korean',
  'tr': 'turkish',
  'ja': 'japanese'
};

async function fixTranslations() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ИСПРАВЛЕНИЕ НЕПРАВИЛЬНЫХ ПЕРЕВОДОВ                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('Шаг 1: Удаление неправильных данных...\n');

  let deleted = 0;
  for (const table of tablesToFix) {
    try {
      const result = await pool.query(`DELETE FROM ${table}`);
      console.log(`✅ ${table}: удалено ${result.rowCount} записей`);
      deleted += result.rowCount;
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }

  console.log(`\n📊 Удалено записей: ${deleted}\n`);
  console.log('═'.repeat(65));
  console.log('\nШаг 2: Заполнение правильными переводами через English...\n');

  let filled = 0;
  let failedTables = 0;

  for (const tableName of tablesToFix) {
    try {
      // Parse: target_translations_<target>_from_<source>
      const match = tableName.match(/target_translations_([a-z]+)_from_([a-z]+)/);
      if (!match) continue;

      const targetLang = match[1]; // italian, russian, etc
      const sourceCode = match[2]; // hi, ko, tr, ja
      const sourceLang = langCodes[sourceCode];

      if (!sourceLang) {
        console.log(`⚠️  ${tableName}: неизвестный код ${sourceCode}`);
        failedTables++;
        continue;
      }

      console.log(`\n🔧 ${tableName}...`);
      console.log(`   ${sourceLang} → english → ${targetLang}`);

      // Get source words and their English translations
      const sourceToEnglish = await pool.query(`
        SELECT sw.id as source_id, sw.word as source_word, te.translation as english_translation
        FROM source_words_${sourceLang} sw
        LEFT JOIN target_translations_english_from_${sourceCode} te ON te.source_word_id = sw.id
        WHERE te.translation IS NOT NULL
        ORDER BY sw.id
        LIMIT 10000
      `);

      console.log(`   📖 Найдено ${sourceToEnglish.rows.length} слов с переводами на English`);

      if (sourceToEnglish.rows.length === 0) {
        console.log(`   ⚠️  Нет переводов ${sourceLang}→English`);
        failedTables++;
        continue;
      }

      // For each source word, find its translation via English
      let inserted = 0;
      const batchSize = 500;

      for (let i = 0; i < sourceToEnglish.rows.length; i += batchSize) {
        const batch = sourceToEnglish.rows.slice(i, i + batchSize);

        for (const row of batch) {
          // Find English word in source_words_english
          const englishWord = await pool.query(`
            SELECT id FROM source_words_english
            WHERE LOWER(word) = LOWER($1)
            LIMIT 1
          `, [row.english_translation]);

          if (englishWord.rows.length === 0) continue;

          const englishWordId = englishWord.rows[0].id;

          // Get translation from English to target language
          const targetTranslation = await pool.query(`
            SELECT translation FROM target_translations_${targetLang}_from_en
            WHERE source_word_id = $1
            LIMIT 1
          `, [englishWordId]);

          if (targetTranslation.rows.length === 0) continue;

          // Insert the correct translation
          await pool.query(`
            INSERT INTO ${tableName} (source_lang, source_word_id, translation)
            VALUES ($1, $2, $3)
            ON CONFLICT (source_word_id) DO NOTHING
          `, [sourceCode, row.source_id, targetTranslation.rows[0].translation]);

          inserted++;
        }

        if (inserted % 100 === 0 && inserted > 0) {
          console.log(`   ✅ Вставлено: ${inserted}`);
        }
      }

      console.log(`   ✅ Готово! Вставлено ${inserted} правильных переводов`);
      filled++;

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      failedTables++;
    }
  }

  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ИТОГИ:\n');
  console.log(`   ✅ Успешно исправлено: ${filled} таблиц`);
  console.log(`   ❌ Ошибки: ${failedTables} таблиц\n`);

  await pool.end();
}

fixTranslations();
