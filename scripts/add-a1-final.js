const collections = [
  {
    name: "A1: Weather and Seasons",
    description: "Basic vocabulary for weather conditions and seasons",
    level: "A1",
    words: [
      { word: "Wetter", translation: "погода", example: "Das Wetter ist schön heute." },
      { word: "Sonne", translation: "солнце", example: "Die Sonne scheint hell." },
      { word: "Regen", translation: "дождь", example: "Es gibt viel Regen im Herbst." },
      { word: "Wind", translation: "ветер", example: "Der Wind ist stark." },
      { word: "Schnee", translation: "снег", example: "Es schneit im Winter." },
      { word: "Wolke", translation: "облако", example: "Die Wolken sind grau." },
      { word: "Frühling", translation: "весна", example: "Der Frühling ist schön." },
      { word: "Sommer", translation: "лето", example: "Im Sommer ist es warm." },
      { word: "Herbst", translation: "осень", example: "Der Herbst bringt bunte Blätter." },
      { word: "Winter", translation: "зима", example: "Im Winter schneit es oft." },
      { word: "Blitz", translation: "молния", example: "Der Blitz leuchtet am Himmel." },
      { word: "Donner", translation: "гром", example: "Der Donner ist laut." },
      { word: "Gewitter", translation: "гроза", example: "Das Gewitter ist gefährlich." },
      { word: "Eis", translation: "лёд", example: "Das Eis ist glatt." },
      { word: "Nebel", translation: "туман", example: "Der Nebel ist dick." }
    ]
  },
  {
    name: "A1: Basic Verbs",
    description: "Essential verbs for everyday communication",
    level: "A1",
    words: [
      { word: "machen", translation: "делать", example: "Ich mache Hausaufgaben." },
      { word: "gehen", translation: "идти", example: "Ich gehe zur Schule." },
      { word: "kommen", translation: "приходить", example: "Du kommst um 8 Uhr." },
      { word: "sprechen", translation: "говорить", example: "Wir sprechen Deutsch." },
      { word: "hören", translation: "слышать", example: "Ich höre Musik." },
      { word: "sehen", translation: "видеть", example: "Sie sieht den Film." },
      { word: "nehmen", translation: "брать", example: "Er nimmt das Buch." },
      { word: "geben", translation: "давать", example: "Ich gebe dir ein Geschenk." },
      { word: "verstehen", translation: "понимать", example: "Du verstehst die Aufgabe." },
      { word: "helfen", translation: "помогать", example: "Sie hilft ihrer Mutter." },
      { word: "öffnen", translation: "открывать", example: "Ich öffne die Tür." },
      { word: "schließen", translation: "закрывать", example: "Du schließt das Fenster." },
      { word: "schreiben", translation: "писать", example: "Ich schreibe einen Brief." },
      { word: "lesen", translation: "читать", example: "Sie liest das Buch." },
      { word: "essen", translation: "есть", example: "Wir essen Mittagessen." }
    ]
  },
  {
    name: "A1: House and Furniture",
    description: "Common household items and rooms",
    level: "A1",
    words: [
      { word: "Haus", translation: "дом", example: "Das Haus ist groß." },
      { word: "Wohnung", translation: "квартира", example: "Die Wohnung hat drei Zimmer." },
      { word: "Zimmer", translation: "комната", example: "Das Zimmer ist hell." },
      { word: "Küche", translation: "кухня", example: "Ich koche in der Küche." },
      { word: "Schlafzimmer", translation: "спальня", example: "Das Schlafzimmer ist ruhig." },
      { word: "Badezimmer", translation: "ванная комната", example: "Das Badezimmer ist klein." },
      { word: "Wohnzimmer", translation: "гостиная", example: "Im Wohnzimmer sitze ich." },
      { word: "Tür", translation: "дверь", example: "Die Tür ist offen." },
      { word: "Fenster", translation: "окно", example: "Das Fenster ist groß." },
      { word: "Bett", translation: "кровать", example: "Das Bett ist bequem." },
      { word: "Tisch", translation: "стол", example: "Der Tisch ist rund." },
      { word: "Stuhl", translation: "стул", example: "Der Stuhl ist hart." },
      { word: "Sofa", translation: "диван", example: "Das Sofa ist weich." },
      { word: "Schrank", translation: "шкаф", example: "Der Schrank ist groß." },
      { word: "Lampe", translation: "лампа", example: "Die Lampe ist an." },
      { word: "Spiegel", translation: "зеркало", example: "Der Spiegel ist sauber." },
      { word: "Teppich", translation: "ковёр", example: "Der Teppich ist rot." }
    ]
  },
  {
    name: "A1: Days, Months, Time",
    description: "Days of the week, months, and basic time expressions",
    level: "A1",
    words: [
      { word: "Montag", translation: "понедельник", example: "Am Montag gehe ich zur Schule." },
      { word: "Dienstag", translation: "вторник", example: "Am Dienstag habe ich Unterricht." },
      { word: "Mittwoch", translation: "среда", example: "Am Mittwoch spielen wir Fußball." },
      { word: "Donnerstag", translation: "четверг", example: "Am Donnerstag gehe ich ins Kino." },
      { word: "Freitag", translation: "пятница", example: "Am Freitag bin ich frei." },
      { word: "Samstag", translation: "суббота", example: "Am Samstag schlafe ich lange." },
      { word: "Sonntag", translation: "воскресенье", example: "Am Sonntag besuche ich Großeltern." },
      { word: "Januar", translation: "январь", example: "Der Januar ist kalt." },
      { word: "Februar", translation: "февраль", example: "Im Februar schneit es oft." },
      { word: "März", translation: "март", example: "Der März bringt Frühling." },
      { word: "April", translation: "апрель", example: "Im April regnet es." },
      { word: "Mai", translation: "май", example: "Der Mai ist schön." },
      { word: "Juni", translation: "июнь", example: "Im Juni ist es warm." },
      { word: "Juli", translation: "июль", example: "Der Juli ist der heißeste Monat." },
      { word: "August", translation: "август", example: "Im August fahre ich in den Urlaub." },
      { word: "September", translation: "сентябрь", example: "Im September beginnt die Schule." },
      { word: "Oktober", translation: "октябрь", example: "Der Oktober ist kühl." },
      { word: "November", translation: "ноябрь", example: "Im November regnet es viel." },
      { word: "Dezember", translation: "декабрь", example: "Im Dezember ist Weihnachten." }
    ]
  },
  {
    name: "A1: Basic Adjectives",
    description: "Common descriptive words for beginners",
    level: "A1",
    words: [
      { word: "groß", translation: "большой", example: "Das Haus ist groß." },
      { word: "klein", translation: "маленький", example: "Das Kind ist klein." },
      { word: "schön", translation: "красивый", example: "Das Mädchen ist schön." },
      { word: "hässlich", translation: "некрасивый", example: "Der Hund ist hässlich." },
      { word: "alt", translation: "старый", example: "Der Mann ist alt." },
      { word: "jung", translation: "молодой", example: "Das Kind ist jung." },
      { word: "neu", translation: "новый", example: "Das Auto ist neu." },
      { word: "heiß", translation: "горячий", example: "Das Wasser ist heiß." },
      { word: "kalt", translation: "холодный", example: "Der Winter ist kalt." },
      { word: "warm", translation: "тёплый", example: "Der Sommer ist warm." },
      { word: "schnell", translation: "быстрый", example: "Das Auto ist schnell." },
      { word: "langsam", translation: "медленный", example: "Die Schildkröte ist langsam." },
      { word: "dünn", translation: "тонкий", example: "Das Buch ist dünn." },
      { word: "dick", translation: "толстый", example: "Das Buch ist dick." },
      { word: "hoch", translation: "высокий", example: "Der Berg ist hoch." }
    ]
  },
  {
    name: "A1: Question Words",
    description: "Essential question words for asking information",
    level: "A1",
    words: [
      { word: "Wer", translation: "кто", example: "Wer bist du?" },
      { word: "Was", translation: "что", example: "Was ist das?" },
      { word: "Wo", translation: "где", example: "Wo ist das Haus?" },
      { word: "Wohin", translation: "куда", example: "Wohin gehst du?" },
      { word: "Woher", translation: "откуда", example: "Woher kommst du?" },
      { word: "Wann", translation: "когда", example: "Wann kommst du?" },
      { word: "Warum", translation: "почему", example: "Warum fragst du?" },
      { word: "Wie", translation: "как", example: "Wie geht es dir?" },
      { word: "Welch-", translation: "какой", example: "Welches Auto möchtest du?" },
      { word: "Wie viel", translation: "сколько", example: "Wie viel kostet das?" },
      { word: "Welches", translation: "какой", example: "Welches Zimmer ist dein?" }
    ]
  },
  {
    name: "A1: Basic Prepositions",
    description: "Essential prepositions for spatial relationships",
    level: "A1",
    words: [
      { word: "in", translation: "в", example: "Der Stift ist in der Tasche." },
      { word: "auf", translation: "на", example: "Das Buch liegt auf dem Tisch." },
      { word: "unter", translation: "под", example: "Die Katze ist unter dem Bett." },
      { word: "vor", translation: "перед", example: "Das Auto steht vor dem Haus." },
      { word: "hinter", translation: "позади", example: "Der Garten ist hinter dem Haus." },
      { word: "neben", translation: "рядом", example: "Das Kind sitzt neben der Mutter." },
      { word: "zwischen", translation: "между", example: "Das Haus ist zwischen zwei Bäumen." },
      { word: "über", translation: "над", example: "Die Lampe hängt über dem Tisch." },
      { word: "mit", translation: "с", example: "Ich gehe mit meinem Freund." },
      { word: "ohne", translation: "без", example: "Ich trinke Kaffee ohne Zucker." },
      { word: "bei", translation: "у", example: "Die Katze ist bei mir." },
      { word: "von", translation: "от", example: "Das Buch ist von meinem Lehrer." },
      { word: "zu", translation: "к", example: "Ich gehe zu meinem Freund." },
      { word: "bis", translation: "до", example: "Ich arbeite bis 5 Uhr." },
      { word: "seit", translation: "с", example: "Ich bin hier seit zwei Jahren." }
    ]
  },
  {
    name: "A1: Simple Connectors",
    description: "Basic words to connect ideas and sentences",
    level: "A1",
    words: [
      { word: "und", translation: "и", example: "Ich lese und schreibe." },
      { word: "aber", translation: "но", example: "Das ist schön, aber teuer." },
      { word: "oder", translation: "или", example: "Tee oder Kaffee?" },
      { word: "weil", translation: "потому что", example: "Ich bin müde, weil es spät ist." },
      { word: "wenn", translation: "если", example: "Wenn es regnet, bleibe ich zu Hause." },
      { word: "dann", translation: "тогда", example: "Es regnet, dann bleibe ich zu Hause." },
      { word: "also", translation: "итак", example: "Also, komme ich morgen." }
    ]
  },
  {
    name: "A1: Common Objects",
    description: "Everyday objects and personal items",
    level: "A1",
    words: [
      { word: "Buch", translation: "книга", example: "Das Buch ist interessant." },
      { word: "Stift", translation: "ручка", example: "Der Stift schreibt gut." },
      { word: "Papier", translation: "бумага", example: "Das Papier ist weiß." },
      { word: "Tasche", translation: "сумка", example: "Die Tasche ist voll." },
      { word: "Rucksack", translation: "рюкзак", example: "Der Rucksack ist blau." },
      { word: "Brille", translation: "очки", example: "Die Brille liegt auf dem Tisch." },
      { word: "Uhr", translation: "часы", example: "Die Uhr zeigt 3 Uhr." },
      { word: "Handy", translation: "мобильный телефон", example: "Das Handy ist neu." },
      { word: "Schlüssel", translation: "ключ", example: "Der Schlüssel ist rot." }
    ]
  },
  {
    name: "A1: Food and Drinks",
    description: "Common food and beverage vocabulary",
    level: "A1",
    words: [
      { word: "Wasser", translation: "вода", example: "Ich trinke Wasser." },
      { word: "Kaffee", translation: "кофе", example: "Der Kaffee ist heiß." },
      { word: "Tee", translation: "чай", example: "Sie trinkt Tee am Morgen." },
      { word: "Milch", translation: "молоко", example: "Die Milch ist weiß." },
      { word: "Saft", translation: "сок", example: "Der Orangensaft ist lecker." },
      { word: "Bier", translation: "пиво", example: "Das Bier ist kalt." },
      { word: "Wein", translation: "вино", example: "Der Wein ist rot." },
      { word: "Brot", translation: "хлеб", example: "Das Brot ist frisch." },
      { word: "Butter", translation: "масло", example: "Die Butter ist gelb." },
      { word: "Käse", translation: "сыр", example: "Der Käse schmeckt gut." },
      { word: "Fleisch", translation: "мясо", example: "Das Fleisch ist saftig." },
      { word: "Fisch", translation: "рыба", example: "Der Fisch ist frisch." },
      { word: "Huhn", translation: "курица", example: "Das Huhn ist lecker." },
      { word: "Apfel", translation: "яблоко", example: "Der Apfel ist rot." },
      { word: "Banane", translation: "банан", example: "Die Banane ist gelb." },
      { word: "Orange", translation: "апельсин", example: "Die Orange ist süß." },
      { word: "Erdbeere", translation: "клубника", example: "Die Erdbeere ist rot." },
      { word: "Salat", translation: "салат", example: "Der Salat ist frisch." },
      { word: "Suppe", translation: "суп", example: "Die Suppe ist heiß." },
      { word: "Zucker", translation: "сахар", example: "Der Zucker ist süß." },
      { word: "Salz", translation: "соль", example: "Das Salz ist weiß." },
      { word: "Pfeffer", translation: "перец", example: "Der Pfeffer ist scharf." },
      { word: "Öl", translation: "масло", example: "Das Öl ist flüssig." },
      { word: "Ei", translation: "яйцо", example: "Das Ei ist weiß." },
      { word: "Schokolade", translation: "шоколад", example: "Die Schokolade ist süß." },
      { word: "Nachtisch", translation: "десерт", example: "Der Nachtisch ist lecker." },
      { word: "Pizza", translation: "пицца", example: "Die Pizza ist heiß." },
      { word: "Pasta", translation: "паста", example: "Die Pasta ist italienisch." },
      { word: "Hamburger", translation: "гамбургер", example: "Der Hamburger ist groß." },
      { word: "Restaurant", translation: "ресторан", example: "Das Restaurant ist schön." }
    ]
  }
];

console.log('A1 Final Collections:');
collections.forEach((col, i) => console.log(`${i + 1}. ${col.name}: ${col.words.length} words`));
console.log(`\nTotal A1 final words: ${collections.reduce((sum, col) => sum + col.words.length, 0)}`);

module.exports = { collections };
