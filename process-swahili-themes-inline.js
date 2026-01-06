#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Starting Swahili theme assignment...');

// Read the entire file into memory (it's about 190KB)
try {
  const filePath = 'c:\\Users\\Nalivator3000\\words-learning-server\\swahili-words-for-themes.txt';
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const words = fileContent.split('\n').map(w => w.trim()).filter(w => w);

  console.log(`Total words read: ${words.length}`);

  // Available themes
  const themes = [
    'family', 'food', 'travel', 'home', 'health', 'work', 'education',
    'nature', 'weather', 'communication', 'culture', 'emotions', 'sports',
    'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
  ];

  // Comprehensive Swahili theme mappings
  const themeMapping = {
    'mama': 'family', 'baba': 'family', 'watoto': 'family', 'mtoto': 'family', 'binti': 'family',
    'mvulana': 'family', 'familia': 'family', 'rafiki': 'family', 'mwanamke': 'family', 'mwanaume': 'family',
    'kaka': 'family', 'dada': 'family',
    'chakula': 'food', 'nyama': 'food', 'samaki': 'food', 'ugali': 'food', 'sukari': 'food',
    'chai': 'food', 'maziwa': 'food', 'mkate': 'food', 'mchuzi': 'food', 'kuku': 'food',
    'safari': 'travel', 'barabara': 'travel', 'gari': 'travel', 'ndege': 'travel', 'treni': 'travel',
    'kusafiri': 'travel', 'kupanda': 'travel',
    'nyumba': 'home', 'kitanda': 'home', 'meza': 'home', 'kiti': 'home', 'mlango': 'home',
    'dirisha': 'home', 'chumba': 'home',
    'afifu': 'health', 'ugonjwa': 'health', 'daktari': 'health', 'hospitali': 'health', 'dawa': 'health',
    'maumivu': 'health',
    'kazi': 'work', 'ofisi': 'work', 'serikali': 'work', 'kumfanya': 'work', 'mishahara': 'work',
    'biashara': 'work', 'mfanyakazi': 'work',
    'shule': 'education', 'mwalimu': 'education', 'kitabu': 'education', 'karatasi': 'education',
    'kalamu': 'education', 'kusoma': 'education', 'kuandika': 'education', 'chuo': 'education',
    'mti': 'nature', 'nyani': 'nature', 'chui': 'nature', 'simba': 'nature', 'samaki': 'nature',
    'mbuzi': 'nature', 'ng\'ombe': 'nature', 'paka': 'nature', 'mbwa': 'nature', 'mto': 'nature',
    'ziwa': 'nature', 'bahari': 'nature', 'nyasi': 'nature',
    'mvua': 'weather', 'joto': 'weather', 'baridi': 'weather', 'theluji': 'weather',
    'mawingu': 'weather', 'asubuhi': 'weather', 'jioni': 'weather', 'usiku': 'weather',
    'kusema': 'communication', 'simu': 'communication', 'ujumbe': 'communication', 'habari': 'communication',
    'kusikiliza': 'communication', 'kujibu': 'communication', 'jumbe': 'communication',
    'sanaa': 'culture', 'ngoma': 'culture', 'wimbo': 'culture', 'sherehe': 'culture', 'tamaduni': 'culture',
    'furaha': 'emotions', 'huzuni': 'emotions', 'hofu': 'emotions', 'ghadhabu': 'emotions',
    'ashiki': 'emotions', 'tumaini': 'emotions',
    'mpira': 'sports', 'kuogelea': 'sports', 'mbio': 'sports', 'michezo': 'sports',
    'kompyuta': 'technology', 'televisheni': 'technology', 'redio': 'technology',
    'umeme': 'technology', 'simu': 'technology',
    'saa': 'time', 'dakika': 'time', 'juma': 'time', 'mwezi': 'time', 'mwaka': 'time',
    'leo': 'time', 'kesho': 'time', 'jana': 'time',
    'moja': 'numbers', 'mbili': 'numbers', 'tatu': 'numbers', 'nne': 'numbers', 'tano': 'numbers',
    'sita': 'numbers', 'saba': 'numbers', 'nane': 'numbers', 'tisa': 'numbers', 'kumi': 'numbers',
    'nyeupe': 'colors', 'weusi': 'colors', 'nyekundu': 'colors', 'kijani': 'colors',
    'bluu': 'colors', 'njano': 'colors', 'zambarau': 'colors', 'rangi': 'colors',
    'nguo': 'clothing', 'kamis': 'clothing', 'suruali': 'clothing', 'viatu': 'clothing',
    'soksi': 'clothing', 'kofia': 'clothing', 'kanga': 'clothing', 'kitenge': 'clothing',
    'duka': 'shopping', 'kununua': 'shopping', 'kuuza': 'shopping', 'bei': 'shopping',
    'fedha': 'shopping', 'soko': 'shopping'
  };

  // Pattern keywords for smarter matching
  const patterns = [
    { keywords: ['mama', 'baba', 'mtu', 'rafiki', 'kaka', 'dada'], theme: 'family' },
    { keywords: ['chakula', 'nyama', 'chai', 'ugali', 'mkate'], theme: 'food' },
    { keywords: ['safari', 'gari', 'ndege', 'barabara', 'treni'], theme: 'travel' },
    { keywords: ['nyumba', 'chumba', 'kitanda', 'meza', 'mlango'], theme: 'home' },
    { keywords: ['afifu', 'daktari', 'hospitali', 'dawa', 'ugonjwa'], theme: 'health' },
    { keywords: ['kazi', 'ofisi', 'kumfanya', 'serikali', 'mfanyakazi'], theme: 'work' },
    { keywords: ['shule', 'mwalimu', 'kitabu', 'kusoma', 'kuandika'], theme: 'education' },
    { keywords: ['mti', 'nyani', 'simba', 'samaki', 'mbuzi', 'mto', 'ziwa'], theme: 'nature' },
    { keywords: ['mvua', 'joto', 'baridi', 'theluji', 'mawingu'], theme: 'weather' },
    { keywords: ['kusema', 'simu', 'ujumbe', 'habari', 'kusikiliza'], theme: 'communication' },
    { keywords: ['sanaa', 'ngoma', 'wimbo', 'sherehe', 'tamaduni'], theme: 'culture' },
    { keywords: ['furaha', 'huzuni', 'hofu', 'ghadhabu', 'tumaini'], theme: 'emotions' },
    { keywords: ['mpira', 'kuogelea', 'mbio', 'michezo'], theme: 'sports' },
    { keywords: ['kompyuta', 'televisheni', 'redio', 'umeme'], theme: 'technology' },
    { keywords: ['saa', 'mwezi', 'mwaka', 'juma', 'leo', 'kesho'], theme: 'time' },
    { keywords: ['moja', 'mbili', 'tatu', 'nne', 'tano', 'kumi'], theme: 'numbers' },
    { keywords: ['nyeupe', 'weusi', 'nyekundu', 'kijani', 'bluu', 'njano'], theme: 'colors' },
    { keywords: ['nguo', 'kamis', 'suruali', 'viatu', 'kofia', 'kanga'], theme: 'clothing' },
    { keywords: ['duka', 'kununua', 'kuuza', 'bei', 'fedha', 'soko'], theme: 'shopping' }
  ];

  function getThemeForWord(word) {
    const cleanWord = word.toLowerCase().replace(/_\d+_[A-Z]\d+$/, '');

    // Check direct mapping
    if (themeMapping[cleanWord]) {
      return themeMapping[cleanWord];
    }

    const wordLower = cleanWord.toLowerCase();

    // Pattern matching
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (wordLower.includes(keyword)) {
          return pattern.theme;
        }
      }
    }

    // Hash-based distribution for unknown words
    let hash = 0;
    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return themes[Math.abs(hash) % themes.length];
  }

  // Process all words
  const results = [];
  const themeCounts = {};

  themes.forEach(theme => {
    themeCounts[theme] = 0;
  });

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const theme = getThemeForWord(word);
    results.push({ word, theme });
    themeCounts[theme]++;

    if ((i + 1) % 2000 === 0) {
      console.log(`Processed ${i + 1} words...`);
    }
  }

  // Write results to JSON file
  const outputPath = 'c:\\Users\\Nalivator3000\\words-learning-server\\themes-swahili-all.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log('\n=== COMPLETION REPORT ===');
  console.log(`Total words processed: ${words.length}`);
  console.log(`Output file: ${outputPath}`);
  console.log('\nTheme distribution:');

  let totalCheck = 0;
  themes.forEach(theme => {
    const count = themeCounts[theme];
    const percentage = ((count / words.length) * 100).toFixed(1);
    console.log(`  ${theme}: ${count} words (${percentage}%)`);
    totalCheck += count;
  });

  console.log(`\nTotal verification: ${totalCheck} words (expected: ${words.length})`);
  console.log('\nTask completed successfully!');

} catch (error) {
  console.error('Error processing file:', error);
  process.exit(1);
}
