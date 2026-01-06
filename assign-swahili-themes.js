const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Available themes
const themes = [
  'family',
  'food',
  'travel',
  'home',
  'health',
  'work',
  'education',
  'nature',
  'weather',
  'communication',
  'culture',
  'emotions',
  'sports',
  'technology',
  'time',
  'numbers',
  'colors',
  'clothing',
  'shopping'
];

// Comprehensive theme mapping based on Swahili word meanings
const themeMapping = {
  // Family & People
  'mama': 'family', 'baba': 'family', 'watoto': 'family', 'mtoto': 'family', 'binti': 'family',
  'mvulana': 'family', 'familia': 'family', 'rafiki': 'family', 'mwanamke': 'family', 'mwanaume': 'family',
  'kaka': 'family', 'dada': 'family', 'mjinga': 'family', 'mzazi': 'family', 'mwana': 'family',

  // Food
  'chakula': 'food', 'nyama': 'food', 'samaki': 'food', 'ugali': 'food', 'sukari': 'food',
  'chai': 'food', 'maziwa': 'food', 'kumimina': 'food', 'kusambaza': 'food', 'ndani': 'food',
  'mchuzi': 'food', 'mkate': 'food', 'wali': 'food', 'maharagwe': 'food', 'kumimina': 'food',
  'kuku': 'food', 'mbuzi': 'food', 'ng\'ombe': 'food', 'ndege': 'food',

  // Travel & Transportation
  'safari': 'travel', 'barabara': 'travel', 'gari': 'travel', 'ndege': 'travel', 'treni': 'travel',
  'ziara': 'travel', 'sehemu': 'travel', 'kupanda': 'travel', 'kusafiri': 'travel', 'mkutano': 'travel',
  'kiti': 'travel', 'nyumba': 'travel', 'chuo': 'travel',

  // Home & Living
  'nyumba': 'home', 'kitanda': 'home', 'meza': 'home', 'kiti': 'home', 'mlango': 'home',
  'dirisha': 'home', 'chumba': 'home', 'kuzaa': 'home', 'chakula': 'home', 'moto': 'home',
  'samani': 'home', 'furushi': 'home', 'kikabidhi': 'home',

  // Health & Medicine
  'afifu': 'health', 'ugonjwa': 'health', 'daktari': 'health', 'hospitali': 'health', 'dawa': 'health',
  'kuzuia': 'health', 'kelele': 'health', 'maumivu': 'health', 'kugombana': 'health', 'kula': 'health',
  'kuoga': 'health', 'chakula': 'health', 'zimu': 'health',

  // Work & Employment
  'kazi': 'work', 'ofisi': 'work', 'serikali': 'work', 'kumfanya': 'work', 'kufanya': 'work',
  'mishahara': 'work', 'biashara': 'work', 'duka': 'work', 'mfanyakazi': 'work', 'mkutano': 'work',
  'sanaa': 'work', 'teknolojia': 'work',

  // Education & Learning
  'shule': 'education', 'mwalimu': 'education', 'kitabu': 'education', 'karatasi': 'education',
  'kalamu': 'education', 'kujifunza': 'education', 'mtoto': 'education', 'chuo': 'education',
  'somo': 'education', 'mkutano': 'education', 'kusoma': 'education', 'kuandika': 'education',

  // Nature & Animals
  'mti': 'nature', 'nyani': 'nature', 'chui': 'nature', 'simba': 'nature', 'ndege': 'nature',
  'samaki': 'nature', 'mbuzi': 'nature', 'ng\'ombe': 'nature', 'kuku': 'nature', 'paka': 'nature',
  'mbwa': 'nature', 'taratib': 'nature', 'mto': 'nature', 'ziwa': 'nature', 'bahari': 'nature',
  'kichawi': 'nature', 'nyasi': 'nature',

  // Weather & Climate
  'mvua': 'weather', 'joto': 'weather', 'baridi': 'weather', 'tafrija': 'weather', 'angavu': 'weather',
  'giza': 'weather', 'asubuhi': 'weather', 'jioni': 'weather', 'usiku': 'weather', 'saa': 'weather',
  'mawingu': 'weather', 'theluji': 'weather', 'kupiga mvua': 'weather',

  // Communication
  'kusema': 'communication', 'simu': 'communication', 'ujumbe': 'communication', 'habari': 'communication',
  'kusikiliza': 'communication', 'kujibu': 'communication', 'kusoma': 'communication', 'kuandika': 'communication',
  'jumbe': 'communication', 'hotuba': 'communication', 'kuzungumzia': 'communication',

  // Culture & Arts
  'sanaa': 'culture', 'ngoma': 'culture', 'wimbo': 'culture', 'sherehe': 'culture', 'mandari': 'culture',
  'tamaduni': 'culture', 'soko': 'culture', 'mikutano': 'culture',

  // Emotions & Feelings
  'furaha': 'emotions', 'huzuni': 'emotions', 'hofu': 'emotions', 'ghadhabu': 'emotions', 'ashiki': 'emotions',
  'tumaini': 'emotions', 'kupendeza': 'emotions', 'kujua': 'emotions', 'kuvuta': 'emotions', 'kumkaribisha': 'emotions',

  // Sports & Recreation
  'michezo': 'sports', 'mpira': 'sports', 'kobo': 'sports', 'kuogelea': 'sports', 'mbio': 'sports',
  'kugombea': 'sports', 'riadha': 'sports',

  // Technology
  'kompyuta': 'technology', 'televisheni': 'technology', 'redio': 'technology', 'umeme': 'technology',
  'chora': 'technology', 'simu': 'technology',

  // Time
  'saa': 'time', 'dakika': 'time', 'juma': 'time', 'mwezi': 'time', 'mwaka': 'time',
  'leo': 'time', 'kesho': 'time', 'jana': 'time', 'usiku': 'time', 'asubuhi': 'time',
  'jioni': 'time',

  // Numbers
  'moja': 'numbers', 'mbili': 'numbers', 'tatu': 'numbers', 'nne': 'numbers', 'tano': 'numbers',
  'sita': 'numbers', 'saba': 'numbers', 'nane': 'numbers', 'tisa': 'numbers', 'kumi': 'numbers',
  'kumi na moja': 'numbers', 'ishirini': 'numbers', 'thelathini': 'numbers',

  // Colors
  'nyeupe': 'colors', 'weusi': 'colors', 'nyekundu': 'colors', 'kijani': 'colors', 'bluu': 'colors',
  'njano': 'colors', 'zambarau': 'colors', 'rangi': 'colors', 'karibu': 'colors',

  // Clothing
  'nguo': 'clothing', 'kamis': 'clothing', 'suruali': 'clothing', 'viatu': 'clothing', 'soksi': 'clothing',
  'kofia': 'clothing', 'kanga': 'clothing', 'kitenge': 'clothing', 'headwrap': 'clothing',

  // Shopping
  'duka': 'shopping', 'bei': 'shopping', 'kununua': 'shopping', 'kuuza': 'shopping', 'fedha': 'shopping',
  'kumbuza': 'shopping', 'biashara': 'shopping', 'soko': 'shopping', 'mnada': 'shopping'
};

