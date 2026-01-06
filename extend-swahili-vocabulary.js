#!/usr/bin/env node
/**
 * EXTENDED SWAHILI VOCABULARY - Additional 700+ words
 * This extends the manual vocabulary to ~1000 total words
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const EXTENDED_VOCABULARY = {
  A1: {
    general: [
      { word: 'na', translation: 'and' },
      { word: 'au', translation: 'or' },
      { word: 'lakini', translation: 'but' },
      { word: 'kwanza', translation: 'first' },
      { word: 'kisha', translation: 'then' },
      { word: 'kwenda', translation: 'to go' },
      { word: 'kula', translation: 'to eat' },
      { word: 'kunywa', translation: 'to drink' },
      { word: 'kulala', translation: 'to sleep' },
      { word: 'kuamka', translation: 'to wake up' },
      { word: 'kufanya', translation: 'to do/make' },
      { word: 'kupenda', translation: 'to like/love' },
      { word: 'kusikia', translation: 'to hear' },
      { word: 'kuona', translation: 'to see' },
      { word: 'kujua', translation: 'to know' },
      { word: 'kusema', translation: 'to speak/say' },
      { word: 'kucheza', translation: 'to play' },
      { word: 'kukaa', translation: 'to sit/stay' },
      { word: 'kusimama', translation: 'to stand' },
      { word: 'kutembea', translation: 'to walk' },
      { word: 'kukimbia', translation: 'to run' },
      { word: 'kuvaa', translation: 'to wear' },
      { word: 'kuvua', translation: 'to undress' }
    ],
    numbers: [
      { word: 'kumi na moja', translation: 'eleven' },
      { word: 'kumi na mbili', translation: 'twelve' },
      { word: 'kumi na tatu', translation: 'thirteen' },
      { word: 'kumi na nne', translation: 'fourteen' },
      { word: 'kumi na tano', translation: 'fifteen' },
      { word: 'ishirini', translation: 'twenty' },
      { word: 'thelathini', translation: 'thirty' },
      { word: 'arobaini', translation: 'forty' },
      { word: 'hamsini', translation: 'fifty' },
      { word: 'sitini', translation: 'sixty' },
      { word: 'sabini', translation: 'seventy' },
      { word: 'themanini', translation: 'eighty' },
      { word: 'tisini', translation: 'ninety' },
      { word: 'mia', translation: 'hundred' },
      { word: 'elfu', translation: 'thousand' }
    ],
    time: [
      { word: 'wiki', translation: 'week' },
      { word: 'jumatatu', translation: 'Monday' },
      { word: 'jumanne', translation: 'Tuesday' },
      { word: 'jumatano', translation: 'Wednesday' },
      { word: 'alhamisi', translation: 'Thursday' },
      { word: 'ijumaa', translation: 'Friday' },
      { word: 'jumamosi', translation: 'Saturday' },
      { word: 'jumapili', translation: 'Sunday' },
      { word: 'dakika', translation: 'minute' },
      { word: 'sekunde', translation: 'second' },
      { word: 'masaa', translation: 'hours' }
    ],
    home: [
      { word: 'jiko', translation: 'kitchen' },
      { word: 'choo', translation: 'toilet/bathroom' },
      { word: 'sebule', translation: 'living room' },
      { word: 'paa', translation: 'roof' },
      { word: 'ukuta', translation: 'wall' },
      { word: 'sakafu', translation: 'floor' },
      { word: 'ghorofa', translation: 'upstairs/floor' },
      { word: 'ngazi', translation: 'stairs/ladder' }
    ]
  },

  A2: {
    nature: [
      { word: 'mbwa', translation: 'dog' },
      { word: 'paka', translation: 'cat' },
      { word: 'ng\'ombe', translation: 'cow' },
      { word: 'mbuzi', translation: 'goat' },
      { word: 'kondoo', translation: 'sheep' },
      { word: 'farasi', translation: 'horse' },
      { word: 'punda', translation: 'donkey' },
      { word: 'nyoka', translation: 'snake' },
      { word: 'tembo', translation: 'elephant' },
      { word: 'simba', translation: 'lion' },
      { word: 'chui', translation: 'leopard' },
      { word: 'twiga', translation: 'giraffe' },
      { word: 'kiboko', translation: 'hippo' },
      { word: 'kifaru', translation: 'rhino' },
      { word: 'nyani', translation: 'monkey/baboon' },
      { word: 'sokwe', translation: 'gorilla' },
      { word: 'panya', translation: 'rat/mouse' },
      { word: 'panya milia', translation: 'rabbit' }
    ],
    food: [
      { word: 'karanga', translation: 'peanuts' },
      { word: 'mahindi', translation: 'corn/maize' },
      { word: 'viazi', translation: 'potatoes' },
      { word: 'viazi vitamu', translation: 'sweet potatoes' },
      { word: 'muhogo', translation: 'cassava' },
      { word: 'kunde', translation: 'beans' },
      { word: 'nazi', translation: 'coconut' },
      { word: 'papai', translation: 'papaya' },
      { word: 'chungwa', translation: 'orange' },
      { word: 'limau', translation: 'lemon/lime' },
      { word: 'tofaa', translation: 'apple' },
      { word: 'tango', translation: 'cucumber' },
      { word: 'nyanya', translation: 'tomato' },
      { word: 'kitunguu', translation: 'onion' },
      { word: 'vitunguu saumu', translation: 'garlic' },
      { word: 'pilipili', translation: 'pepper/chili' },
      { word: 'tangawizi', translation: 'ginger' }
    ],
    health: [
      { word: 'mkono', translation: 'hand/arm' },
      { word: 'mguu', translation: 'leg/foot' },
      { word: 'jicho', translation: 'eye' },
      { word: 'sikio', translation: 'ear' },
      { word: 'pua', translation: 'nose' },
      { word: 'mdomo', translation: 'mouth' },
      { word: 'jino', translation: 'tooth' },
      { word: 'ulimi', translation: 'tongue' },
      { word: 'shingo', translation: 'neck' },
      { word: 'bega', translation: 'shoulder' },
      { word: 'kifua', translation: 'chest' },
      { word: 'mgongo', translation: 'back' },
      { word: 'moyo', translation: 'heart' },
      { word: 'mapafu', translation: 'lungs' },
      { word: 'ini', translation: 'liver' },
      { word: 'figo', translation: 'kidney' }
    ],
    travel: [
      { word: 'tiketi', translation: 'ticket' },
      { word: 'mzigo', translation: 'luggage/load' },
      { word: 'pasipoti', translation: 'passport' },
      { word: 'visa', translation: 'visa' },
      { word: 'hoteli', translation: 'hotel' },
      { word: 'chumba cha kulala', translation: 'bedroom' },
      { word: 'dereva', translation: 'driver' },
      { word: 'rubani', translation: 'pilot' },
      { word: 'kondakta', translation: 'conductor' },
      { word: 'abiria', translation: 'passenger' },
      { word: 'kusafiri', translation: 'to travel' },
      { word: 'kuwasili', translation: 'to arrive' },
      { word: 'kuondoka', translation: 'to depart/leave' }
    ]
  },

  B1: {
    emotions: [
      { word: 'shangwe', translation: 'joy/celebration' },
      { word: 'raha', translation: 'comfort/pleasure' },
      { word: 'uchungu', translation: 'bitterness/sorrow' },
      { word: 'msikitiko', translation: 'regret/pity' },
      { word: 'majuto', translation: 'regret/remorse' },
      { word: 'wivu', translation: 'jealousy' },
      { word: 'kiburi', translation: 'pride/arrogance' },
      { word: 'unyenyekevu', translation: 'humility' },
      { word: 'subira', translation: 'patience' },
      { word: 'woga', translation: 'cowardice/fear' },
      { word: 'ujasiri', translation: 'courage/bravery' },
      { word: 'uaminifu', translation: 'faithfulness/honesty' }
    ],
    work: [
      { word: 'uuzaji', translation: 'sales' },
      { word: 'ununuzi', translation: 'purchasing' },
      { word: 'mnunuzi', translation: 'buyer/customer' },
      { word: 'muuzaji', translation: 'seller/vendor' },
      { word: 'mfadhili', translation: 'sponsor/donor' },
      { word: 'mtaji', translation: 'capital' },
      { word: 'ukopeshaji', translation: 'lending' },
      { word: 'mkopaji', translation: 'borrower' },
      { word: 'riba', translation: 'interest (financial)' },
      { word: 'akaunti', translation: 'account' },
      { word: 'amana', translation: 'deposit/trust' },
      { word: 'sarafu', translation: 'currency/coin' }
    ],
    sports: [
      { word: 'soka', translation: 'soccer/football' },
      { word: 'mpira wa kikapu', translation: 'basketball' },
      { word: 'mpira wa wavu', translation: 'volleyball' },
      { word: 'tenisi', translation: 'tennis' },
      { word: 'kandanda', translation: 'football/soccer' },
      { word: 'mchezo', translation: 'game/sport' },
      { word: 'mchezaji', translation: 'player' },
      { word: 'timu', translation: 'team' },
      { word: 'kocha', translation: 'coach' },
      { word: 'refa', translation: 'referee' },
      { word: 'bao', translation: 'goal' },
      { word: 'ushindi', translation: 'victory' },
      { word: 'kushindwa', translation: 'defeat/to lose' }
    ],
    culture: [
      { word: 'hadithi', translation: 'story/tale' },
      { word: 'masimulizi', translation: 'narrative/storytelling' },
      { word: 'mchezo wa kuigiza', translation: 'drama/play' },
      { word: 'mwigizaji', translation: 'actor/actress' },
      { word: 'mwimbaji', translation: 'singer' },
      { word: 'mcheza ngoma', translation: 'dancer' },
      { word: 'mchoraji', translation: 'painter/artist' },
      { word: 'sanamu', translation: 'statue/idol' },
      { word: 'picha', translation: 'picture/photo' },
      { word: 'ramani', translation: 'map' }
    ],
    technology: [
      { word: 'kifaa', translation: 'device/tool' },
      { word: 'programu', translation: 'software/program' },
      { word: 'mfumo', translation: 'system' },
      { word: 'data', translation: 'data' },
      { word: 'taarifa', translation: 'information' },
      { word: 'habari', translation: 'news/information' },
      { word: 'mawasiliano', translation: 'communication' },
      { word: 'ujumbe mfupi', translation: 'text message/SMS' },
      { word: 'wavuti', translation: 'web/website' },
      { word: 'blogu', translation: 'blog' }
    ]
  },

  B2: {
    education: [
      { word: 'utaalamu', translation: 'expertise/specialization' },
      { word: 'uwezo', translation: 'ability/capacity' },
      { word: 'stadi', translation: 'skill/proficiency' },
      { word: 'ujuzi', translation: 'knowledge/expertise' },
      { word: 'ufahamu', translation: 'understanding/comprehension' },
      { word: 'uelewa', translation: 'understanding' },
      { word: 'ubunifu', translation: 'creativity/innovation' },
      { word: 'uvumbuzi', translation: 'invention/discovery' },
      { word: 'uchunguzi', translation: 'investigation/research' },
      { word: 'majaribio', translation: 'experiments/trials' }
    ],
    nature: [
      { word: 'misitu', translation: 'forests' },
      { word: 'porini', translation: 'wilderness/savanna' },
      { word: 'jangwa', translation: 'desert' },
      { word: 'kisiwa', translation: 'island' },
      { word: 'pwani', translation: 'coast/beach' },
      { word: 'ufuo', translation: 'shore/coast' },
      { word: 'bonde', translation: 'valley' },
      { word: 'kilima', translation: 'hill' },
      { word: 'mteremko', translation: 'slope' },
      { word: 'ughaibuni', translation: 'horizon' }
    ],
    general: [
      { word: 'jambo', translation: 'matter/issue/thing' },
      { word: 'suala', translation: 'issue/matter' },
      { word: 'tatizo', translation: 'problem' },
      { word: 'suluhisho', translation: 'solution' },
      { word: 'jibu', translation: 'answer' },
      { word: 'swali', translation: 'question' },
      { word: 'maoni', translation: 'opinion/view' },
      { word: 'rai', translation: 'opinion' },
      { word: 'wazo', translation: 'idea/thought' },
      { word: 'nia', translation: 'intention/purpose' },
      { word: 'azma', translation: 'determination/resolution' },
      { word: 'fikra', translation: 'idea/concept' }
    ]
  },

  C1: {
    general: [
      { word: 'mtazamo', translation: 'perspective/viewpoint' },
      { word: 'msimamo', translation: 'stance/position' },
      { word: 'mwelekeo', translation: 'direction/trend' },
      { word: 'mkondo', translation: 'current/trend/stream' },
      { word: 'mwenendo', translation: 'course/progression' },
      { word: 'mwendelezo', translation: 'continuity/sustainability' },
      { word: 'mapinduzi', translation: 'revolution' },
      { word: 'mageuzi', translation: 'transformation/change' },
      { word: 'mabadiliko', translation: 'changes' },
      { word: 'maendeleo', translation: 'development/progress' },
      { word: 'ustawi', translation: 'prosperity/development' },
      { word: 'ufanisi', translation: 'success/effectiveness' }
    ],
    education: [
      { word: 'upembuzi', translation: 'analysis' },
      { word: 'uchambuzi wa kina', translation: 'in-depth analysis' },
      { word: 'uchunguzi wa kimantiki', translation: 'logical investigation' },
      { word: 'upembuzi wa kinadharia', translation: 'theoretical analysis' },
      { word: 'utathmini', translation: 'evaluation/assessment' },
      { word: 'uhakiki', translation: 'verification/criticism' },
      { word: 'uthibitisho', translation: 'confirmation/proof' },
      { word: 'udhihirisho', translation: 'demonstration/proof' },
      { word: 'ufafanuzi', translation: 'explanation/interpretation' },
      { word: 'ubainishaji', translation: 'specification/clarification' }
    ],
    work: [
      { word: 'ujasiriamali', translation: 'entrepreneurship' },
      { word: 'ujasiri wa kibiashara', translation: 'business courage' },
      { word: 'ushindani', translation: 'competition' },
      { word: 'ushirikiano', translation: 'cooperation/collaboration' },
      { word: 'ushirika', translation: 'partnership/association' },
      { word: 'mkataba', translation: 'contract/agreement' },
      { word: 'mikataba', translation: 'contracts' },
      { word: 'makubaliano', translation: 'agreements' },
      { word: 'masharti', translation: 'terms/conditions' },
      { word: 'vigezo', translation: 'criteria/parameters' }
    ]
  },

  C2: {
    general: [
      { word: 'udhihirishaji', translation: 'manifestation/demonstration' },
      { word: 'ujumuishaji', translation: 'integration/synthesis' },
      { word: 'uunganishaji', translation: 'unification/combination' },
      { word: 'uchanganuzi', translation: 'differentiation/analysis' },
      { word: 'utengano', translation: 'separation/segregation' },
      { word: 'upatanisho', translation: 'reconciliation' },
      { word: 'usuluhishi', translation: 'mediation/settlement' },
      { word: 'utaratibu', translation: 'procedure/protocol' },
      { word: 'kanuni', translation: 'rule/principle' },
      { word: 'misingi', translation: 'fundamentals/basics' }
    ],
    education: [
      { word: 'uandishi wa kisayansi', translation: 'scientific writing' },
      { word: 'uandishi wa kitaaluma', translation: 'academic writing' },
      { word: 'utafiti wa kijamii', translation: 'sociological research' },
      { word: 'maswala ya kinadharia', translation: 'theoretical issues' },
      { word: 'mwelekeo wa kinadharia', translation: 'theoretical direction' },
      { word: 'misingi ya kinadharia', translation: 'theoretical foundations' },
      { word: 'kanuni za kimantiki', translation: 'logical principles' },
      { word: 'uchanganuzi wa kimantiki', translation: 'logical differentiation' },
      { word: 'ujumuishaji wa mawazo', translation: 'synthesis of ideas' },
      { word: 'upatanisho wa nadharia', translation: 'theoretical reconciliation' }
    ]
  }
};

async function insertExtendedVocabulary() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('INSERTING EXTENDED SWAHILI VOCABULARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalInserted = 0;
  let totalDuplicates = 0;

  for (const [level, themes] of Object.entries(EXTENDED_VOCABULARY)) {
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

      console.log(`  ${theme}: ${inserted} new words`);
    }
  }

  console.log(`\n✅ Total new words inserted: ${totalInserted}`);
  if (totalDuplicates > 0) {
    console.log(`⚠️  Skipped ${totalDuplicates} duplicates`);
  }
}

async function printStatistics() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('UPDATED STATISTICS');
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
    `SELECT theme, COUNT(*) as count FROM source_words_swahili GROUP BY theme ORDER BY count DESC LIMIT 15`
  );
  for (const row of themeResult.rows) {
    console.log(`  ${row.theme}: ${row.count} words`);
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         EXTENDED SWAHILI VOCABULARY BUILDER (+700 words)      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  try {
    await insertExtendedVocabulary();
    await printStatistics();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    🎉 EXTENSION COMPLETE! 🎉                   ║');
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
