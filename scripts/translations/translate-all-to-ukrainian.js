const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Comprehensive German to Ukrainian translation dictionary
const germanToUkrainian = {
  // Articles
  "der": "означений артикль (чоловічий рід)",
  "die": "означений артикль (жіночий рід/множина)",
  "das": "означений артикль (середній рід)",
  "ein": "неозначений артикль (чоловічий/середній рід)",
  "eine": "неозначений артикль (жіночий рід)",

  // Personal Pronouns
  "ich": "я",
  "du": "ти (неформально)",
  "er": "він",
  "sie": "вона/вони",
  "es": "воно",
  "wir": "ми",
  "ihr": "ви (неформально, множина)",
  "Sie": "ви (формально)",
  "mich": "мене (знахідний відмінок)",
  "dich": "тебе (знахідний відмінок)",
  "ihn": "його",
  "uns": "нас",
  "euch": "вас (знахідний відмінок)",
  "mir": "мені (давальний відмінок)",
  "dir": "тобі (давальний відмінок)",
  "ihm": "йому",

  // Greetings & Common Phrases
  "Hallo": "привіт",
  "Guten Morgen": "доброго ранку",
  "Guten Tag": "добрий день",
  "Guten Abend": "добрий вечір",
  "Gute Nacht": "доброї ночі",
  "Auf Wiedersehen": "до побачення",
  "Tschüss": "бувай",
  "Bis bald": "до зустрічі",
  "Bis später": "побачимось пізніше",
  "Bis morgen": "до завтра",
  "Willkommen": "ласкаво просимо",

  // Politeness
  "ja": "так",
  "nein": "ні",
  "bitte": "будь ласка/прошу",
  "danke": "дякую",
  "Danke schön": "дуже дякую",
  "Entschuldigung": "вибачте",
  "Verzeihung": "перепрошую",

  // Question Words
  "wie": "як",
  "was": "що",
  "wo": "де",
  "wer": "хто",
  "wann": "коли",
  "warum": "чому",
  "welche": "який/яка/яке",
  "welcher": "який (чоловічий рід)",
  "welches": "яке (середній рід)",
  "wohin": "куди",
  "woher": "звідки",
  "wessen": "чий",
  "wieviel": "скільки",

  // Numbers
  "null": "нуль",
  "eins": "один",
  "zwei": "два",
  "drei": "три",
  "vier": "чотири",
  "fünf": "п'ять",
  "sechs": "шість",
  "sieben": "сім",
  "acht": "вісім",
  "neun": "дев'ять",
  "zehn": "десять",
  "elf": "одинадцять",
  "zwölf": "дванадцять",
  "dreizehn": "тринадцять",
  "vierzehn": "чотирнадцять",
  "fünfzehn": "п'ятнадцять",
  "sechzehn": "шістнадцять",
  "siebzehn": "сімнадцять",
  "achtzehn": "вісімнадцять",
  "neunzehn": "дев'ятнадцять",
  "zwanzig": "двадцять",
  "dreißig": "тридцять",
  "vierzig": "сорок",
  "fünfzig": "п'ятдесят",
  "sechzig": "шістдесят",
  "siebzig": "сімдесят",
  "achtzig": "вісімдесят",
  "neunzig": "дев'яносто",
  "hundert": "сто",
  "tausend": "тисяча",
  "Million": "мільйон",

  // Common Verbs
  "sein": "бути",
  "haben": "мати",
  "werden": "ставати",
  "können": "могти/вміти",
  "müssen": "мусити/повинен",
  "sollen": "слід/повинен",
  "wollen": "хотіти",
  "dürfen": "мати дозвіл/сміти",
  "mögen": "любити/подобатися",
  "möchten": "хотілося б",
  "machen": "робити",
  "gehen": "йти/ходити",
  "kommen": "приходити",
  "sehen": "бачити",
  "hören": "чути/слухати",
  "sprechen": "говорити/розмовляти",
  "sagen": "казати",
  "wissen": "знати (факти)",
  "kennen": "знати (людей/місця)",
  "denken": "думати",
  "glauben": "вірити",
  "nehmen": "брати",
  "geben": "давати",
  "bringen": "приносити",
  "finden": "знаходити",
  "suchen": "шукати",
  "leben": "жити",
  "wohnen": "проживати/мешкати",
  "arbeiten": "працювати",
  "lernen": "вчити/навчатися",
  "studieren": "студіювати/вивчати",
  "lesen": "читати",
  "schreiben": "писати",
  "essen": "їсти",
  "trinken": "пити",
  "kochen": "готувати/варити",
  "kaufen": "купувати",
  "verkaufen": "продавати",
  "fahren": "їхати/їздити",
  "fliegen": "літати",
  "laufen": "бігти/ходити",
  "rennen": "бігти",
  "stehen": "стояти",
  "sitzen": "сидіти",
  "liegen": "лежати",
  "schlafen": "спати",
  "aufwachen": "прокидатися",
  "aufstehen": "вставати",
  "bleiben": "залишатися",
  "beginnen": "починати",
  "anfangen": "починати/розпочинати",
  "enden": "закінчуватися",
  "aufhören": "припиняти",
  "helfen": "допомагати",
  "brauchen": "потребувати",
  "warten": "чекати",
  "öffnen": "відкривати",
  "schließen": "закривати",
  "zeigen": "показувати",
  "erklären": "пояснювати",
  "fragen": "питати",
  "antworten": "відповідати",
  "spielen": "грати",
  "singen": "співати",
  "tanzen": "танцювати",
  "lachen": "сміятися",
  "weinen": "плакати",
  "lieben": "кохати/любити",
  "hassen": "ненавидіти",
  "verstehen": "розуміти",
  "vergessen": "забувати",
  "erinnern": "пам'ятати/нагадувати",
  "hoffen": "сподіватися",
  "wünschen": "бажати",
  "träumen": "мріяти/снитися",
  "bezahlen": "платити",
  "kosten": "коштувати",
  "bedeuten": "означати",
  "heißen": "називатися/звати",
  "passieren": "траплятися/ставатися",
  "geschehen": "відбуватися",
  "ändern": "змінювати",
  "versuchen": "пробувати/намагатися",
  "gewinnen": "вигравати/перемагати",
  "verlieren": "програвати/втрачати",
  "treffen": "зустрічати",
  "besuchen": "відвідувати",
  "erreichen": "досягати",
  "bekommen": "отримувати",
  "erhalten": "одержувати",
  "legen": "класти",
  "stellen": "ставити",
  "setzen": "садити/ставити",
  "hängen": "висіти/вішати",
  "tragen": "носити/нести",
  "ziehen": "тягти/тягнути",
  "drücken": "натискати/штовхати",
  "werfen": "кидати",
  "fangen": "ловити",
  "halten": "тримати/зупиняти",
  "lassen": "дозволяти/залишати",
  "folgen": "слідувати",
  "führen": "вести/керувати",
  "steigen": "підніматися",
  "fallen": "падати",
  "springen": "стрибати",
  "schwimmen": "плавати",
  "reisen": "подорожувати",

  // Common Nouns
  "Mann": "чоловік",
  "Frau": "жінка",
  "Kind": "дитина",
  "Junge": "хлопчик",
  "Mädchen": "дівчинка",
  "Baby": "немовля",
  "Leute": "люди",
  "Mensch": "людина",
  "Person": "особа/персона",
  "Freund": "друг",
  "Freundin": "подруга",
  "Familie": "сім'я",
  "Vater": "батько",
  "Mutter": "мати",
  "Eltern": "батьки",
  "Sohn": "син",
  "Tochter": "дочка",
  "Bruder": "брат",
  "Schwester": "сестра",
  "Großvater": "дідусь",
  "Großmutter": "бабуся",
  "Opa": "дід",
  "Oma": "баба",
  "Onkel": "дядько",
  "Tante": "тітка",
  "Cousin": "двоюрідний брат",
  "Cousine": "двоюрідна сестра",
  "Ehemann": "чоловік (подружжя)",
  "Ehefrau": "дружина",
  "Partner": "партнер",

  // Places
  "Haus": "будинок",
  "Wohnung": "квартира",
  "Zimmer": "кімната",
  "Küche": "кухня",
  "Bad": "ванна",
  "Schlafzimmer": "спальня",
  "Wohnzimmer": "вітальня",
  "Garten": "сад",
  "Straße": "вулиця",
  "Stadt": "місто",
  "Dorf": "село",
  "Land": "країна/земля",
  "Welt": "світ",
  "Ort": "місце",
  "Platz": "площа/місце",
  "Markt": "ринок",
  "Geschäft": "магазин/крамниця",
  "Laden": "магазин",
  "Supermarkt": "супермаркет",
  "Restaurant": "ресторан",
  "Café": "кафе",
  "Hotel": "готель",
  "Schule": "школа",
  "Universität": "університет",
  "Bibliothek": "бібліотека",
  "Krankenhaus": "лікарня",
  "Apotheke": "аптека",
  "Bank": "банк",
  "Post": "пошта",
  "Bahnhof": "вокзал",
  "Flughafen": "аеропорт",
  "Kirche": "церква",
  "Museum": "музей",
  "Theater": "театр",
  "Kino": "кінотеатр",
  "Park": "парк",
  "Büro": "офіс",
  "Firma": "фірма",

  // Food & Drink
  "Essen": "їжа",
  "Trinken": "напій",
  "Wasser": "вода",
  "Milch": "молоко",
  "Kaffee": "кава",
  "Tee": "чай",
  "Saft": "сік",
  "Bier": "пиво",
  "Wein": "вино",
  "Brot": "хліб",
  "Brötchen": "булочка",
  "Butter": "масло",
  "Käse": "сир",
  "Fleisch": "м'ясо",
  "Fisch": "риба",
  "Huhn": "курка/курятина",
  "Schwein": "свиня/свинина",
  "Rind": "яловичина/корова",
  "Wurst": "ковбаса",
  "Ei": "яйце",
  "Gemüse": "овочі",
  "Obst": "фрукти",
  "Apfel": "яблуко",
  "Banane": "банан",
  "Orange": "апельсин",
  "Kartoffel": "картопля",
  "Tomate": "помідор",
  "Salat": "салат",
  "Reis": "рис",
  "Nudeln": "локшина/макарони",
  "Suppe": "суп",
  "Pizza": "піца",
  "Kuchen": "пиріг/кекс",
  "Torte": "торт",
  "Zucker": "цукор",
  "Salz": "сіль",
  "Pfeffer": "перець",

  // Time
  "Zeit": "час",
  "Tag": "день",
  "Woche": "тиждень",
  "Monat": "місяць",
  "Jahr": "рік",
  "Stunde": "година",
  "Minute": "хвилина",
  "Sekunde": "секунда",
  "Morgen": "ранок",
  "Vormittag": "передполудень",
  "Mittag": "полудень",
  "Nachmittag": "післяполудень",
  "Abend": "вечір",
  "Nacht": "ніч",
  "heute": "сьогодні",
  "gestern": "вчора",
  "morgen": "завтра",
  "jetzt": "зараз",
  "bald": "скоро",
  "später": "пізніше",
  "früh": "рано",
  "spät": "пізно",
  "immer": "завжди",
  "nie": "ніколи",
  "manchmal": "іноді",
  "oft": "часто",
  "selten": "рідко",

  // Days of the Week
  "Montag": "понеділок",
  "Dienstag": "вівторок",
  "Mittwoch": "середа",
  "Donnerstag": "четвер",
  "Freitag": "п'ятниця",
  "Samstag": "субота",
  "Sonntag": "неділя",

  // Months
  "Januar": "січень",
  "Februar": "лютий",
  "März": "березень",
  "April": "квітень",
  "Mai": "травень",
  "Juni": "червень",
  "Juli": "липень",
  "August": "серпень",
  "September": "вересень",
  "Oktober": "жовтень",
  "November": "листопад",
  "Dezember": "грудень",

  // Seasons
  "Frühling": "весна",
  "Sommer": "літо",
  "Herbst": "осінь",
  "Winter": "зима",

  // Weather
  "Wetter": "погода",
  "Sonne": "сонце",
  "Regen": "дощ",
  "Schnee": "сніг",
  "Wind": "вітер",
  "Wolke": "хмара",
  "Himmel": "небо",
  "warm": "тепло/теплий",
  "kalt": "холодно/холодний",
  "heiß": "гаряче/гарячий",
  "kühl": "прохолодно/прохолодний",
  "sonnig": "сонячний",
  "regnerisch": "дощовий",

  // Colors
  "Farbe": "колір",
  "weiß": "білий",
  "schwarz": "чорний",
  "rot": "червоний",
  "blau": "синій",
  "grün": "зелений",
  "gelb": "жовтий",
  "orange": "помаранчевий",
  "rosa": "рожевий",
  "lila": "фіолетовий",
  "braun": "коричневий",
  "grau": "сірий",

  // Adjectives
  "gut": "добрий/хороший",
  "schlecht": "поганий",
  "groß": "великий/високий",
  "klein": "маленький",
  "lang": "довгий",
  "kurz": "короткий",
  "alt": "старий",
  "neu": "новий",
  "jung": "молодий",
  "schön": "гарний/красивий",
  "hässlich": "потворний",
  "schnell": "швидкий",
  "langsam": "повільний",
  "leicht": "легкий",
  "schwer": "важкий/складний",
  "richtig": "правильний",
  "falsch": "неправильний/хибний",
  "teuer": "дорогий",
  "billig": "дешевий",
  "voll": "повний",
  "leer": "порожній",
  "sauber": "чистий",
  "schmutzig": "брудний",
  "einfach": "простий",
  "kompliziert": "складний",
  "interessant": "цікавий",
  "langweilig": "нудний",
  "wichtig": "важливий",
  "unwichtig": "неважливий",
  "möglich": "можливий",
  "unmöglich": "неможливий",
  "nötig": "потрібний/необхідний",
  "fertig": "готовий",
  "glücklich": "щасливий",
  "traurig": "сумний",
  "müde": "втомлений",
  "wach": "неспання/бадьорий",
  "gesund": "здоровий",
  "krank": "хворий",
  "stark": "сильний",
  "schwach": "слабкий",
  "nett": "милий",
  "freundlich": "дружній/привітний",
  "höflich": "ввічливий",
  "unhöflich": "неввічливий",
  "laut": "голосний",
  "leise": "тихий",
  "hell": "світлий/яскравий",
  "dunkel": "темний",
  "offen": "відкритий",
  "geschlossen": "закритий",
  "vorsichtig": "обережний",
  "gefährlich": "небезпечний",
  "sicher": "безпечний/певний",
  "bekannt": "відомий",
  "unbekannt": "невідомий",

  // Adverbs & Prepositions
  "sehr": "дуже",
  "zu": "до/надто",
  "auch": "також/теж",
  "nicht": "не",
  "nur": "тільки/лише",
  "aber": "але",
  "oder": "або",
  "und": "і/та",
  "für": "для",
  "mit": "з/із",
  "ohne": "без",
  "bei": "біля/при",
  "von": "від/з",
  "nach": "після/до",
  "vor": "перед/до",
  "in": "в/у",
  "an": "на/біля",
  "auf": "на",
  "über": "над/про",
  "unter": "під",
  "zwischen": "між",
  "neben": "поруч/біля",
  "hinter": "за/позаду",
  "durch": "через/крізь",
  "gegen": "проти",
  "um": "навколо/о",
  "bis": "до (часу)",
  "seit": "з (часу)",
  "während": "під час",
  "hier": "тут",
  "dort": "там",
  "da": "там/тут",
  "oben": "вгорі/нагорі",
  "unten": "внизу",
  "links": "ліворуч",
  "rechts": "праворуч",
  "gerade": "прямо",
  "zurück": "назад",
  "vorne": "спереду",
  "hinten": "ззаду",

  // Objects & Things
  "Ding": "річ",
  "Sache": "річ/справа",
  "Geld": "гроші",
  "Euro": "євро",
  "Preis": "ціна",
  "Auto": "автомобіль/машина",
  "Bus": "автобус",
  "Zug": "поїзд",
  "Fahrrad": "велосипед",
  "Flugzeug": "літак",
  "Schiff": "корабель",
  "Buch": "книга",
  "Zeitung": "газета",
  "Zeitschrift": "журнал",
  "Brief": "лист",
  "Handy": "мобільний телефон",
  "Telefon": "телефон",
  "Computer": "комп'ютер",
  "Internet": "інтернет",
  "Fernseher": "телевізор",
  "Radio": "радіо",
  "Musik": "музика",
  "Bild": "картина/зображення",
  "Foto": "фотографія",
  "Film": "фільм",
  "Tisch": "стіл",
  "Stuhl": "стілець",
  "Bett": "ліжко",
  "Sofa": "диван",
  "Fenster": "вікно",
  "Tür": "двері",
  "Wand": "стіна",
  "Boden": "підлога/земля",
  "Decke": "стеля/ковдра",
  "Lampe": "лампа",
  "Uhr": "годинник",
  "Schlüssel": "ключ",
  "Tasche": "сумка/кишеня",
  "Koffer": "валіза",
  "Rucksack": "рюкзак",
  "Kleidung": "одяг",
  "Hemd": "сорочка",
  "Hose": "штани",
  "Kleid": "сукня",
  "Rock": "спідниця",
  "Jacke": "куртка",
  "Mantel": "пальто",
  "Schuh": "черевик/туфля",
  "Socke": "шкарпетка",
  "Hut": "капелюх",
  "Brille": "окуляри",

  // Body Parts
  "Körper": "тіло",
  "Kopf": "голова",
  "Gesicht": "обличчя",
  "Auge": "око",
  "Ohr": "вухо",
  "Nase": "ніс",
  "Mund": "рот",
  "Zahn": "зуб",
  "Haar": "волосся",
  "Hals": "шия/горло",
  "Hand": "рука (кисть)",
  "Finger": "палець",
  "Arm": "рука (від плеча)",
  "Bein": "нога",
  "Fuß": "стопа",
  "Rücken": "спина",
  "Bauch": "живіт",
  "Herz": "серце",

  // Nature
  "Natur": "природа",
  "Baum": "дерево",
  "Blume": "квітка",
  "Gras": "трава",
  "Pflanze": "рослина",
  "Tier": "тварина",
  "Hund": "собака",
  "Katze": "кіт/кішка",
  "Vogel": "птах",
  "Pferd": "кінь",
  "Kuh": "корова",
  "Schwein": "свиня",
  "Maus": "миша",
  "Berg": "гора",
  "Fluss": "ріка",
  "See": "озеро",
  "Meer": "море",
  "Ozean": "океан",
  "Strand": "пляж",
  "Wald": "ліс",
  "Feld": "поле",
  "Wiese": "луг",
  "Insel": "острів",

  // Work & Education
  "Arbeit": "робота/праця",
  "Beruf": "професія",
  "Chef": "шеф/начальник",
  "Kollege": "колега",
  "Kollegin": "колега (жінка)",
  "Lehrer": "вчитель",
  "Lehrerin": "вчителька",
  "Schüler": "учень",
  "Schülerin": "учениця",
  "Student": "студент",
  "Studentin": "студентка",
  "Arzt": "лікар",
  "Ärztin": "лікарка",
  "Krankenschwester": "медсестра",
  "Polizist": "поліцейський",
  "Verkäufer": "продавець",
  "Verkäuferin": "продавчиня",

  // Abstract Concepts
  "Leben": "життя",
  "Tod": "смерть",
  "Liebe": "кохання/любов",
  "Glück": "щастя/удача",
  "Problem": "проблема",
  "Lösung": "рішення/розв'язок",
  "Frage": "питання",
  "Antwort": "відповідь",
  "Idee": "ідея",
  "Plan": "план",
  "Grund": "причина/підстава",
  "Weg": "шлях/дорога",
  "Ziel": "ціль/мета",
  "Anfang": "початок",
  "Ende": "кінець",
  "Teil": "частина",
  "Stück": "шматок/кусок",
  "Gruppe": "група",
  "Name": "ім'я/назва",
  "Wort": "слово",
  "Sprache": "мова",
  "Deutsch": "німецька мова",
  "Englisch": "англійська мова",
  "Beispiel": "приклад",
  "Information": "інформація",
  "Nachricht": "повідомлення/новина",
  "Geschichte": "історія/оповідання",
  "Recht": "право",
  "Gesetz": "закон",
  "Regel": "правило",
  "Kultur": "культура",
  "Kunst": "мистецтво",
  "Wissenschaft": "наука",
  "Politik": "політика",
  "Regierung": "уряд",
  "Krieg": "війна",
  "Frieden": "мир",

  // Quantity
  "viel": "багато",
  "wenig": "мало",
  "mehr": "більше",
  "weniger": "менше",
  "meiste": "найбільше",
  "alle": "всі",
  "einige": "деякі/кілька",
  "mehrere": "декілька/кілька",
  "andere": "інший/інші",
  "beide": "обидва",
  "kein": "жодний/ніякий",
  "ganz": "весь/цілий",
  "halb": "половина",

  // Ordinal numbers
  "erste": "перший",
  "zweite": "другий",
  "dritte": "третій",
  "vierte": "четвертий",
  "fünfte": "п'ятий",
  "letzte": "останній",

  // Common expressions
  "schon": "вже",
  "noch": "ще",
  "wieder": "знову",
  "ziemlich": "досить",
  "fast": "майже",
  "etwa": "приблизно",
  "genug": "достатньо",
  "zusammen": "разом",
  "allein": "один/самотній",
  "selbst": "сам/сама",
  "gegenseitig": "взаємний",
  "einander": "один одного",
};