// Function to get theme for a word
function getThemeForWord(word) {
  const cleanWord = word.toLowerCase().replace(/_\d+_[A-Z]\d+$/, '');

  // Check direct mapping
  if (themeMapping[cleanWord]) {
    return themeMapping[cleanWord];
  }

  const wordLower = cleanWord.toLowerCase();

  // Pattern matching for Swahili words
  const patterns = [
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
    { keywords: ['kompyuta', 'televisheni', 'umeme', 'simu', 'redio'], theme: 'technology' },
    { keywords: ['saa', 'mwezi', 'mwaka', 'juma', 'leo', 'kesho', 'jana', 'usiku'], theme: 'time' },
    { keywords: ['moja', 'mbili', 'tatu', 'nne', 'tano', 'kumi', 'ishirini'], theme: 'numbers' },
    { keywords: ['nyeupe', 'weusi', 'nyekundu', 'kijani', 'bluu', 'njano', 'rangi'], theme: 'colors' },
    { keywords: ['nguo', 'kamis', 'suruali', 'viatu', 'kofia', 'kanga', 'kitenge'], theme: 'clothing' },
    { keywords: ['duka', 'kununua', 'kuuza', 'bei', 'fedha', 'biashara', 'soko'], theme: 'shopping' }
  ];

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (wordLower.includes(keyword)) {
        return pattern.theme;
      }
    }
  }

  // Default: distribute evenly based on hash
  const hashCode = cleanWord.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
  return themes[Math.abs(hashCode) % themes.length];
}

// Process file line by line
async function processFile() {
  const filePath = path.join(__dirname, 'swahili-words-for-themes.txt');
  const outputPath = path.join(__dirname, 'themes-swahili-all.json');

  const results = [];
  const themeCounts = {};

  themes.forEach(theme => {
    themeCounts[theme] = 0;
  });

  let lineCount = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    const word = line.trim();
    if (word) {
      const theme = getThemeForWord(word);
      results.push({ word, theme });
      themeCounts[theme]++;
      lineCount++;

      if (lineCount % 1000 === 0) {
        console.log(`Processed ${lineCount} words...`);
      }
    }
  });

  rl.on('close', () => {
    // Write results to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`\nCompleted! Results written to ${outputPath}`);
    console.log(`Total words processed: ${lineCount}`);
    console.log(`\nTheme distribution:`);

    themes.forEach(theme => {
      const count = themeCounts[theme];
      const percentage = ((count / lineCount) * 100).toFixed(1);
      console.log(`  ${theme}: ${count} words (${percentage}%)`);
    });
  });
}

// Run the process
processFile().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
