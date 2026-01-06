/**
 * Add theme keywords for Swahili
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const SWAHILI_KEYWORDS = {
  'family': ['familia', 'jamaa', 'baba', 'mama', 'mzazi', 'mtoto', 'watoto', 'mwana', 'ndugu', 'kaka', 'dada', 'babu', 'bibi', 'mjukuu', 'mjomba', 'shangazi', 'binamu', 'mume', 'mke', 'mumewe', 'mkewe'],

  'food': ['chakula', 'kula', 'kunywa', 'maji', 'kahawa', 'chai', 'maziwa', 'mkate', 'nyama', 'kuku', 'samaki', 'mchele', 'wali', 'matunda', 'mboga', 'tufaha', 'chungwa', 'ndizi', 'nyanya', 'bia', 'pombe', 'mvinyo', 'mkahawa', 'mgeni', 'menyu', 'sahani', 'mlo', 'chakula cha asubuhi', 'chakula cha mchana', 'chakula cha jioni', 'jiko', 'kupika', 'mapishi', 'kitamu', 'njaa', 'kiu', 'saladi', 'mchuzi', 'supu', 'tamu', 'chumvi'],

  'travel': ['safari', 'kusafiri', 'ndege', 'gari', 'treni', 'basi', 'teksi', 'motokaa', 'baiskeli', 'pikipiki', 'kituo', 'uwanja wa ndege', 'hoteli', 'tiketi', 'sanduku', 'mizigo', 'pasipoti', 'visa', 'mpaka', 'mtalii', 'kiongozi', 'ramani', 'anwani', 'barabara', 'njia', 'kwenda', 'kuja', 'kurudi'],

  'work': ['kazi', 'kufanya kazi', 'ajira', 'mfanyakazi', 'ofisi', 'kampuni', 'shirika', 'biashara', 'bosi', 'mwajiri', 'mshahara', 'pesa', 'fedha', 'kulipa', 'mkataba', 'mkutano', 'mradi', 'mteja', 'bidhaa', 'huduma', 'mauzo', 'kununua', 'taaluma', 'kazi'],

  'education': ['shule', 'chuo', 'elimu', 'mwalimu', 'profesa', 'mwanafunzi', 'darasa', 'somo', 'kozi', 'mtihani', 'jaribio', 'kitabu', 'daftari', 'kalamu', 'penseli', 'kujifunza', 'kusoma', 'kuandika', 'hisabati', 'historia', 'sayansi', 'lugha'],

  'health': ['afya', 'mgonjwa', 'ugonjwa', 'maumivu', 'daktari', 'hospitali', 'kliniki', 'tiba', 'dawa', 'matibabu', 'kutibu', 'dalili', 'homa', 'kikohozi', 'mafua', 'homa ya mfua', 'kichwa', 'tumbo', 'moyo', 'damu', 'mfupa', 'misuli', 'ngozi', 'mwili', 'mkono', 'mguu', 'jicho', 'sikio', 'pua', 'mdomo', 'jino', 'meno'],

  'home': ['nyumba', 'makazi', 'chumba', 'sebule', 'jiko', 'bafu', 'bustani', 'gereji', 'mlango', 'dirisha', 'ukuta', 'paa', 'sakafu', 'ngazi', 'meza', 'kiti', 'kitanda', 'sofa', 'kabati', 'rafu', 'taa', 'kioo', 'zulia', 'pazia', 'samani', 'ufunguo'],

  'nature': ['asili', 'mnyama', 'wanyama', 'mbwa', 'paka', 'ndege', 'samaki', 'farasi', 'ngombe', 'nguruwe', 'kuku', 'mti', 'miti', 'ua', 'maua', 'mmea', 'mimea', 'waridi', 'nyasi', 'msitu', 'mlima', 'kilima', 'bonde', 'mto', 'ziwa', 'bahari', 'kisiwa', 'jangwa', 'shamba', 'anga', 'jua', 'mwezi', 'nyota', 'dunia', 'jiwe', 'mchanga'],

  'weather': ['hali ya hewa', 'hewa', 'jua', 'mvua', 'wingu', 'mawingu', 'upepo', 'theluji', 'dhoruba', 'radi', 'umeme', 'ukungu', 'baridi', 'joto', 'moto', 'joto kali', 'halijoto', 'digrii', 'msimu', 'masika', 'kiangazi', 'vuli', 'kipupwe'],

  'communication': ['kusema', 'kuongea', 'kusema', 'kueleza', 'kuuliza', 'kujibu', 'kusikiliza', 'kusikia', 'kuona', 'kutazama', 'kusoma', 'kuandika', 'simu', 'rununu', 'kupiga simu', 'ujumbe', 'barua', 'posta', 'barua pepe', 'mtandao', 'kompyuta', 'skrini', 'kibodi'],

  'culture': ['utamaduni', 'sanaa', 'muziki', 'kuimba', 'wimbo', 'kucheza', 'mchezo', 'ngoma', 'kupiga', 'chombo', 'picha', 'kuchora', 'makumbusho', 'ukumbi', 'sinema', 'filamu', 'mwigizaji', 'mchezo', 'tamasha'],

  'sports': ['michezo', 'riadha', 'mpira', 'kandanda', 'tenesi', 'mpira wa wavu', 'kuogelea', 'kukimbia', 'baiskeli', 'kucheza', 'mchezaji', 'timu', 'mechi', 'kushinda', 'kushindwa', 'goli', 'uwanja', 'uwanja wa michezo', 'mazoezi'],

  'emotions': ['hisia', 'kujisikia', 'furaha', 'huzuni', 'hasira', 'hofu', 'wasiwasi', 'utulivu', 'mshangao', 'upendo', 'kupenda', 'chuki', 'kuchukia', 'matumaini']
};

async function addSwahiliThemes() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log('🎨 ДОБАВЛЕНИЕ ТЕМ ДЛЯ SWAHILI');
    console.log('═'.repeat(80) + '\n');

    let totalThemed = 0;

    for (const [theme, themeKeywords] of Object.entries(SWAHILI_KEYWORDS)) {
      const likeConditions = themeKeywords.map((_, i) => `LOWER(word) LIKE $${i + 1}`).join(' OR ');

      const result = await pool.query(`
        UPDATE source_words_swahili
        SET theme = $${themeKeywords.length + 1}
        WHERE theme = 'general'
        AND (${likeConditions})
      `, [...themeKeywords.map(k => `%${k}%`), theme]);

      if (result.rowCount > 0) {
        console.log(`   ✅ ${theme}: ${result.rowCount} words`);
        totalThemed += result.rowCount;
      }
    }

    const generalCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_swahili
      WHERE theme = 'general'
    `);

    console.log(`\n   📦 general: ${generalCount.rows[0].count} words`);
    console.log(`   ✨ Total themed: ${totalThemed} words`);

    const total = totalThemed + parseInt(generalCount.rows[0].count);
    const pct = ((totalThemed / total) * 100).toFixed(1);
    console.log(`   📊 Percentage: ${pct}%\n`);

    console.log('═'.repeat(80));
    console.log('✅ Done!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

addSwahiliThemes();
