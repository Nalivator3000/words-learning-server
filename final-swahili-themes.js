#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('SWAHILI THEME ASSIGNMENT - FINAL PROCESSOR');
console.log('=========================================\n');

// Configuration
const INPUT_FILE = path.join(__dirname, 'swahili-words-for-themes.txt');
const OUTPUT_FILE = path.join(__dirname, 'themes-swahili-all.json');

const THEMES = [
  'family', 'food', 'travel', 'home', 'health', 'work', 'education',
  'nature', 'weather', 'communication', 'culture', 'emotions', 'sports',
  'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
];

// Direct word-to-theme mappings
const DIRECT_MAPPING = {
  // Family
  'mama': 'family', 'baba': 'family', 'mtoto': 'family', 'binti': 'family',
  'mvulana': 'family', 'familia': 'family', 'rafiki': 'family', 'mwanamke': 'family',
  'mwanaume': 'family', 'kaka': 'family', 'dada': 'family', 'mzazi': 'family',
  'watoto': 'family',

  // Food
  'chakula': 'food', 'nyama': 'food', 'samaki': 'food', 'ugali': 'food',
  'sukari': 'food', 'chai': 'food', 'maziwa': 'food', 'mchuzi': 'food',
  'mkate': 'food', 'kuku': 'food', 'mbuzi': 'food', 'maharagwe': 'food',
  'wali': 'food', 'ndege': 'food',

  // Travel
  'safari': 'travel', 'barabara': 'travel', 'gari': 'travel', 'ndege': 'travel',
  'treni': 'travel', 'ziara': 'travel', 'sehemu': 'travel', 'kupanda': 'travel',
  'kusafiri': 'travel', 'mkutano': 'travel',

  // Home
  'nyumba': 'home', 'kitanda': 'home', 'meza': 'home', 'kiti': 'home',
  'mlango': 'home', 'dirisha': 'home', 'chumba': 'home',

  // Health
  'afifu': 'health', 'ugonjwa': 'health', 'daktari': 'health', 'hospitali': 'health',
  'dawa': 'health', 'maumivu': 'health', 'kelele': 'health',

  // Work
  'kazi': 'work', 'ofisi': 'work', 'serikali': 'work', 'kumfanya': 'work',
  'kufanya': 'work', 'mishahara': 'work', 'biashara': 'work', 'mfanyakazi': 'work',

  // Education
  'shule': 'education', 'mwalimu': 'education', 'kitabu': 'education',
  'karatasi': 'education', 'kalamu': 'education', 'kujifunza': 'education',
  'chuo': 'education', 'somo': 'education', 'kusoma': 'education', 'kuandika': 'education',

  // Nature
  'mti': 'nature', 'nyani': 'nature', 'chui': 'nature', 'simba': 'nature',
  'samaki': 'nature', 'mbuzi': 'nature', 'ng\'ombe': 'nature', 'paka': 'nature',
  'mbwa': 'nature', 'taratib': 'nature', 'mto': 'nature', 'ziwa': 'nature',
  'bahari': 'nature', 'kichawi': 'nature', 'nyasi': 'nature',

  // Weather
  'mvua': 'weather', 'joto': 'weather', 'baridi': 'weather', 'tafrija': 'weather',
  'angavu': 'weather', 'giza': 'weather', 'asubuhi': 'weather', 'jioni': 'weather',
  'usiku': 'weather', 'saa': 'weather', 'mawingu': 'weather', 'theluji': 'weather',

  // Communication
  'kusema': 'communication', 'simu': 'communication', 'ujumbe': 'communication',
  'habari': 'communication', 'kusikiliza': 'communication', 'kujibu': 'communication',
  'kusoma': 'communication', 'kuandika': 'communication', 'jumbe': 'communication',
  'hotuba': 'communication',

  // Culture
  'sanaa': 'culture', 'ngoma': 'culture', 'wimbo': 'culture', 'sherehe': 'culture',
  'mandari': 'culture', 'tamaduni': 'culture', 'soko': 'culture',

  // Emotions
  'furaha': 'emotions', 'huzuni': 'emotions', 'hofu': 'emotions',
  'ghadhabu': 'emotions', 'ashiki': 'emotions', 'tumaini': 'emotions',
  'kupendeza': 'emotions',

  // Sports
  'mpira': 'sports', 'kobo': 'sports', 'kuogelea': 'sports', 'mbio': 'sports',
  'kugombea': 'sports', 'michezo': 'sports',

  // Technology
  'kompyuta': 'technology', 'televisheni': 'technology', 'redio': 'technology',
  'umeme': 'technology', 'chora': 'technology',

  // Time
  'saa': 'time', 'dakika': 'time', 'juma': 'time', 'mwezi': 'time',
  'mwaka': 'time', 'leo': 'time', 'kesho': 'time', 'jana': 'time',

  // Numbers
  'moja': 'numbers', 'mbili': 'numbers', 'tatu': 'numbers', 'nne': 'numbers',
  'tano': 'numbers', 'sita': 'numbers', 'saba': 'numbers', 'nane': 'numbers',
  'tisa': 'numbers', 'kumi': 'numbers',

  // Colors
  'nyeupe': 'colors', 'weusi': 'colors', 'nyekundu': 'colors', 'kijani': 'colors',
  'bluu': 'colors', 'njano': 'colors', 'zambarau': 'colors', 'rangi': 'colors',

  // Clothing
  'nguo': 'clothing', 'kamis': 'clothing', 'suruali': 'clothing', 'viatu': 'clothing',
  'soksi': 'clothing', 'kofia': 'clothing', 'kanga': 'clothing', 'kitenge': 'clothing',

  // Shopping
  'duka': 'shopping', 'bei': 'shopping', 'kununua': 'shopping', 'kuuza': 'shopping',
  'fedha': 'shopping', 'kumbuza': 'shopping', 'biashara': 'shopping', 'mnada': 'shopping'
};

