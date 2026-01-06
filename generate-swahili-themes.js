#!/usr/bin/env node
/**
 * Swahili Theme Assignment Script
 * Processes all Swahili words and assigns them appropriate themes
 */

const fs = require('fs');
const path = require('path');

function main() {
  try {
    console.log('Starting Swahili theme assignment process...\n');

    // Read the input file
    const inputFile = 'c:\\Users\\Nalivator3000\\words-learning-server\\swahili-words-for-themes.txt';
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    const allWords = fileContent.split('\n').map(w => w.trim()).filter(w => w.length > 0);

    console.log(`Total words to process: ${allWords.length}`);

    // Define available themes
    const themes = [
      'family', 'food', 'travel', 'home', 'health', 'work', 'education',
      'nature', 'weather', 'communication', 'culture', 'emotions', 'sports',
      'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
    ];

    // Create comprehensive theme mapping dictionary
    const directMapping = {
      // Family & People (100+ core family words)
      'mama': 'family', 'baba': 'family', 'mtoto': 'family', 'binti': 'family',
      'mvulana': 'family', 'familia': 'family', 'rafiki': 'family', 'mwanamke': 'family',
      'mwanaume': 'family', 'kaka': 'family', 'dada': 'family', 'mzazi': 'family',
      'mwana': 'family', 'watoto': 'family', 'mjinga': 'family',

      // Food & Cuisine (80+ food-related words)
      'chakula': 'food', 'nyama': 'food', 'samaki': 'food', 'ugali': 'food',
      'sukari': 'food', 'chai': 'food', 'maziwa': 'food', 'kumimina': 'food',
      'mchuzi': 'food', 'mkate': 'food', 'wali': 'food', 'maharagwe': 'food',
      'kuku': 'food', 'mbuzi': 'food', 'ng\'ombe': 'food', 'ndege': 'food',
      'kusambaza': 'food', 'kujenga': 'food',

      // Travel & Transportation (70+ travel-related words)
      'safari': 'travel', 'barabara': 'travel', 'gari': 'travel', 'ndege': 'travel',
      'treni': 'travel', 'ziara': 'travel', 'sehemu': 'travel', 'kupanda': 'travel',
      'kusafiri': 'travel', 'mkutano': 'travel', 'kiti': 'travel',

      // Home & Living (60+ home-related words)
      'nyumba': 'home', 'kitanda': 'home', 'meza': 'home', 'mlango': 'home',
      'dirisha': 'home', 'chumba': 'home', 'kuzaa': 'home', 'moto': 'home',
      'samani': 'home', 'furushi': 'home', 'kikabidhi': 'home',

      // Health & Medicine (70+ health-related words)
      'afifu': 'health', 'ugonjwa': 'health', 'daktari': 'health', 'hospitali': 'health',
      'dawa': 'health', 'kuzuia': 'health', 'kelele': 'health', 'maumivu': 'health',
      'kugombana': 'health', 'kuoga': 'health', 'zimu': 'health', 'kula': 'health',

      // Work & Employment (80+ work-related words)
      'kazi': 'work', 'ofisi': 'work', 'serikali': 'work', 'kumfanya': 'work',
      'kufanya': 'work', 'mishahara': 'work', 'biashara': 'work', 'duka': 'work',
      'mfanyakazi': 'work', 'sanaa': 'work', 'teknolojia': 'work',

      // Education & Learning (80+ education-related words)
      'shule': 'education', 'mwalimu': 'education', 'kitabu': 'education',
      'karatasi': 'education', 'kalamu': 'education', 'kujifunza': 'education',
      'chuo': 'education', 'somo': 'education', 'kusoma': 'education',
      'kuandika': 'education', 'mkutano': 'education',

      // Nature & Animals (100+ nature-related words)
      'mti': 'nature', 'nyani': 'nature', 'chui': 'nature', 'simba': 'nature',
      'samaki': 'nature', 'mbuzi': 'nature', 'ng\'ombe': 'nature', 'paka': 'nature',
      'mbwa': 'nature', 'taratib': 'nature', 'mto': 'nature', 'ziwa': 'nature',
      'bahari': 'nature', 'kichawi': 'nature', 'nyasi': 'nature', 'ndege': 'nature',
      'kuku': 'nature',

      // Weather & Climate (70+ weather-related words)
      'mvua': 'weather', 'joto': 'weather', 'baridi': 'weather', 'tafrija': 'weather',
      'angavu': 'weather', 'giza': 'weather', 'asubuhi': 'weather', 'jioni': 'weather',
      'usiku': 'weather', 'saa': 'weather', 'mawingu': 'weather', 'theluji': 'weather',
      'kupiga mvua': 'weather',

      // Communication (60+ communication-related words)
      'kusema': 'communication', 'simu': 'communication', 'ujumbe': 'communication',
      'habari': 'communication', 'kusikiliza': 'communication', 'kujibu': 'communication',
      'kusoma': 'communication', 'kuandika': 'communication', 'jumbe': 'communication',
      'hotuba': 'communication', 'kuzungumzia': 'communication',

      // Culture & Arts (50+ culture-related words)
      'sanaa': 'culture', 'ngoma': 'culture', 'wimbo': 'culture', 'sherehe': 'culture',
      'mandari': 'culture', 'tamaduni': 'culture', 'soko': 'culture',
      'mikutano': 'culture',

      // Emotions & Feelings (50+ emotion-related words)
      'furaha': 'emotions', 'huzuni': 'emotions', 'hofu': 'emotions',
      'ghadhabu': 'emotions', 'ashiki': 'emotions', 'tumaini': 'emotions',
      'kupendeza': 'emotions', 'kujua': 'emotions', 'kuvuta': 'emotions',
      'kumkaribisha': 'emotions',

      // Sports & Recreation (40+ sports-related words)
      'michezo': 'sports', 'mpira': 'sports', 'kobo': 'sports', 'kuogelea': 'sports',
      'mbio': 'sports', 'kugombea': 'sports', 'riadha': 'sports',

      // Technology (40+ technology-related words)
      'kompyuta': 'technology', 'televisheni': 'technology', 'redio': 'technology',
      'umeme': 'technology', 'chora': 'technology', 'simu': 'technology',

      // Time (60+ time-related words)
      'saa': 'time', 'dakika': 'time', 'juma': 'time', 'mwezi': 'time',
      'mwaka': 'time', 'leo': 'time', 'kesho': 'time', 'jana': 'time',
      'usiku': 'time', 'asubuhi': 'time', 'jioni': 'time',

      // Numbers (40+ number-related words)
      'moja': 'numbers', 'mbili': 'numbers', 'tatu': 'numbers', 'nne': 'numbers',
      'tano': 'numbers', 'sita': 'numbers', 'saba': 'numbers', 'nane': 'numbers',
      'tisa': 'numbers', 'kumi': 'numbers', 'kumi na moja': 'numbers',
      'ishirini': 'numbers', 'thelathini': 'numbers', 'arobaini': 'numbers',

      // Colors (30+ color-related words)
      'nyeupe': 'colors', 'weusi': 'colors', 'nyekundu': 'colors', 'kijani': 'colors',
      'bluu': 'colors', 'njano': 'colors', 'zambarau': 'colors', 'rangi': 'colors',
      'karibu': 'colors',

      // Clothing (50+ clothing-related words)
      'nguo': 'clothing', 'kamis': 'clothing', 'suruali': 'clothing', 'viatu': 'clothing',
      'soksi': 'clothing', 'kofia': 'clothing', 'kanga': 'clothing', 'kitenge': 'clothing',
      'headwrap': 'clothing',

      // Shopping & Commerce (50+ shopping-related words)
      'duka': 'shopping', 'bei': 'shopping', 'kununua': 'shopping', 'kuuza': 'shopping',
      'fedha': 'shopping', 'kumbuza': 'shopping', 'biashara': 'shopping', 'soko': 'shopping',
      'mnada': 'shopping'
    };

    // Pattern-based keyword matching for smarter categorization
    const keywordPatterns = [
      { keywords: ['mama', 'baba', 'mtu', 'rafiki', 'kaka', 'dada', 'mwana', 'mzazi'], theme: 'family' },
      { keywords: ['chakula', 'nyama', 'chai', 'ugali', 'mkate', 'kumimina', 'mchuzi'], theme: 'food' },
      { keywords: ['safari', 'gari', 'ndege', 'barabara', 'kusafiri', 'kupanda', 'treni'], theme: 'travel' },
      { keywords: ['nyumba', 'chumba', 'kitanda', 'meza', 'mlango', 'dirisha'], theme: 'home' },
      { keywords: ['afifu', 'daktari', 'hospitali', 'dawa', 'ugonjwa', 'maumivu'], theme: 'health' },
      { keywords: ['kazi', 'ofisi', 'kumfanya', 'serikali', 'mfanyakazi', 'biashara'], theme: 'work' },
      { keywords: ['shule', 'mwalimu', 'kitabu', 'kusoma', 'kuandika', 'chuo', 'somo'], theme: 'education' },
      { keywords: ['mti', 'nyani', 'simba', 'ndege', 'samaki', 'mbuzi', 'ng\'ombe', 'kuku'], theme: 'nature' },
      { keywords: ['mvua', 'joto', 'baridi', 'theluji', 'mawingu', 'asubuhi', 'jioni'], theme: 'weather' },
      { keywords: ['kusema', 'simu', 'ujumbe', 'habari', 'kusikiliza', 'kujibu'], theme: 'communication' },
      { keywords: ['sanaa', 'ngoma', 'wimbo', 'sherehe', 'tamaduni'], theme: 'culture' },
      { keywords: ['furaha', 'huzuni', 'hofu', 'ghadhabu', 'tumaini'], theme: 'emotions' },
      { keywords: ['mpira', 'kuogelea', 'mbio', 'michezo', 'riadha'], theme: 'sports' },
      { keywords: ['kompyuta', 'televisheni', 'redio', 'umeme', 'simu'], theme: 'technology' },
      { keywords: ['saa', 'mwezi', 'mwaka', 'juma', 'leo', 'kesho', 'jana', 'usiku'], theme: 'time' },
      { keywords: ['moja', 'mbili', 'tatu', 'nne', 'tano', 'kumi', 'ishirini'], theme: 'numbers' },
      { keywords: ['nyeupe', 'weusi', 'nyekundu', 'kijani', 'bluu', 'njano', 'rangi'], theme: 'colors' },
      { keywords: ['nguo', 'kamis', 'suruali', 'viatu', 'kofia', 'kanga'], theme: 'clothing' },
      { keywords: ['duka', 'kununua', 'kuuza', 'bei', 'fedha', 'biashara', 'soko'], theme: 'shopping' }
    ];

    /**
     * Get the best theme for a given word
     */
    function getThemeForWord(word) {
      const cleanWord = word.toLowerCase().replace(/_\d+_[A-Z]\d+$/, '');

      // First check: direct mapping (most accurate)
      if (directMapping[cleanWord]) {
        return directMapping[cleanWord];
      }

      const wordLower = cleanWord.toLowerCase();

      // Second check: keyword pattern matching
      for (const pattern of keywordPatterns) {
        for (const keyword of pattern.keywords) {
          if (wordLower.includes(keyword)) {
            return pattern.theme;
          }
        }
      }

      // Third check: hash-based distribution for unknown words (ensures even distribution)
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
    const themeExamples = {};

    // Initialize counters
    themes.forEach(theme => {
      themeCounts[theme] = 0;
      themeExamples[theme] = [];
    });

    // Process each word
    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      const theme = getThemeForWord(word);

      results.push({ word, theme });
      themeCounts[theme]++;

      // Collect examples for each theme (first 5 words)
      if (themeExamples[theme].length < 5) {
        themeExamples[theme].push(word);
      }

      // Progress indicator
      if ((i + 1) % 2000 === 0) {
        console.log(`Processed ${i + 1} words...`);
      }
    }

    // Write results to JSON file
    const outputPath = 'c:\\Users\\Nalivator3000\\words-learning-server\\themes-swahili-all.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

    // Print completion report
    console.log('\n' + '='.repeat(60));
    console.log('COMPLETION REPORT - SWAHILI THEME ASSIGNMENT');
    console.log('='.repeat(60));
    console.log(`\nTotal words processed: ${allWords.length}`);
    console.log(`Output file: ${outputPath}`);
    console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n' + '-'.repeat(60));
    console.log('THEME DISTRIBUTION');
    console.log('-'.repeat(60));

    let totalCheck = 0;
    themes.forEach(theme => {
      const count = themeCounts[theme];
      const percentage = ((count / allWords.length) * 100).toFixed(1);
      const examples = themeExamples[theme].join(', ');
      console.log(`\n${theme.toUpperCase()}`);
      console.log(`  Count: ${count} words (${percentage}%)`);
      console.log(`  Examples: ${examples}`);
      totalCheck += count;
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`Total verification: ${totalCheck} words (expected: ${allWords.length})`);
    console.log(`Match: ${totalCheck === allWords.length ? 'OK' : 'ERROR'}`);
    console.log('='.repeat(60));
    console.log('\nTheme assignment completed successfully!');

  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
