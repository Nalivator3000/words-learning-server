/**
 * Comprehensive quality check for all vocabularies and translations
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

async function comprehensiveCheck() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       КОМПЛЕКСНАЯ ПРОВЕРКА КАЧЕСТВА ДАННЫХ                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const results = {
    vocabularies: [],
    translations: [],
    issues: []
  };

  // 1. Check source vocabularies
  console.log('📊 ШАГ 1: Проверка словарей source_words_*\n');

  for (const lang of languages) {
    const table = `source_words_${lang}`;

    try {
      // Total count
      const total = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(total.rows[0].count);

      // Check for NULL or empty words
      const nullWords = await pool.query(`
        SELECT COUNT(*) as count FROM ${table}
        WHERE word IS NULL OR word = '' OR TRIM(word) = ''
      `);
      const nullCount = parseInt(nullWords.rows[0].count);

      // Check for placeholders
      const placeholders = await pool.query(`
        SELECT COUNT(*) as count FROM ${table}
        WHERE word LIKE '%placeholder%'
           OR word LIKE '%PLACEHOLDER%'
           OR word LIKE '%synthetic%'
           OR word LIKE '%SYNTHETIC%'
      `);
      const placeholderCount = parseInt(placeholders.rows[0].count);

      // Check for duplicates
      const duplicates = await pool.query(`
        SELECT COUNT(*) as dup_count
        FROM (
          SELECT word, COUNT(*) as count
          FROM ${table}
          GROUP BY word
          HAVING COUNT(*) > 1
        ) t
      `);
      const dupCount = parseInt(duplicates.rows[0].dup_count);

      // Check level distribution
      const levelDist = await pool.query(`
        SELECT level, COUNT(*) as count
        FROM ${table}
        GROUP BY level
        ORDER BY level
      `);

      const status = {
        language: lang,
        total: count,
        nullWords: nullCount,
        placeholders: placeholderCount,
        duplicates: dupCount,
        levels: levelDist.rows,
        ok: count >= 8000 && nullCount === 0 && placeholderCount === 0
      };

      results.vocabularies.push(status);

      const icon = status.ok ? '✅' : '⚠️';
      console.log(`${icon} ${lang.padEnd(12)}: ${count.toString().padStart(5)} слов | null: ${nullCount} | placeholders: ${placeholderCount} | дубликаты: ${dupCount}`);

      if (!status.ok) {
        results.issues.push(`${lang}: проблемы с качеством словаря`);
      }

    } catch (error) {
      console.log(`❌ ${lang.padEnd(12)}: ${error.message}`);
      results.issues.push(`${lang}: ошибка при проверке`);
    }
  }

  // 2. Check translation tables
  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ШАГ 2: Проверка таблиц переводов\n');

  const translationTables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE 'target_translations_%_from_%'
    ORDER BY table_name
  `);

  let filledTables = 0;
  let emptyTables = 0;
  const emptyTablesList = [];

  for (const row of translationTables.rows) {
    const tableName = row.table_name;

    try {
      const count = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const recordCount = parseInt(count.rows[0].count);

      if (recordCount > 0) {
        filledTables++;
      } else {
        emptyTables++;
        emptyTablesList.push(tableName);
      }
    } catch (error) {
      results.issues.push(`${tableName}: ошибка при проверке`);
    }
  }

  console.log(`✅ Заполнено таблиц: ${filledTables}/${translationTables.rows.length}`);
  console.log(`❌ Пустых таблиц: ${emptyTables}`);

  if (emptyTables > 0) {
    console.log('\nПустые таблицы:');
    emptyTablesList.forEach(t => console.log(`  - ${t}`));
    results.issues.push(`${emptyTables} пустых таблиц переводов`);
  }

  // 3. Check translation quality (sample)
  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ШАГ 3: Проверка качества переводов (выборочно)\n');

  const sampleTables = [
    'target_translations_russian_from_en',
    'target_translations_italian_from_hi',
    'target_translations_spanish_from_ko'
  ];

  for (const table of sampleTables) {
    try {
      // Check for NULL translations
      const nullTranslations = await pool.query(`
        SELECT COUNT(*) as count FROM ${table}
        WHERE translation IS NULL OR translation = ''
      `);
      const nullCount = parseInt(nullTranslations.rows[0].count);

      // Get sample translations
      const sample = await pool.query(`
        SELECT translation FROM ${table}
        ORDER BY RANDOM()
        LIMIT 5
      `);

      const translations = sample.rows.map(r => r.translation).join(', ');

      const icon = nullCount === 0 ? '✅' : '⚠️';
      console.log(`${icon} ${table}`);
      console.log(`   NULL переводов: ${nullCount}`);
      console.log(`   Примеры: ${translations}\n`);

      if (nullCount > 0) {
        results.issues.push(`${table}: ${nullCount} NULL переводов`);
      }

    } catch (error) {
      console.log(`❌ ${table}: ${error.message}\n`);
    }
  }

  // 4. Check word sets
  console.log('═'.repeat(65));
  console.log('\n📊 ШАГ 4: Проверка word_sets\n');

  for (const lang of languages.slice(0, 5)) { // Check first 5 languages
    try {
      const sets = await pool.query(`
        SELECT COUNT(*) as count
        FROM word_sets
        WHERE language = $1
      `, [lang]);

      const count = parseInt(sets.rows[0].count);
      const icon = count >= 100 ? '✅' : '⚠️';
      console.log(`${icon} ${lang.padEnd(12)}: ${count} word sets`);

      if (count < 100) {
        results.issues.push(`${lang}: недостаточно word sets (${count})`);
      }

    } catch (error) {
      console.log(`❌ ${lang.padEnd(12)}: ${error.message}`);
    }
  }

  // Final summary
  console.log('\n' + '═'.repeat(65));
  console.log('\n📊 ИТОГОВЫЙ ОТЧЁТ:\n');

  const vocabOK = results.vocabularies.filter(v => v.ok).length;
  const vocabTotal = results.vocabularies.length;

  console.log(`Словари (source_words):`);
  console.log(`  ✅ Качественные: ${vocabOK}/${vocabTotal}`);
  console.log(`  ⚠️  С проблемами: ${vocabTotal - vocabOK}/${vocabTotal}\n`);

  console.log(`Таблицы переводов:`);
  console.log(`  ✅ Заполнено: ${filledTables}/${translationTables.rows.length}`);
  console.log(`  ❌ Пустых: ${emptyTables}\n`);

  if (results.issues.length > 0) {
    console.log('⚠️  Обнаружены проблемы:');
    results.issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('✅ Все проверки пройдены успешно!');
  }

  console.log('');

  await pool.end();
}

comprehensiveCheck();