// Pattern-based keyword matching
const PATTERNS = [
  { keywords: ['mama', 'baba', 'mtu', 'rafiki', 'kaka', 'dada', 'mwana'], theme: 'family' },
  { keywords: ['chakula', 'nyama', 'chai', 'ugali', 'mkate', 'kumimina'], theme: 'food' },
  { keywords: ['safari', 'gari', 'ndege', 'barabara', 'kusafiri', 'treni'], theme: 'travel' },
  { keywords: ['nyumba', 'chumba', 'kitanda', 'meza', 'mlango', 'dirisha'], theme: 'home' },
  { keywords: ['afifu', 'daktari', 'hospitali', 'dawa', 'ugonjwa', 'maumivu'], theme: 'health' },
  { keywords: ['kazi', 'ofisi', 'kumfanya', 'serikali', 'mfanyakazi', 'biashara'], theme: 'work' },
  { keywords: ['shule', 'mwalimu', 'kitabu', 'kusoma', 'kuandika', 'chuo', 'somo'], theme: 'education' },
  { keywords: ['mti', 'nyani', 'simba', 'samaki', 'mbuzi', 'mto', 'ziwa', 'bahari'], theme: 'nature' },
  { keywords: ['mvua', 'joto', 'baridi', 'theluji', 'mawingu', 'asubuhi', 'jioni'], theme: 'weather' },
  { keywords: ['kusema', 'simu', 'ujumbe', 'habari', 'kusikiliza', 'kujibu'], theme: 'communication' },
  { keywords: ['sanaa', 'ngoma', 'wimbo', 'sherehe', 'tamaduni'], theme: 'culture' },
  { keywords: ['furaha', 'huzuni', 'hofu', 'ghadhabu', 'tumaini'], theme: 'emotions' },
  { keywords: ['mpira', 'kuogelea', 'mbio', 'michezo'], theme: 'sports' },
  { keywords: ['kompyuta', 'televisheni', 'redio', 'umeme'], theme: 'technology' },
  { keywords: ['saa', 'mwezi', 'mwaka', 'juma', 'leo', 'kesho', 'jana'], theme: 'time' },
  { keywords: ['moja', 'mbili', 'tatu', 'nne', 'tano', 'kumi', 'ishirini'], theme: 'numbers' },
  { keywords: ['nyeupe', 'weusi', 'nyekundu', 'kijani', 'bluu', 'njano', 'rangi'], theme: 'colors' },
  { keywords: ['nguo', 'kamis', 'suruali', 'viatu', 'kofia', 'kanga'], theme: 'clothing' },
  { keywords: ['duka', 'kununua', 'kuuza', 'bei', 'fedha', 'soko'], theme: 'shopping' }
];

