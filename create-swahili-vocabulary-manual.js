#!/usr/bin/env node
/**
 * MANUAL SWAHILI VOCABULARY BUILDER (NO LLM REQUIRED)
 *
 * This script uses pre-defined Swahili word lists to populate the database
 * Use this if you don't have access to Anthropic API
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Comprehensive Swahili vocabulary organized by theme and level
const VOCABULARY = {
  A1: {
    family: [
      { word: 'mama', translation: 'mother' },
      { word: 'baba', translation: 'father' },
      { word: 'mtoto', translation: 'child' },
      { word: 'dada', translation: 'sister' },
      { word: 'kaka', translation: 'brother' },
      { word: 'familia', translation: 'family' },
      { word: 'mwana', translation: 'son/daughter' },
      { word: 'bibi', translation: 'grandmother' },
      { word: 'babu', translation: 'grandfather' },
      { word: 'rafiki', translation: 'friend' }
    ],
    food: [
      { word: 'chakula', translation: 'food' },
      { word: 'maji', translation: 'water' },
      { word: 'mkate', translation: 'bread' },
      { word: 'chai', translation: 'tea' },
      { word: 'maziwa', translation: 'milk' },
      { word: 'nyama', translation: 'meat' },
      { word: 'samaki', translation: 'fish' },
      { word: 'matunda', translation: 'fruit' },
      { word: 'wali', translation: 'rice' },
      { word: 'sukari', translation: 'sugar' },
      { word: 'chumvi', translation: 'salt' },
      { word: 'kuku', translation: 'chicken' },
      { word: 'ugali', translation: 'ugali (corn meal)' },
      { word: 'embe', translation: 'mango' },
      { word: 'ndizi', translation: 'banana' }
    ],
    numbers: [
      { word: 'moja', translation: 'one' },
      { word: 'mbili', translation: 'two' },
      { word: 'tatu', translation: 'three' },
      { word: 'nne', translation: 'four' },
      { word: 'tano', translation: 'five' },
      { word: 'sita', translation: 'six' },
      { word: 'saba', translation: 'seven' },
      { word: 'nane', translation: 'eight' },
      { word: 'tisa', translation: 'nine' },
      { word: 'kumi', translation: 'ten' }
    ],
    colors: [
      { word: 'nyekundu', translation: 'red' },
      { word: 'nyeupe', translation: 'white' },
      { word: 'nyeusi', translation: 'black' },
      { word: 'kijani', translation: 'green' },
      { word: 'buluu', translation: 'blue' },
      { word: 'njano', translation: 'yellow' },
      { word: 'rangi', translation: 'color' }
    ],
    communication: [
      { word: 'habari', translation: 'news/hello' },
      { word: 'jambo', translation: 'hello' },
      { word: 'asante', translation: 'thank you' },
      { word: 'karibu', translation: 'welcome' },
      { word: 'ndiyo', translation: 'yes' },
      { word: 'hapana', translation: 'no' },
      { word: 'tafadhali', translation: 'please' },
      { word: 'pole', translation: 'sorry' },
      { word: 'kwaheri', translation: 'goodbye' },
      { word: 'sawa', translation: 'okay' }
    ],
    home: [
      { word: 'nyumba', translation: 'house' },
      { word: 'mlango', translation: 'door' },
      { word: 'dirisha', translation: 'window' },
      { word: 'chumba', translation: 'room' },
      { word: 'kitanda', translation: 'bed' },
      { word: 'meza', translation: 'table' },
      { word: 'kiti', translation: 'chair' },
      { word: 'bustani', translation: 'garden' }
    ],
    time: [
      { word: 'saa', translation: 'hour/time' },
      { word: 'leo', translation: 'today' },
      { word: 'kesho', translation: 'tomorrow' },
      { word: 'jana', translation: 'yesterday' },
      { word: 'asubuhi', translation: 'morning' },
      { word: 'jioni', translation: 'evening' },
      { word: 'usiku', translation: 'night' },
      { word: 'mchana', translation: 'afternoon' }
    ],
    general: [
      { word: 'mimi', translation: 'me/I' },
      { word: 'wewe', translation: 'you' },
      { word: 'yeye', translation: 'him/her' },
      { word: 'sisi', translation: 'we/us' },
      { word: 'ninyi', translation: 'you (plural)' },
      { word: 'wao', translation: 'they/them' },
      { word: 'hii', translation: 'this' },
      { word: 'hiyo', translation: 'that' },
      { word: 'hapa', translation: 'here' },
      { word: 'pale', translation: 'there' },
      { word: 'sana', translation: 'very/much' },
      { word: 'kidogo', translation: 'little/small' },
      { word: 'kubwa', translation: 'big' },
      { word: 'ndogo', translation: 'small' },
      { word: 'nzuri', translation: 'good' },
      { word: 'mbaya', translation: 'bad' },
      { word: 'mpya', translation: 'new' },
      { word: 'kuwa', translation: 'to be' },
      { word: 'kuwa na', translation: 'to have' },
      { word: 'kuja', translation: 'to come' }
    ]
  },

  A2: {
    family: [
      { word: 'mume', translation: 'husband' },
      { word: 'mke', translation: 'wife' },
      { word: 'mjomba', translation: 'uncle' },
      { word: 'shangazi', translation: 'aunt' },
      { word: 'binamu', translation: 'cousin' },
      { word: 'mzazi', translation: 'parent' },
      { word: 'watoto', translation: 'children' },
      { word: 'mvulana', translation: 'boy' },
      { word: 'msichana', translation: 'girl' },
      { word: 'mwanamke', translation: 'woman' },
      { word: 'mwanamume', translation: 'man' },
      { word: 'mtu', translation: 'person' }
    ],
    education: [
      { word: 'shule', translation: 'school' },
      { word: 'mwalimu', translation: 'teacher' },
      { word: 'mwanafunzi', translation: 'student' },
      { word: 'kitabu', translation: 'book' },
      { word: 'kalamu', translation: 'pen' },
      { word: 'karatasi', translation: 'paper' },
      { word: 'darasa', translation: 'classroom' },
      { word: 'kusoma', translation: 'to read' },
      { word: 'kuandika', translation: 'to write' },
      { word: 'kujifunza', translation: 'to learn' }
    ],
    health: [
      { word: 'afya', translation: 'health' },
      { word: 'daktari', translation: 'doctor' },
      { word: 'hospitali', translation: 'hospital' },
      { word: 'dawa', translation: 'medicine' },
      { word: 'ugonjwa', translation: 'illness' },
      { word: 'maumivu', translation: 'pain' },
      { word: 'homa', translation: 'fever' },
      { word: 'kukohoa', translation: 'to cough' },
      { word: 'kichwa', translation: 'head' },
      { word: 'tumbo', translation: 'stomach' }
    ],
    nature: [
      { word: 'mti', translation: 'tree' },
      { word: 'maua', translation: 'flowers' },
      { word: 'jua', translation: 'sun' },
      { word: 'mwezi', translation: 'moon/month' },
      { word: 'nyota', translation: 'star' },
      { word: 'bahari', translation: 'sea/ocean' },
      { word: 'ziwa', translation: 'lake' },
      { word: 'mto', translation: 'river' },
      { word: 'mlima', translation: 'mountain' },
      { word: 'nyasi', translation: 'grass' }
    ],
    weather: [
      { word: 'mvua', translation: 'rain' },
      { word: 'joto', translation: 'heat' },
      { word: 'baridi', translation: 'cold' },
      { word: 'upepo', translation: 'wind' },
      { word: 'mawingu', translation: 'clouds' },
      { word: 'radi', translation: 'thunder' },
      { word: 'umeme', translation: 'lightning/electricity' }
    ],
    travel: [
      { word: 'safari', translation: 'journey/trip' },
      { word: 'gari', translation: 'car' },
      { word: 'barabara', translation: 'road' },
      { word: 'ndege', translation: 'airplane/bird' },
      { word: 'treni', translation: 'train' },
      { word: 'basi', translation: 'bus' },
      { word: 'pikipiki', translation: 'motorcycle' },
      { word: 'baiskeli', translation: 'bicycle' },
      { word: 'uwanja wa ndege', translation: 'airport' },
      { word: 'stesheni', translation: 'station' }
    ]
  },

  B1: {
    work: [
      { word: 'kazi', translation: 'work' },
      { word: 'ofisi', translation: 'office' },
      { word: 'mfanyakazi', translation: 'worker/employee' },
      { word: 'mwajiri', translation: 'employer' },
      { word: 'biashara', translation: 'business' },
      { word: 'duka', translation: 'shop' },
      { word: 'soko', translation: 'market' },
      { word: 'pesa', translation: 'money' },
      { word: 'mshahara', translation: 'salary' },
      { word: 'mkopo', translation: 'loan' },
      { word: 'benki', translation: 'bank' },
      { word: 'kampuni', translation: 'company' },
      { word: 'mkutano', translation: 'meeting' },
      { word: 'mradi', translation: 'project' },
      { word: 'kufanya kazi', translation: 'to work' }
    ],
    emotions: [
      { word: 'furaha', translation: 'happiness/joy' },
      { word: 'huzuni', translation: 'sadness' },
      { word: 'hasira', translation: 'anger' },
      { word: 'hofu', translation: 'fear' },
      { word: 'mapenzi', translation: 'love' },
      { word: 'chuki', translation: 'hate' },
      { word: 'upendo', translation: 'love' },
      { word: 'tabasamu', translation: 'smile' },
      { word: 'kilio', translation: 'cry' },
      { word: 'wasiwasi', translation: 'worry' },
      { word: 'tumaini', translation: 'hope' },
      { word: 'aibu', translation: 'shame' }
    ],
    culture: [
      { word: 'tamaduni', translation: 'culture' },
      { word: 'sanaa', translation: 'art' },
      { word: 'muziki', translation: 'music' },
      { word: 'ngoma', translation: 'drum/dance' },
      { word: 'wimbo', translation: 'song' },
      { word: 'michezo', translation: 'games/sports' },
      { word: 'filamu', translation: 'film/movie' },
      { word: 'sinema', translation: 'cinema' },
      { word: 'sherehe', translation: 'celebration/party' },
      { word: 'sikukuu', translation: 'holiday/festival' }
    ],
    clothing: [
      { word: 'nguo', translation: 'clothes' },
      { word: 'shati', translation: 'shirt' },
      { word: 'suruali', translation: 'trousers' },
      { word: 'viatu', translation: 'shoes' },
      { word: 'kofia', translation: 'hat' },
      { word: 'soksi', translation: 'socks' },
      { word: 'kanga', translation: 'kanga (traditional cloth)' },
      { word: 'kitenge', translation: 'kitenge (traditional cloth)' },
      { word: 'gauni', translation: 'dress' },
      { word: 'sketi', translation: 'skirt' }
    ],
    technology: [
      { word: 'kompyuta', translation: 'computer' },
      { word: 'simu', translation: 'phone' },
      { word: 'rununu', translation: 'smartphone' },
      { word: 'mtandao', translation: 'network/internet' },
      { word: 'barua pepe', translation: 'email' },
      { word: 'tovuti', translation: 'website' },
      { word: 'programu', translation: 'program/app' },
      { word: 'teknolojia', translation: 'technology' }
    ]
  },

  B2: {
    general: [
      { word: 'jamii', translation: 'society/community' },
      { word: 'utamaduni', translation: 'civilization' },
      { word: 'uchumi', translation: 'economy' },
      { word: 'siasa', translation: 'politics' },
      { word: 'demokrasia', translation: 'democracy' },
      { word: 'serikali', translation: 'government' },
      { word: 'rais', translation: 'president' },
      { word: 'waziri', translation: 'minister' },
      { word: 'sheria', translation: 'law' },
      { word: 'haki', translation: 'rights/justice' },
      { word: 'uhuru', translation: 'freedom/independence' },
      { word: 'amani', translation: 'peace' },
      { word: 'vita', translation: 'war' },
      { word: 'usalama', translation: 'safety/security' },
      { word: 'mazingira', translation: 'environment' },
      { word: 'hali ya hewa', translation: 'climate/weather' },
      { word: 'uchafuzi', translation: 'pollution' },
      { word: 'mabadiliko ya tabianchi', translation: 'climate change' },
      { word: 'ulinzi wa mazingira', translation: 'environmental protection' },
      { word: 'maendeleo', translation: 'development/progress' }
    ],
    education: [
      { word: 'chuo kikuu', translation: 'university' },
      { word: 'shahada', translation: 'degree/certificate' },
      { word: 'utafiti', translation: 'research' },
      { word: 'elimu', translation: 'education' },
      { word: 'maktaba', translation: 'library' },
      { word: 'maabara', translation: 'laboratory' },
      { word: 'mtaala', translation: 'curriculum' },
      { word: 'mtihani', translation: 'exam' },
      { word: 'alama', translation: 'grade/mark' },
      { word: 'mwanasayansi', translation: 'scientist' }
    ],
    health: [
      { word: 'upasuaji', translation: 'surgery' },
      { word: 'zahanati', translation: 'clinic' },
      { word: 'dawa ya kulevya', translation: 'anesthetic' },
      { word: 'kipimo cha damu', translation: 'blood test' },
      { word: 'chanjo', translation: 'vaccination' },
      { word: 'ugonjwa wa kuambukiza', translation: 'infectious disease' },
      { word: 'msaada wa kwanza', translation: 'first aid' },
      { word: 'huduma za afya', translation: 'healthcare services' }
    ],
    work: [
      { word: 'ujasiriamali', translation: 'entrepreneurship' },
      { word: 'uendeshaji', translation: 'management' },
      { word: 'usimamizi', translation: 'supervision' },
      { word: 'uwekezaji', translation: 'investment' },
      { word: 'faida', translation: 'profit' },
      { word: 'hasara', translation: 'loss' },
      { word: 'masoko', translation: 'marketing' },
      { word: 'uuzaji', translation: 'sales' },
      { word: 'ununuzi', translation: 'purchasing' },
      { word: 'mazao', translation: 'products' }
    ]
  },

  C1: {
    general: [
      { word: 'utandawazi', translation: 'globalization' },
      { word: 'ukoloni', translation: 'colonialism' },
      { word: 'uhalisiano', translation: 'relations/diplomacy' },
      { word: 'mfumo', translation: 'system' },
      { word: 'muundo', translation: 'structure' },
      { word: 'nadharia', translation: 'theory' },
      { word: 'dhana', translation: 'concept' },
      { word: 'falsafa', translation: 'philosophy' },
      { word: 'mantiki', translation: 'logic' },
      { word: 'hoja', translation: 'argument' },
      { word: 'ushahidi', translation: 'evidence' },
      { word: 'uthibitisho', translation: 'proof/verification' },
      { word: 'mjadala', translation: 'debate/discussion' },
      { word: 'uchambuzi', translation: 'analysis' },
      { word: 'tathmini', translation: 'evaluation' },
      { word: 'tafsiri', translation: 'interpretation/translation' },
      { word: 'mkakati', translation: 'strategy' },
      { word: 'mbinu', translation: 'method/technique' },
      { word: 'mchakato', translation: 'process' },
      { word: 'matokeo', translation: 'results/outcomes' }
    ],
    education: [
      { word: 'utaalamu', translation: 'expertise/specialization' },
      { word: 'ufundi', translation: 'craftsmanship/technical skill' },
      { word: 'ubunifu', translation: 'creativity/innovation' },
      { word: 'ufahamu', translation: 'understanding/comprehension' },
      { word: 'akili', translation: 'intelligence/mind' },
      { word: 'busara', translation: 'wisdom' },
      { word: 'maarifa', translation: 'knowledge' },
      { word: 'weledi', translation: 'proficiency' },
      { word: 'ustadi', translation: 'mastery' },
      { word: 'taaluma', translation: 'scholarship' }
    ],
    culture: [
      { word: 'ushairi', translation: 'poetry' },
      { word: 'riwaya', translation: 'novel' },
      { word: 'hadithi fupi', translation: 'short story' },
      { word: 'fasihi', translation: 'literature' },
      { word: 'kijicho', translation: 'perspective' },
      { word: 'lugha ya pili', translation: 'second language' },
      { word: 'lahaja', translation: 'dialect/accent' },
      { word: 'msemo', translation: 'proverb/saying' },
      { word: 'methali', translation: 'proverb' },
      { word: 'utamaduni wa asili', translation: 'indigenous culture' }
    ]
  },

  C2: {
    general: [
      { word: 'urithi', translation: 'heritage/inheritance' },
      { word: 'uzao', translation: 'lineage/descendants' },
      { word: 'asili', translation: 'origin/essence' },
      { word: 'msingi', translation: 'foundation/basis' },
      { word: 'kiini', translation: 'core/essence' },
      { word: 'utangulizi', translation: 'introduction/preface' },
      { word: 'hitimisho', translation: 'conclusion' },
      { word: 'muhtasari', translation: 'summary/abstract' },
      { word: 'ufafanuzi', translation: 'explanation/clarification' },
      { word: 'ubainishaji', translation: 'specification/definition' },
      { word: 'udhihirisho', translation: 'demonstration/manifestation' },
      { word: 'uthibiti', translation: 'control/regulation' },
      { word: 'udhibiti', translation: 'verification/control' },
      { word: 'uangalizi', translation: 'observation/supervision' },
      { word: 'ufuatiliaji', translation: 'monitoring/tracking' },
      { word: 'ukaguzi', translation: 'inspection/audit' },
      { word: 'upembuzi', translation: 'analysis/dissection' },
      { word: 'ujumuishaji', translation: 'integration/synthesis' },
      { word: 'uunganishaji', translation: 'combination/merger' },
      { word: 'upatanisho', translation: 'reconciliation/compromise' }
    ],
    education: [
      { word: 'ufundishaji', translation: 'pedagogy/teaching' },
      { word: 'uundaji', translation: 'creation/composition' },
      { word: 'ubunifu wa kisayansi', translation: 'scientific innovation' },
      { word: 'upembuzi wa kinadharia', translation: 'theoretical analysis' },
      { word: 'utafiti wa kina', translation: 'in-depth research' },
      { word: 'mbinu za kisasa', translation: 'modern methods' },
      { word: 'maendeleo ya kitaaluma', translation: 'academic development' },
      { word: 'uchanganuzi wa kimantiki', translation: 'logical analysis' },
      { word: 'upembuzi wa kimuundo', translation: 'structural analysis' },
      { word: 'utafiti wa kijamii', translation: 'social research' }
    ]
  }
};

/**
 * Delete synthetic data
 */
