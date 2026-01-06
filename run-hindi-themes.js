#!/usr/bin/env node
// Этот скрипт автоматически запустится когда его потребует Node.js

const fs = require('fs');
const path = require('path');

// Определяем пути
const inputFile = path.join(__dirname, 'hindi-words-for-themes.txt');
const outputFile = path.join(__dirname, 'themes-hindi-all.json');

// Ключевые слова для тем
const themeKeywords = {
  family: ['पिता', 'माता', 'भाई', 'बहन', 'पुत्र', 'पुत्री', 'दादा', 'दादी', 'नाना', 'नानी', 'चाचा', 'चाची', 'बुआ', 'मौसी', 'पति', 'पत्नी', 'शादी', 'विवाह', 'माँ', 'पापा'],
  food: ['खाना', 'भोजन', 'रोटी', 'चावल', 'दाल', 'सब्जी', 'फल', 'मीठा', 'लस्सी', 'चाय', 'पानी', 'दूध', 'शरबत', 'थाली', 'व्यंजन', 'नाश्ता', 'खीर', 'हलवा'],
  travel: ['यात्रा', 'सफर', 'मंदिर', 'बाजार', 'सड़क', 'रेल', 'गाड़ी', 'समुद्र', 'पहाड़', 'गाँव', 'शहर', 'देश', 'आसमान', 'जमीन', 'रास्ता'],
  home: ['घर', 'मकान', 'कमरा', 'दरवाज़ा', 'खिड़की', 'छत', 'घंटी', 'बैठक', 'रसोई', 'बिस्तर', 'कुर्सी', 'मेज', 'दीवार', 'फर्श'],
  health: ['रोगी', 'रोग', 'स्वास्थ्य', 'वैद्य', 'दवा', 'औषधि', 'सिर', 'पैर', 'हाथ', 'आँख', 'दाँत', 'कान', 'नाक', 'बीमार', 'दर्द'],
  work: ['काम', 'नौकरी', 'किसान', 'कामकार', 'कर्मचारी', 'दफ्तर', 'व्यापार', 'व्यापारी', 'कारखाना'],
  education: ['शिक्षा', 'विद्या', 'पाठशाला', 'गुरु', 'छात्र', 'पुस्तक', 'पढ़ाई', 'ज्ञान', 'बुद्धि', 'परीक्षा', 'अध्यापक'],
  nature: ['प्रकृति', 'वन', 'पेड़', 'पौधा', 'फल', 'फूल', 'नदी', 'झरना', 'तालाब', 'मिट्टी', 'पत्थर', 'आकाश', 'सूरज', 'चाँद'],
  weather: ['मौसम', 'गर्मी', 'ठंड', 'बारिश', 'बादल', 'बिजली', 'पवन', 'हवा', 'आंधी', 'धूप'],
  communication: ['बात', 'सुना', 'लिखा', 'बोली', 'वाणी', 'आवाज़', 'शब्द', 'भाषा', 'कहना'],
  culture: ['संस्कृति', 'परंपरा', 'त्योहार', 'पूजा', 'देवी', 'देवता', 'कला', 'संगीत', 'नृत्य'],
  emotions: ['भाव', 'खुशी', 'दुख', 'गुस्सा', 'भय', 'प्यार', 'ममता', 'शर्म', 'गर्व'],
  sports: ['खेल', 'खिलाड़ी', 'दौड़', 'कूद', 'मैदान', 'जीत', 'हार'],
  technology: ['यंत्र', 'उपकरण', 'विद्युत', 'शक्ति', 'कंप्यूटर', 'फोन'],
  time: ['समय', 'घड़ी', 'दिन', 'रात', 'सुबह', 'शाम', 'कल', 'आज'],
  numbers: ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छः', 'सात', 'आठ', 'नौ', 'दस'],
  colors: ['रंग', 'लाल', 'पीला', 'नीला', 'हरा', 'सफेद', 'काला'],
  clothing: ['कपड़ा', 'वस्त्र', 'पैंट', 'शर्ट', 'साड़ी', 'जूता', 'टोपी'],
  shopping: ['बाजार', 'दुकान', 'दाम', 'खरीद', 'बिक्री', 'पैसा']
};

function extractBaseWord(word) {
  const match = word.match(/^(.+?)(?:_\d+_[A-Z]+)?$/);
  return match ? match[1] : word;
}

function getThemeForWord(word) {
  const baseWord = extractBaseWord(word);
  const themes = Object.keys(themeKeywords);

  for (const theme of themes) {
    if (themeKeywords[theme].includes(baseWord)) {
      return theme;
    }
  }

  for (const theme of themes) {
    for (const keyword of themeKeywords[theme]) {
      if (keyword.includes(baseWord) || baseWord.includes(keyword)) {
        return theme;
      }
    }
  }

  let hash = 0;
  for (let i = 0; i < baseWord.length; i++) {
    hash += baseWord.charCodeAt(i);
  }
  return themes[hash % themes.length];
}

// Главная функция
function processHindiThemes() {
  console.time('Processing');

  console.log('Reading Hindi words file...');
  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  console.log(`Total lines: ${lines.length}`);

  const seenBaseWords = new Set();
  const themesData = [];
  const themeCount = {};

  for (const theme of Object.keys(themeKeywords)) {
    themeCount[theme] = 0;
  }

  let processedCount = 0;

  for (const word of lines) {
    const baseWord = extractBaseWord(word);

    if (!seenBaseWords.has(baseWord)) {
      seenBaseWords.add(baseWord);
      const theme = getThemeForWord(word);
      themesData.push({ word: baseWord, theme });
      themeCount[theme]++;
      processedCount++;

      if (processedCount % 2000 === 0) {
        console.log(`Processed: ${processedCount} unique words...`);
      }
    }
  }

  console.log(`\nTotal unique words: ${themesData.length}`);

  // Save results
  fs.writeFileSync(outputFile, JSON.stringify(themesData, null, 2), 'utf-8');

  // Show statistics
  console.log('\nTheme distribution:');
  const sortedThemes = Object.entries(themeCount).sort((a, b) => b[1] - a[1]);
  for (const [theme, count] of sortedThemes) {
    const percentage = ((count / themesData.length) * 100).toFixed(1);
    console.log(`  ${theme}: ${count} words (${percentage}%)`);
  }

  console.log(`\nResults saved to: ${outputFile}`);
  console.timeEnd('Processing');
}

// Run if called directly
if (require.main === module) {
  processHindiThemes();
}

module.exports = { processHindiThemes };
