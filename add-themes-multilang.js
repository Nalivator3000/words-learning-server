/**
 * Universal script to add themes to words for multiple languages
 * Usage: node add-themes-multilang.js <language>
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language');
  process.exit(1);
}

// Theme keywords for different languages
const THEME_KEYWORDS = {
  polish: {
    'family': ['rodzina', 'rodzinn', 'ojciec', 'matka', 'mama', 'tata', 'syn', 'córka', 'brat', 'siostra', 'dziadek', 'babcia', 'wnuk', 'wujek', 'ciocia', 'kuzyn', 'rodzic', 'dziecko', 'dzieci', 'małżonek', 'mąż', 'żona'],

    'food': ['jedzenie', 'jeść', 'pić', 'woda', 'kawa', 'herbata', 'mleko', 'chleb', 'mięso', 'kurczak', 'ryba', 'ryż', 'makaron', 'owoc', 'warzywo', 'jabłko', 'pomarańcz', 'banan', 'pomidor', 'piwo', 'wino', 'restauracja', 'kelner', 'menu', 'danie', 'śniadanie', 'obiad', 'kolacja', 'kuchnia', 'gotować', 'przepis', 'smaczn', 'głód', 'pragnienie', 'sałatka', 'zupa'],

    'travel': ['podróż', 'podróżować', 'samolot', 'pociąg', 'autobus', 'taksówka', 'samochód', 'rower', 'motocykl', 'stacja', 'dworzec', 'lotnisko', 'hotel', 'bilet', 'walizka', 'bagaż', 'paszport', 'wiza', 'granica', 'turysta', 'przewodnik', 'mapa', 'adres', 'ulica'],

    'work': ['praca', 'pracować', 'zatrudnienie', 'pracownik', 'pracodawca', 'biuro', 'firma', 'przedsiębiorstwo', 'biznes', 'szef', 'kolega', 'pensja', 'płaca', 'pieniądz', 'płacić', 'umowa', 'kontrakt', 'spotkanie', 'projekt', 'klient', 'produkt', 'usługa', 'sprzedaż', 'zakup', 'zawód', 'kariera'],

    'education': ['szkoła', 'uniwersytet', 'uczelnia', 'edukacja', 'nauczyciel', 'wykładowca', 'student', 'uczeń', 'klasa', 'lekcja', 'wykład', 'kurs', 'egzamin', 'test', 'ocena', 'stopień', 'książka', 'zeszyt', 'ołówek', 'długopis', 'uczyć', 'nauczyć', 'studiować', 'czytanie', 'pisanie', 'matematyka', 'historia', 'nauka', 'język'],

    'health': ['zdrowie', 'zdrow', 'chory', 'choroba', 'ból', 'boleć', 'lekarz', 'doktor', 'szpital', 'klinika', 'medycyna', 'medyczny', 'lek', 'tabletka', 'leczenie', 'leczyć', 'wyleczyć', 'pacjent', 'symptom', 'gorączka', 'kaszel', 'przeziębienie', 'grypa', 'głowa', 'żołądek', 'brzuch', 'serce', 'krew', 'kość', 'mięsień', 'skóra', 'ciało', 'ręka', 'noga', 'oko', 'ucho', 'nos', 'usta', 'ząb'],

    'home': ['dom', 'mieszkanie', 'pokój', 'sypialnia', 'salon', 'kuchnia', 'łazienka', 'ogród', 'garaż', 'drzwi', 'okno', 'ściana', 'sufit', 'podłoga', 'schody', 'stół', 'krzesło', 'łóżko', 'sofa', 'kanapa', 'szafa', 'półka', 'lampa', 'lustro', 'dywan', 'zasłona', 'mebel', 'klucz'],

    'nature': ['natura', 'przyroda', 'zwierzę', 'pies', 'kot', 'ptak', 'ryba', 'koń', 'krowa', 'świnia', 'kurczak', 'drzewo', 'kwiat', 'roślina', 'róża', 'trawa', 'las', 'góra', 'wzgórze', 'dolina', 'rzeka', 'jezioro', 'morze', 'ocean', 'plaża', 'wyspa', 'pustynia', 'pole', 'łąka', 'niebo', 'słońce', 'księżyc', 'gwiazda', 'ziemia', 'kamień', 'piasek'],

    'weather': ['pogoda', 'klimat', 'słońce', 'słoneczn', 'deszcz', 'deszczow', 'chmura', 'wiatr', 'wietrzn', 'śnieg', 'śnieżn', 'burza', 'grzmot', 'błyskawica', 'mgła', 'zimno', 'mróz', 'ciepło', 'gorąco', 'temperatura', 'stopień', 'pora', 'wiosna', 'lato', 'jesień', 'zima'],

    'communication': ['mówić', 'powiedzieć', 'opowiadać', 'wyjaśniać', 'pytać', 'odpowiadać', 'słuchać', 'słyszeć', 'widzieć', 'patrzeć', 'czytać', 'pisać', 'telefon', 'komórka', 'dzwonić', 'wiadomość', 'list', 'poczta', 'email', 'internet', 'strona', 'komputer', 'klawiatura', 'mysz', 'ekran'],

    'culture': ['kultura', 'sztuka', 'muzyka', 'śpiewać', 'piosenka', 'tańczyć', 'taniec', 'grać', 'instrument', 'fortepian', 'gitara', 'malarstwo', 'obraz', 'rysować', 'rysunek', 'muzeum', 'galeria', 'teatr', 'kino', 'film', 'aktor', 'aktorka', 'reżyser', 'spektakl', 'koncert', 'festiwal', 'wystawa'],

    'sports': ['sport', 'sportow', 'piłka nożna', 'koszykówka', 'tenis', 'siatkówka', 'pływanie', 'pływać', 'biegać', 'bieg', 'kolarstwo', 'rower', 'grać', 'gracz', 'zespół', 'drużyna', 'mecz', 'wygrywać', 'przegrywać', 'gol', 'piłka', 'boisko', 'stadion', 'sala', 'trening', 'trenować'],

    'emotions': ['emocja', 'uczucie', 'czuć', 'szczęśliw', 'radosn', 'wesol', 'smutny', 'smutek', 'zły', 'złość', 'gniew', 'strach', 'bać się', 'niepokój', 'nerw', 'spokojn', 'zdziwienie', 'miłość', 'kochać', 'nienawiść', 'nienawidzić', 'nadzieja', 'rozpacz']
  },

  turkish: {
    'family': ['aile', 'ailevi', 'baba', 'anne', 'oğul', 'kız', 'kardeş', 'erkek kardeş', 'kız kardeş', 'dede', 'büyükanne', 'torun', 'amca', 'teyze', 'hala', 'dayı', 'kuzen', 'ebeveyn', 'çocuk', 'eş', 'koca', 'karı'],

    'food': ['yemek', 'yemek yemek', 'içmek', 'su', 'kahve', 'çay', 'süt', 'ekmek', 'et', 'tavuk', 'balık', 'pirinç', 'makarna', 'meyve', 'sebze', 'elma', 'portakal', 'muz', 'domates', 'bira', 'şarap', 'restoran', 'garson', 'menü', 'yemek', 'kahvaltı', 'öğle yemeği', 'akşam yemeği', 'mutfak', 'pişirmek', 'tarif', 'lezzetli', 'açlık', 'susuzluk', 'salata', 'çorba'],

    'travel': ['seyahat', 'seyahat etmek', 'uçak', 'tren', 'otobüs', 'taksi', 'araba', 'bisiklet', 'motosiklet', 'istasyon', 'havaalanı', 'otel', 'bilet', 'valiz', 'bagaj', 'pasaport', 'vize', 'sınır', 'turist', 'rehber', 'harita', 'adres', 'sokak', 'cadde'],

    'work': ['iş', 'çalışmak', 'istihdam', 'çalışan', 'işveren', 'ofis', 'şirket', 'firma', 'iş', 'patron', 'meslektaş', 'maaş', 'ücret', 'para', 'ödemek', 'sözleşme', 'toplantı', 'proje', 'müşteri', 'ürün', 'hizmet', 'satış', 'alış', 'meslek', 'kariyer'],

    'education': ['okul', 'üniversite', 'eğitim', 'öğretmen', 'öğrenci', 'sınıf', 'ders', 'kurs', 'sınav', 'test', 'not', 'kitap', 'defter', 'kalem', 'öğrenmek', 'okumak', 'yazmak', 'matematik', 'tarih', 'bilim', 'dil'],

    'health': ['sağlık', 'sağlıklı', 'hasta', 'hastalık', 'ağrı', 'doktor', 'hastane', 'klinik', 'tıp', 'ilaç', 'tedavi', 'tedavi etmek', 'hasta', 'semptom', 'ateş', 'öksürük', 'soğuk algınlığı', 'grip', 'baş', 'mide', 'karın', 'kalp', 'kan', 'kemik', 'kas', 'cilt', 'vücut', 'el', 'ayak', 'göz', 'kulak', 'burun', 'ağız', 'diş'],

    'home': ['ev', 'daire', 'oda', 'yatak odası', 'oturma odası', 'mutfak', 'banyo', 'bahçe', 'garaj', 'kapı', 'pencere', 'duvar', 'tavan', 'zemin', 'merdiven', 'masa', 'sandalye', 'yatak', 'kanepe', 'dolap', 'raf', 'lamba', 'ayna', 'halı', 'perde', 'mobilya', 'anahtar'],

    'nature': ['doğa', 'hayvan', 'köpek', 'kedi', 'kuş', 'balık', 'at', 'inek', 'domuz', 'tavuk', 'ağaç', 'çiçek', 'bitki', 'gül', 'çimen', 'orman', 'dağ', 'tepe', 'vadi', 'nehir', 'göl', 'deniz', 'okyanus', 'plaj', 'ada', 'çöl', 'tarla', 'gökyüzü', 'güneş', 'ay', 'yıldız', 'dünya', 'taş', 'kum'],

    'weather': ['hava', 'iklim', 'güneş', 'güneşli', 'yağmur', 'yağmurlu', 'bulut', 'bulutlu', 'rüzgar', 'rüzgarlı', 'kar', 'karlı', 'fırtına', 'gök gürültüsü', 'şimşek', 'sis', 'soğuk', 'sıcak', 'ılık', 'sıcaklık', 'derece', 'mevsim', 'ilkbahar', 'yaz', 'sonbahar', 'kış'],

    'communication': ['konuşmak', 'söylemek', 'anlatmak', 'açıklamak', 'sormak', 'cevap vermek', 'dinlemek', 'duymak', 'görmek', 'bakmak', 'okumak', 'yazmak', 'telefon', 'cep telefonu', 'aramak', 'mesaj', 'mektup', 'posta', 'e-posta', 'internet', 'web', 'sayfa', 'bilgisayar', 'klavye', 'fare', 'ekran']
  },

  serbian: {
    'family': ['породица', 'породичн', 'отац', 'мајка', 'мама', 'тата', 'син', 'кћи', 'кћерка', 'брат', 'сестра', 'деда', 'баба', 'бака', 'унук', 'ујак', 'тетка', 'рођак', 'родитељ', 'дете', 'деца', 'супруг', 'муж', 'жена'],

    'food': ['храна', 'јести', 'пити', 'вода', 'кафа', 'чај', 'млеко', 'хлеб', 'месо', 'пилетина', 'риба', 'пиринач', 'тестенина', 'воће', 'поврће', 'јабука', 'наранџа', 'поморанџа', 'банана', 'парадајз', 'пиво', 'вино', 'ресторан', 'конобар', 'мени', 'јело', 'доручак', 'ручак', 'вечера', 'кухиња', 'кувати', 'рецепт', 'укусн', 'глад', 'жеђ', 'салата', 'супа', 'чорба'],

    'travel': ['путовањ', 'путовати', 'авион', 'воз', 'аутобус', 'такси', 'ауто', 'аутомобил', 'бицикл', 'мотоцикл', 'станица', 'аеродром', 'хотел', 'карта', 'билет', 'кофер', 'пртљаг', 'пасош', 'виза', 'граница', 'туриста', 'водич', 'мапа', 'адреса', 'улица'],

    'work': ['посао', 'радити', 'запослење', 'радник', 'запослен', 'послодавац', 'канцеларија', 'фирма', 'предузеће', 'бизнис', 'шеф', 'колега', 'плата', 'новац', 'пара', 'платити', 'уговор', 'састанак', 'пројекат', 'клијент', 'производ', 'услуга', 'продаја', 'куповина', 'занимање', 'професија', 'каријера'],

    'education': ['школа', 'универзитет', 'факултет', 'образовањ', 'наставник', 'учитељ', 'професор', 'студент', 'ученик', 'разред', 'час', 'предавање', 'курс', 'испит', 'тест', 'оцена', 'књига', 'свеска', 'оловка', 'хемијска', 'учити', 'научити', 'студирати', 'читање', 'писање', 'математика', 'историја', 'наука', 'језик'],

    'health': ['здравље', 'здрав', 'болестан', 'болест', 'бол', 'болети', 'лекар', 'доктор', 'болница', 'клиника', 'медицина', 'медицинск', 'лек', 'таблета', 'третман', 'лечење', 'лечити', 'излечити', 'пацијент', 'симптом', 'температура', 'грозница', 'кашаљ', 'прехлада', 'грип', 'глава', 'стомак', 'трбух', 'срце', 'крв', 'кост', 'мишић', 'кожа', 'тело', 'рука', 'нога', 'око', 'ухо', 'нос', 'уста', 'зуб'],

    'home': ['кућа', 'дом', 'стан', 'соба', 'спаваћа', 'дневна', 'кухиња', 'купатило', 'башта', 'гаража', 'врата', 'прозор', 'зид', 'плафон', 'под', 'степенице', 'сто', 'столица', 'кревет', 'постеља', 'софа', 'фотеља', 'орман', 'полица', 'лампа', 'светло', 'огледало', 'тепих', 'завеса', 'намештај', 'кључ'],

    'nature': ['природа', 'животиња', 'пас', 'мачка', 'птица', 'риба', 'коњ', 'крава', 'свиња', 'кокош', 'дрво', 'цвет', 'биљка', 'ружа', 'трава', 'шума', 'планина', 'брег', 'брдо', 'долина', 'река', 'језеро', 'море', 'океан', 'плажа', 'острво', 'пустиња', 'поље', 'ливада', 'небо', 'сунце', 'месец', 'звезда', 'земља', 'камен', 'песак'],

    'weather': ['време', 'клима', 'сунце', 'сунчан', 'киша', 'кишовит', 'облак', 'облачн', 'ветар', 'ветровит', 'снег', 'снежан', 'олуја', 'гром', 'муња', 'магла', 'хладно', 'мраз', 'топло', 'врућ', 'температура', 'степен', 'годишње доба', 'пролеће', 'лето', 'јесен', 'зима'],

    'communication': ['говорити', 'рећи', 'причати', 'објашњавати', 'питати', 'одговорити', 'слушати', 'чути', 'видети', 'гледати', 'читати', 'писати', 'телефон', 'мобилни', 'звати', 'позвати', 'порука', 'писмо', 'пошта', 'имејл', 'интернет', 'сајт', 'страница', 'рачунар', 'компјутер', 'тастатура', 'миш', 'екран']
  },

  romanian: {
    'family': ['familie', 'familial', 'tată', 'mamă', 'fiu', 'fiică', 'frate', 'soră', 'bunic', 'bunică', 'nepot', 'unchi', 'mătușă', 'văr', 'părinte', 'copil', 'soț', 'soție'],

    'food': ['mâncare', 'mânca', 'bea', 'apă', 'cafea', 'ceai', 'lapte', 'pâine', 'carne', 'pui', 'pește', 'orez', 'paste', 'fruct', 'legumă', 'măr', 'portocală', 'banană', 'roșie', 'bere', 'vin', 'restaurant', 'chelner', 'meniu', 'fel', 'mic dejun', 'prânz', 'cină', 'bucătărie', 'găti', 'rețetă', 'gustos', 'foame', 'sete', 'salată', 'supă'],

    'travel': ['călătorie', 'călători', 'avion', 'tren', 'autobuz', 'taxi', 'mașină', 'automobil', 'bicicletă', 'motocicletă', 'stație', 'aeroport', 'hotel', 'bilet', 'valiză', 'bagaj', 'pașaport', 'viză', 'graniță', 'turist', 'ghid', 'hartă', 'adresă', 'stradă'],

    'work': ['muncă', 'lucra', 'angajare', 'angajat', 'angajator', 'birou', 'companie', 'firmă', 'afacere', 'șef', 'coleg', 'salariu', 'bani', 'plăti', 'contract', 'întâlnire', 'proiect', 'client', 'produs', 'serviciu', 'vânzare', 'cumpărare', 'meserie', 'profesie', 'carieră'],

    'education': ['școală', 'universitate', 'educație', 'profesor', 'învățător', 'student', 'elev', 'clasă', 'lecție', 'curs', 'examen', 'test', 'notă', 'carte', 'caiet', 'creion', 'stilou', 'învăța', 'studia', 'citire', 'scriere', 'matematică', 'istorie', 'știință', 'limbă'],

    'health': ['sănătate', 'sănătos', 'bolnav', 'boală', 'durere', 'doare', 'doctor', 'medic', 'spital', 'clinică', 'medicină', 'medical', 'medicament', 'pastilă', 'tratament', 'trata', 'vindeca', 'pacient', 'simptom', 'febră', 'tuse', 'răceală', 'gripă', 'cap', 'stomac', 'burtă', 'inimă', 'sânge', 'os', 'mușchi', 'piele', 'corp', 'mână', 'picior', 'ochi', 'ureche', 'nas', 'gură', 'dinte'],

    'home': ['casă', 'apartament', 'cameră', 'dormitor', 'living', 'bucătărie', 'baie', 'grădină', 'garaj', 'ușă', 'fereastră', 'perete', 'tavan', 'podea', 'scară', 'masă', 'scaun', 'pat', 'canapea', 'dulap', 'raft', 'lampă', 'oglindă', 'covor', 'perdea', 'mobilă', 'cheie'],

    'nature': ['natură', 'animal', 'câine', 'pisică', 'pasăre', 'pește', 'cal', 'vacă', 'porc', 'găină', 'copac', 'floare', 'plantă', 'trandafir', 'iarbă', 'pădure', 'munte', 'deal', 'vale', 'râu', 'lac', 'mare', 'ocean', 'plajă', 'insulă', 'deșert', 'câmp', 'cer', 'soare', 'lună', 'stea', 'pământ', 'piatră', 'nisip'],

    'weather': ['vreme', 'climă', 'soare', 'ploaie', 'nor', 'vânt', 'zăpadă', 'furtună', 'tunet', 'fulger', 'ceață', 'frig', 'cald', 'temperatură', 'grad', 'anotimp', 'primăvară', 'vară', 'toamnă', 'iarnă'],

    'communication': ['vorbi', 'spune', 'povesti', 'explica', 'întreba', 'răspunde', 'asculta', 'auzi', 'vedea', 'privi', 'citi', 'scrie', 'telefon', 'mobil', 'suna', 'mesaj', 'scrisoare', 'poștă', 'email', 'internet', 'pagină', 'calculator', 'computer', 'tastatură', 'mouse', 'ecran']
  }
};

async function addThemes() {
  try {
    if (!THEME_KEYWORDS[language]) {
      console.error(`❌ No theme keywords defined for ${language}`);
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`🎨 Adding themes to ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    const keywords = THEME_KEYWORDS[language];
    let totalThemed = 0;

    for (const [theme, themeKeywords] of Object.entries(keywords)) {
      const likeConditions = themeKeywords.map((_, i) => `LOWER(word) LIKE $${i + 1}`).join(' OR ');

      const result = await pool.query(`
        UPDATE source_words_${language}
        SET theme = $${themeKeywords.length + 1}
        WHERE theme = 'general'
        AND (${likeConditions})
      `, [...themeKeywords.map(k => `%${k}%`), theme]);

      if (result.rowCount > 0) {
        console.log(`   ✅ ${theme}: ${result.rowCount} words`);
        totalThemed += result.rowCount;
      }
    }

    // Count remaining general words
    const generalCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_${language}
      WHERE theme = 'general'
    `);

    console.log(`\n   📦 general: ${generalCount.rows[0].count} words`);
    console.log(`   ✨ Total themed: ${totalThemed} words\n`);

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

addThemes();