async function deleteSyntheticData() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 1: DELETING SYNTHETIC/TEST DATA');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const beforeCount = await pool.query('SELECT COUNT(*) as total FROM source_words_swahili');
  console.log(`Current total words: ${beforeCount.rows[0].total}`);

  const syntheticCount = await pool.query(`SELECT COUNT(*) as synthetic FROM source_words_swahili WHERE word LIKE '%\_%'`);
  console.log(`Synthetic words (containing underscore): ${syntheticCount.rows[0].synthetic}`);

  const deleteResult = await pool.query(`DELETE FROM source_words_swahili WHERE word LIKE '%\_%'`);
  console.log(`\n✅ Deleted ${deleteResult.rowCount} synthetic words`);

  const afterCount = await pool.query('SELECT COUNT(*) as remaining FROM source_words_swahili');
  console.log(`Remaining real words: ${afterCount.rows[0].remaining}`);
}

/**
 * Insert vocabulary
 */
async function insertVocabulary() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 2: INSERTING REAL SWAHILI VOCABULARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalInserted = 0;
  let totalDuplicates = 0;

  for (const [level, themes] of Object.entries(VOCABULARY)) {
    console.log(`\n📈 Level ${level}:`);

    for (const [theme, words] of Object.entries(themes)) {
      let inserted = 0;

      for (const { word, translation } of words) {
        try {
          const result = await pool.query(
            `INSERT INTO source_words_swahili (word, translation, level, theme, is_core)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT (word) DO NOTHING
             RETURNING word`,
            [word, translation, level, theme]
          );

          if (result.rowCount > 0) {
            inserted++;
            totalInserted++;
          } else {
            totalDuplicates++;
          }
        } catch (error) {
          console.error(`  ✗ Error inserting "${word}": ${error.message}`);
        }
      }

      console.log(`  ${theme}: ${inserted} words inserted`);
    }
  }

  console.log(`\n✅ Total inserted: ${totalInserted} words`);
  if (totalDuplicates > 0) {
    console.log(`⚠️  Skipped ${totalDuplicates} duplicates`);
  }
}

