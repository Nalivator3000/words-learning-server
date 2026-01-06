const fs = require('fs');

// Быстрая обработка файла с Hindi словами
const inputFile = 'c:\\Users\\Nalivator3000\\words-learning-server\\hindi-words-for-themes.txt';
const outputFile = 'c:\\Users\\Nalivator3000\\words-learning-server\\themes-hindi-all.json';

// Ключевые слова (минимальный набор для быстрой обработки)
const themeKeywords = {
  family: ['पिता', 'माता', 'भाई', 'बहन', 'पुत्र', 'पुत्री', 'दादा', 'दादी', 'माँ', 'पापा', 'पति', 'पत्नी'],
  food: ['खाना', 'भोजन', 'रोटी', 'चावल', 'दाल', 'सब्जी', 'फल', 'मीठा', 'चाय', 'पानी', 'दूध'],
  travel: ['यात्रा', 'सफर', 'मंदिर', 'बाजार', 'सड़क', 'रेल', 'गाड़ी', 'समुद्र', 'पहाड़', 'गाँव', 'शहर'],
  home: ['घर', 'मकान', 'कमरा', 'दरवाज़ा', 'खिड़की', 'छत', 'बैठक', 'रसोई', 'बिस्तर', 'कुर्सी', 'मेज'],
  health: ['रोग', 'स्वास्थ्य', 'वैद्य', 'दवा', 'सिर', 'पैर', 'हाथ', 'आँख', 'दाँत', 'बीमार', 'दर्द'],
  work: ['काम', 'नौकरी', 'किसान', 'कामकार', 'दफ्तर', 'व्यापार', 'व्यापारी'],
  education: ['शिक्षा', 'विद्या', 'पाठशाला', 'गुरु', 'छात्र', 'पुस्तक', 'पढ़ाई', 'ज्ञान', 'बुद्धि'],
  nature: ['प्रकृति', 'वन', 'पेड़', 'पौधा', 'फल', 'फूल', 'नदी', 'झरना', 'तालाब', 'मिट्टी', 'पत्थर'],
  weather: ['मौसम', 'गर्मी', 'ठंड', 'बारिश', 'बादल', 'बिजली', 'पवन', 'हवा', 'धूप'],
  communication: ['बात', 'सुना', 'लिखा', 'बोली', 'वाणी', 'आवाज़', 'शब्द', 'भाषा'],
  culture: ['संस्कृति', 'परंपरा', 'त्योहार', 'पूजा', 'देवी', 'देवता', 'कला', 'संगीत'],
  emotions: ['भाव', 'खुशी', 'दुख', 'गुस्सा', 'भय', 'प्यार', 'ममता', 'शर्म'],
  sports: ['खेल', 'खिलाड़ी', 'दौड़', 'कूद', 'मैदान', 'जीत', 'हार'],
  technology: ['यंत्र', 'उपकरण', 'विद्युत', 'शक्ति', 'कंप्यूटर', 'फोन'],
  time: ['समय', 'घड़ी', 'दिन', 'रात', 'सुबह', 'शाम', 'कल', 'आज'],
  numbers: ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छः', 'सात', 'आठ', 'नौ', 'दस', 'बीस', 'सौ'],
  colors: ['रंग', 'लाल', 'पीला', 'नीला', 'हरा', 'सफेद', 'काला'],
  clothing: ['कपड़ा', 'वस्त्र', 'पैंट', 'शर्ट', 'साड़ी', 'जूता', 'टोपी'],
  shopping: ['बाजार', 'दुकान', 'दाम', 'खरीद', 'बिक्री', 'पैसा']
};

function extractBaseWord(word) {
  const match = word.match(/^(.+?)(?:_\d+_[A-Z]+)?$/);
  return match ? match[1] : word;
}

function getTheme(word) {
  const baseWord = extractBaseWord(word);
  const themes = Object.keys(themeKeywords);

  // Точное совпадение
  for (const t of themes) {
    if (themeKeywords[t].includes(baseWord)) {
      return t;
    }
  }

  // Частичное совпадение
  for (const t of themes) {
    for (const kw of themeKeywords[t]) {
      if (kw.includes(baseWord) || baseWord.includes(kw)) {
        return t;
      }
    }
  }

  // Распределение по хешу
  let h = 0;
  for (let i = 0; i < baseWord.length; i++) {
    h = ((h << 5) - h) + baseWord.charCodeAt(i);
  }
  return themes[Math.abs(h) % themes.length];
}

try {
  console.time('Обработка');
  console.log('Чтение файла...');

  const content = fs.readFileSync(inputFile, 'utf-8');
  const words = content.split('\n').map(w => w.trim()).filter(w => w);

  console.log(`Всего строк: ${words.length}`);

  const seen = new Set();
  const result = [];
  const counts = Object.fromEntries(Object.keys(themeKeywords).map(t => [t, 0]));

  for (const word of words) {
    const base = extractBaseWord(word);
    if (!seen.has(base)) {
      seen.add(base);
      const theme = getTheme(word);
      result.push({ word: base, theme });
      counts[theme]++;

      if (seen.size % 2000 === 0) {
        console.log(`Обработано: ${seen.size}...`);
      }
    }
  }

  console.log(`Всего уникальных: ${result.length}`);

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');

  console.log('\nРаспределение по темам:');
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (const [theme, count] of sorted) {
    const pct = ((count / result.length) * 100).toFixed(1);
    console.log(`  ${theme}: ${count} (${pct}%)`);
  }

  console.log(`\nСохранено в: ${outputFile}`);
  console.timeEnd('Обработка');

} catch (err) {
  console.error('Ошибка:', err.message);
  process.exit(1);
}
