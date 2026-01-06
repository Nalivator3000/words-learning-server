// Прямой индексный файл для обработки Hindi слов
const fs = require('fs');
const path = require('path');

function main() {
  const inputFile = path.join(__dirname, 'hindi-words-for-themes.txt');
  const outputFile = path.join(__dirname, 'themes-hindi-all.json');

  // Минимум ключевых слов
  const keywords = {
    family: ['पिता', 'माता', 'भाई', 'बहन', 'पुत्र', 'पुत्री', 'दादा', 'दादी', 'माँ', 'पापा', 'पति', 'पत्नी', 'शादी', 'परिवार'],
    food: ['खाना', 'भोजन', 'रोटी', 'चावल', 'दाल', 'सब्जी', 'फल', 'मीठा', 'लस्सी', 'चाय', 'पानी', 'दूध', 'शरबत', 'खीर', 'हलवा'],
    travel: ['यात्रा', 'सफर', 'मंदिर', 'बाजार', 'सड़क', 'रेल', 'गाड़ी', 'समुद्र', 'पहाड़', 'गाँव', 'शहर', 'देश'],
    home: ['घर', 'मकान', 'कमरा', 'दरवाज़ा', 'खिड़की', 'छत', 'घंटी', 'बैठक', 'रसोई', 'बिस्तर', 'कुर्सी', 'मेज', 'दीवार', 'फर्श'],
    health: ['रोगी', 'रोग', 'स्वास्थ्य', 'वैद्य', 'दवा', 'औषधि', 'सिर', 'पैर', 'हाथ', 'आँख', 'दाँत', 'कान', 'नाक', 'बीमार', 'दर्द'],
    work: ['काम', 'नौकरी', 'किसान', 'कामकार', 'कर्मचारी', 'दफ्तर', 'व्यापार', 'व्यापारी', 'कारखाना'],
    education: ['शिक्षा', 'विद्या', 'पाठशाला', 'गुरु', 'छात्र', 'पुस्तक', 'लिखा', 'पढ़ाई', 'ज्ञान', 'बुद्धि', 'परीक्षा', 'अध्यापक'],
    nature: ['प्रकृति', 'वन', 'पेड़', 'पौधा', 'फल', 'फूल', 'पत्ता', 'नदी', 'झरना', 'तालाब', 'सरोवर', 'मिट्टी', 'रेत', 'पत्थर', 'आकाश'],
    weather: ['मौसम', 'गर्मी', 'ठंड', 'बारिश', 'बादल', 'बिजली', 'गर्जन', 'पवन', 'हवा', 'आंधी', 'तूफान', 'धूप', 'छाया'],
    communication: ['बात', 'कहाँ', 'सुना', 'लिखा', 'बोली', 'वाणी', 'आवाज़', 'शब्द', 'भाषा', 'विचार', 'वचन', 'सुनना', 'कहना', 'बोल'],
    culture: ['संस्कृति', 'परंपरा', 'रीति', 'त्योहार', 'पूजा', 'इबादत', 'देवी', 'देवता', 'अवतार', 'कथा', 'इतिहास', 'साहित्य', 'कला', 'संगीत'],
    emotions: ['भाव', 'भावना', 'अनुभव', 'खुशी', 'दुख', 'गुस्सा', 'भय', 'नींद', 'प्यार', 'ममता', 'शर्म', 'गर्व', 'मान'],
    sports: ['खेल', 'खिलाड़ी', 'दौड़', 'कूद', 'पकड़', 'फेंका', 'मारा', 'मैदान', 'जीत', 'हार', 'ताकत', 'शक्ति'],
    technology: ['यंत्र', 'उपकरण', 'लोहा', 'तत्व', 'धातु', 'तकनीक', 'विद्या', 'विद्युत', 'शक्ति', 'कंप्यूटर', 'फोन'],
    time: ['समय', 'घड़ी', 'दिन', 'रात', 'सुबह', 'शाम', 'प्रभात', 'कल', 'आज', 'अब', 'फिर', 'बाद', 'पहले'],
    numbers: ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छः', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तीस', 'चालीस', 'पचास', 'सौ'],
    colors: ['रंग', 'लाल', 'पीला', 'नीला', 'हरा', 'सफेद', 'काला', 'भूरा', 'ग्रे', 'गुलाबी'],
    clothing: ['कपड़ा', 'वस्त्र', 'जामा', 'पैंट', 'शर्ट', 'साड़ी', 'दुपट्टा', 'जूती', 'जूता', 'टोपी', 'हार'],
    shopping: ['बाजार', 'दुकान', 'व्यापार', 'कीमत', 'दाम', 'खरीद', 'बिक्री', 'व्यापारी', 'पैसा', 'रुपया']
  };

  function getBaseWord(w) {
    const m = w.match(/^(.+?)(?:_\d+_[A-Z]+)?$/);
    return m ? m[1] : w;
  }

  function getTheme(w) {
    const b = getBaseWord(w);
    const themes = Object.keys(keywords);

    for (const t of themes) {
      if (keywords[t].includes(b)) return t;
    }

    for (const t of themes) {
      for (const kw of keywords[t]) {
        if (kw.includes(b) || b.includes(kw)) return t;
      }
    }

    let h = 0;
    for (let i = 0; i < b.length; i++) h = h * 31 + b.charCodeAt(i);
    return themes[((h % themes.length) + themes.length) % themes.length];
  }

  console.time('Обработка');
  const data = fs.readFileSync(inputFile, 'utf-8').split('\n').map(x => x.trim()).filter(x => x);
  const seen = new Set();
  const res = [];
  const cnt = {};
  Object.keys(keywords).forEach(t => cnt[t] = 0);

  for (const w of data) {
    const b = getBaseWord(w);
    if (!seen.has(b)) {
      seen.add(b);
      const t = getTheme(w);
      res.push({ word: b, theme: t });
      cnt[t]++;
      if (seen.size % 2000 === 0) console.log(`Обработано: ${seen.size}...`);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(res, null, 2), 'utf-8');

  console.log(`\nВсего: ${res.length} слов`);
  const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  for (const [t, c] of sorted) {
    console.log(`${t}: ${c} (${(c/res.length*100).toFixed(1)}%)`);
  }
  console.log(`Результат: ${outputFile}`);
  console.timeEnd('Обработка');
}

if (require.main === module) {
  main();
}

module.exports = { main };