/**
 * Create word sets
 */
async function createWordSets() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('STEP 3: CREATING THEMATIC WORD SETS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const deleteResult = await pool.query(`DELETE FROM word_sets WHERE source_language = 'swahili'`);
  console.log(`🗑️  Deleted ${deleteResult.rowCount} old word sets\n`);

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const MIN_THEME_SIZE = 5;
  let totalCreated = 0;

  const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficiency'
  };

  for (const level of LEVELS) {
    console.log(`📈 Level ${level}:`);

    const themesQuery = await pool.query(
      `SELECT theme, COUNT(*) as count
       FROM source_words_swahili
       WHERE level = $1 AND theme IS NOT NULL
       GROUP BY theme
       ORDER BY count DESC`,
      [level]
    );

    for (const themeRow of themesQuery.rows) {
      const theme = themeRow.theme;
      const count = parseInt(themeRow.count);

      if (count < MIN_THEME_SIZE) {
        continue;
      }

      const title = `Swahili ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
      const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

      await pool.query(
        `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        ['swahili', title, description, level, theme, count]
      );

      console.log(`  ✓ ${theme}: ${count} words`);
      totalCreated++;
    }
  }

  console.log(`\n✅ Created ${totalCreated} thematic word sets`);
}

/**
 * Print statistics
 */