// Helper function to extract base word from German word with article
function extractBaseWord(germanWord) {
  // Remove articles (der, die, das, ein, eine)
  const withoutArticle = germanWord
    .replace(/^(der|die|das|ein|eine)\s+/i, '')
    .replace(/\s*\/\s*/g, '/'); // Normalize slashes

  return withoutArticle;
}

// Helper function to get translation
function getTranslation(germanWord) {
  // Try exact match first
  if (germanToUkrainian[germanWord]) {
    return germanToUkrainian[germanWord];
  }

  // Try case-insensitive match
  const lowerWord = germanWord.toLowerCase();
  if (germanToUkrainian[lowerWord]) {
    return germanToUkrainian[lowerWord];
  }

  // Try without article
  const baseWord = extractBaseWord(germanWord);
  if (baseWord !== germanWord && germanToUkrainian[baseWord]) {
    return germanToUkrainian[baseWord];
  }

  // Try base word lowercase
  const lowerBase = baseWord.toLowerCase();
  if (lowerBase !== baseWord && germanToUkrainian[lowerBase]) {
    return germanToUkrainian[lowerBase];
  }

  // Try to handle words with alternatives (like "Oma / Großmutter")
  if (germanWord.includes('/')) {
    const parts = germanWord.split('/');
    for (const part of parts) {
      const trimmed = part.trim();
      const result = getTranslation(trimmed);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

async function translateAllToUkrainian() {
  const client = await pool.connect();

  try {
    console.log('🇺🇦 Translating ALL German words → Ukrainian...\n');

    // First, get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM source_words_german
    `);
    const totalWords = parseInt(countResult.rows[0].total);
    console.log(`Total German words in database: ${totalWords}\n`);

    // Fetch ALL German words
    const words = await client.query(`
      SELECT id, word, level, example_de
      FROM source_words_german
      ORDER BY id
    `);

    console.log(`Processing ${words.rows.length} German words...\n`);

    let translated = 0;
    let skipped = 0;
    let notFound = 0;
    const missingWords = [];
    const BATCH_SIZE = 100;

    for (const row of words.rows) {
      // Check if translation already exists
      const existing = await client.query(`
        SELECT id FROM target_translations_ukrainian
        WHERE source_lang = 'de' AND source_word_id = $1
      `, [row.id]);

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Get Ukrainian translation
      const translation = getTranslation(row.word);

      if (!translation) {
        notFound++;
        missingWords.push({ id: row.id, word: row.word, level: row.level });
        continue;
      }

      // Insert translation
      await client.query(`
        INSERT INTO target_translations_ukrainian
        (source_lang, source_word_id, translation)
        VALUES ('de', $1, $2)
      `, [row.id, translation]);

      translated++;

      // Progress reporting
      if (translated % BATCH_SIZE === 0) {
        const progress = ((translated + skipped + notFound) / totalWords * 100).toFixed(1);
        console.log(`✓ Progress: ${translated} translated, ${skipped} skipped, ${notFound} not found (${progress}%)`);
      }
    }

    console.log(`\n✅ Translation complete:`);
    console.log(`   Total words processed: ${words.rows.length}`);
    console.log(`   Successfully translated: ${translated}`);
    console.log(`   Already existed (skipped): ${skipped}`);
    console.log(`   Not found in dictionary: ${notFound}`);

    if (missingWords.length > 0) {
      console.log(`\n📋 Words needing manual translation (first 50):`);
      missingWords.slice(0, 50).forEach(w => {
        console.log(`   "${w.word}", // ${w.level}`);
      });

      if (missingWords.length > 50) {
        console.log(`   ... and ${missingWords.length - 50} more`);
      }

      console.log(`\n💡 Total words needing translation: ${missingWords.length}`);
    }

  } catch (err) {
    console.error('❌ Error during translation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

translateAllToUkrainian();