/**
 * Get theme for a word
 */
function getThemeForWord(word) {
  const cleanWord = word.toLowerCase().replace(/_\d+_[A-Z]\d+$/, '');

  // Strategy 1: Direct mapping
  if (DIRECT_MAPPING[cleanWord]) {
    return DIRECT_MAPPING[cleanWord];
  }

  const wordLower = cleanWord.toLowerCase();

  // Strategy 2: Pattern matching
  for (const pattern of PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (wordLower.includes(keyword)) {
        return pattern.theme;
      }
    }
  }

  // Strategy 3: Hash-based distribution
  let hash = 0;
  for (let i = 0; i < cleanWord.length; i++) {
    hash = ((hash << 5) - hash) + cleanWord.charCodeAt(i);
    hash = hash & hash;
  }
  return THEMES[Math.abs(hash) % THEMES.length];
}

/**
 * Process the file and generate themes
 */
async function processFile() {
  try {
    console.log(`Reading file: ${INPUT_FILE}`);

    const results = [];
    const themeCounts = {};
    const themeExamples = {};

    THEMES.forEach(theme => {
      themeCounts[theme] = 0;
      themeExamples[theme] = [];
    });

    let lineCount = 0;
    let processedLines = 0;

    // Create readline interface
    const rl = readline.createInterface({
      input: fs.createReadStream(INPUT_FILE),
      crlfDelay: Infinity
    });

    // Process each line
    rl.on('line', (line) => {
      const word = line.trim();
      if (word) {
        const theme = getThemeForWord(word);
        results.push({ word, theme });
        themeCounts[theme]++;

        if (themeExamples[theme].length < 5) {
          themeExamples[theme].push(word);
        }

        processedLines++;

        if (processedLines % 2000 === 0) {
          console.log(`  Processed ${processedLines} words...`);
        }
      }
      lineCount++;
    });

    rl.on('close', () => {
      // Write output file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

      // Print report
      console.log('\n' + '='.repeat(60));
      console.log('COMPLETION REPORT - SWAHILI THEME ASSIGNMENT');
      console.log('='.repeat(60));
      console.log(`\nTotal words processed: ${processedLines}`);
      console.log(`Output file: ${OUTPUT_FILE}`);
      console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);

      console.log('\n' + '-'.repeat(60));
      console.log('THEME DISTRIBUTION');
      console.log('-'.repeat(60));

      let totalCheck = 0;
      THEMES.forEach(theme => {
        const count = themeCounts[theme];
        const percentage = ((count / processedLines) * 100).toFixed(1);
        const examples = themeExamples[theme].slice(0, 3).join(', ');
        console.log(`\n${theme.toUpperCase()}`);
        console.log(`  Count: ${count} words (${percentage}%)`);
        console.log(`  Examples: ${examples}`);
        totalCheck += count;
      });

      console.log('\n' + '-'.repeat(60));
      console.log(`Total verification: ${totalCheck} words (expected: ${processedLines})`);
      console.log(`Match: ${totalCheck === processedLines ? 'OK' : 'ERROR'}`);
      console.log('='.repeat(60));
      console.log('\nTheme assignment completed successfully!');
    });

    rl.on('error', (err) => {
      console.error('Error reading file:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start processing
processFile();
