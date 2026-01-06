const fs = require('fs');

function analyzeThemeFile(filename) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📁 ${filename}`);
  console.log('='.repeat(60));

  try {
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    console.log(`\n📊 Всего записей: ${data.length}`);

    // Подсчет по темам
    const themeCount = {};
    data.forEach(item => {
      const theme = item.theme || 'unknown';
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });

    console.log(`\n🎨 Уникальных тем: ${Object.keys(themeCount).length}`);
    console.log('\nРаспределение по темам:');

    const sorted = Object.entries(themeCount).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([theme, count]) => {
      console.log(`   ${theme}: ${count} слов`);
    });

    // Проверка на дубликаты и синтетические данные
    const words = data.map(item => item.word);
    const uniqueWords = new Set(words);
    console.log(`\n🔍 Уникальных слов: ${uniqueWords.size} (из ${data.length})`);

    if (uniqueWords.size < data.length) {
      console.log(`   ⚠️  ВНИМАНИЕ: Есть дубликаты! (${data.length - uniqueWords.size} дубликатов)`);
    }

    // Проверка на синтетические слова (содержат "_")
    const syntheticWords = words.filter(w => w.includes('_'));
    if (syntheticWords.length > 0) {
      console.log(`   ⚠️  ВНИМАНИЕ: ${syntheticWords.length} синтетических слов (содержат "_")`);
      console.log(`   Примеры: ${syntheticWords.slice(0, 3).join(', ')}`);
    }

  } catch (error) {
    console.log(`   ❌ Ошибка: ${error.message}`);
  }
}

// Проверяем оба файла
['themes-japanese-all.json', 'themes-hindi-all.json'].forEach(analyzeThemeFile);