async function printStatistics() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FINAL STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const totalResult = await pool.query('SELECT COUNT(*) as total FROM source_words_swahili');
  console.log(`📊 Total words in database: ${totalResult.rows[0].total}`);

  console.log('\n📈 Distribution by level:');
  const levelResult = await pool.query(
    `SELECT level, COUNT(*) as count FROM source_words_swahili GROUP BY level ORDER BY level`
  );
  for (const row of levelResult.rows) {
    console.log(`  ${row.level}: ${row.count} words`);
  }

  console.log('\n🏷️  Distribution by theme:');
  const themeResult = await pool.query(
    `SELECT theme, COUNT(*) as count FROM source_words_swahili GROUP BY theme ORDER BY count DESC`
  );
  for (const row of themeResult.rows) {
    console.log(`  ${row.theme}: ${row.count} words`);
  }

  const setsResult = await pool.query(`SELECT COUNT(*) as total FROM word_sets WHERE source_language = 'swahili'`);
  console.log(`\n📚 Total word sets created: ${setsResult.rows[0].total}`);

  console.log('\n📝 Sample words:');
  const sampleResult = await pool.query(
    `SELECT word, translation, level, theme FROM source_words_swahili ORDER BY RANDOM() LIMIT 10`
  );
  for (const row of sampleResult.rows) {
    console.log(`  ${row.word} (${row.translation}) - ${row.level} - ${row.theme}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     SWAHILI VOCABULARY BUILDER - MANUAL (NO LLM REQUIRED)     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  try {
    await deleteSyntheticData();
    await insertVocabulary();
    await createWordSets();
    await printStatistics();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    🎉 COMPLETED SUCCESSFULLY! 🎉               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
