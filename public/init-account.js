// Account initialization script
// This script creates the user account and imports word list

async function initializeAccount() {
    try {
        console.log('🚀 Initializing account for Nalivator3000...');
        
        // Initialize database first
        await database.init();
        
        // Initialize user manager
        await userManager.init();
        
        // Create user account
        const userData = {
            name: 'Nalivator3000',
            email: 'nalivator3000@gmail.com',
            password: '1'
        };
        
        console.log('👤 Creating user account...');
        await userManager.register(userData.name, userData.email, userData.password);
        
        console.log('✅ Account created successfully!');
        
        // Import word list
        console.log('📚 Importing word list...');
        await importWordList();
        
        console.log('🎉 Account initialization complete!');
        console.log('📊 User can now login with:', userData);
        
        return true;
        
    } catch (error) {
        console.error('❌ Account initialization failed:', error);
        return false;
    }
}

async function importWordList() {
    // Enhanced word list with more vocabulary
    const wordList = [
        // Basic vocabulary
        { word: "Hallo", translation: "Привет", example: "Hallo, wie geht es dir?", exampleTranslation: "Привет, как дела?" },
        { word: "Danke", translation: "Спасибо", example: "Danke für deine Hilfe.", exampleTranslation: "Спасибо за твою помощь." },
        { word: "Bitte", translation: "Пожалуйста", example: "Bitte schön!", exampleTranslation: "Пожалуйста!" },
        { word: "Entschuldigung", translation: "Извинение", example: "Entschuldigung, wo ist der Bahnhof?", exampleTranslation: "Извините, где вокзал?" },
        { word: "Ja", translation: "Да", example: "Ja, das ist richtig.", exampleTranslation: "Да, это правильно." },
        { word: "Nein", translation: "Нет", example: "Nein, das möchte ich nicht.", exampleTranslation: "Нет, я этого не хочу." },
        
        // Family and people
        { word: "Familie", translation: "Семья", example: "Meine Familie ist sehr wichtig für mich.", exampleTranslation: "Моя семья очень важна для меня." },
        { word: "Mutter", translation: "Мать", example: "Meine Mutter kocht sehr gut.", exampleTranslation: "Моя мама очень хорошо готовит." },
        { word: "Vater", translation: "Отец", example: "Mein Vater arbeitet im Büro.", exampleTranslation: "Мой папа работает в офисе." },
        { word: "Kind", translation: "Ребенок", example: "Das Kind spielt im Park.", exampleTranslation: "Ребенок играет в парке." },
        { word: "Freund", translation: "Друг", example: "Er ist mein bester Freund.", exampleTranslation: "Он мой лучший друг." },
        
        // Daily activities
        { word: "Arbeit", translation: "Работа", example: "Die Arbeit macht mir Spaß.", exampleTranslation: "Работа доставляет мне удовольствие." },
        { word: "Schule", translation: "Школа", example: "Die Kinder gehen zur Schule.", exampleTranslation: "Дети идут в школу." },
        { word: "Essen", translation: "Еда", example: "Das Essen schmeckt sehr gut.", exampleTranslation: "Еда очень вкусная." },
        { word: "Trinken", translation: "Пить", example: "Ich möchte etwas trinken.", exampleTranslation: "Я хочу что-то выпить." },
        { word: "Schlafen", translation: "Спать", example: "Ich gehe früh schlafen.", exampleTranslation: "Я рано ложусь спать." },
        
        // Time and weather
        { word: "Zeit", translation: "Время", example: "Wie spät ist es?", exampleTranslation: "Сколько времени?" },
        { word: "Tag", translation: "День", example: "Heute ist ein schöner Tag.", exampleTranslation: "Сегодня прекрасный день." },
        { word: "Nacht", translation: "Ночь", example: "Gute Nacht!", exampleTranslation: "Спокойной ночи!" },
        { word: "Wetter", translation: "Погода", example: "Das Wetter ist heute schlecht.", exampleTranslation: "Погода сегодня плохая." },
        { word: "Sonne", translation: "Солнце", example: "Die Sonne scheint hell.", exampleTranslation: "Солнце ярко светит." },
        
        // Numbers and colors
        { word: "Eins", translation: "Один", example: "Eins, zwei, drei.", exampleTranslation: "Раз, два, три." },
        { word: "Zwei", translation: "Два", example: "Ich habe zwei Katzen.", exampleTranslation: "У меня две кошки." },
        { word: "Rot", translation: "Красный", example: "Das Auto ist rot.", exampleTranslation: "Машина красная." },
        { word: "Blau", translation: "Синий", example: "Der Himmel ist blau.", exampleTranslation: "Небо синее." },
        { word: "Grün", translation: "Зеленый", example: "Das Gras ist grün.", exampleTranslation: "Трава зеленая." },
        
        // Transportation and places
        { word: "Auto", translation: "Машина", example: "Mein Auto ist neu.", exampleTranslation: "Моя машина новая." },
        { word: "Zug", translation: "Поезд", example: "Der Zug kommt pünktlich.", exampleTranslation: "Поезд приходит вовремя." },
        { word: "Flugzeug", translation: "Самолет", example: "Das Flugzeug fliegt hoch.", exampleTranslation: "Самолет летит высоко." },
        { word: "Haus", translation: "Дом", example: "Unser Haus ist groß.", exampleTranslation: "Наш дом большой." },
        { word: "Stadt", translation: "Город", example: "Berlin ist eine große Stadt.", exampleTranslation: "Берлин - большой город." },
        
        // Advanced vocabulary
        { word: "Verstehen", translation: "Понимать", example: "Verstehst du mich?", exampleTranslation: "Ты меня понимаешь?" },
        { word: "Sprechen", translation: "Говорить", example: "Ich kann Deutsch sprechen.", exampleTranslation: "Я умею говорить по-немецки." },
        { word: "Lernen", translation: "Изучать", example: "Ich lerne jeden Tag neue Wörter.", exampleTranslation: "Я изучаю новые слова каждый день." },
        { word: "Lieben", translation: "Любить", example: "Ich liebe meine Familie.", exampleTranslation: "Я люблю свою семью." },
        { word: "Glücklich", translation: "Счастливый", example: "Ich bin sehr glücklich.", exampleTranslation: "Я очень счастлив." },
        
        // Technology and modern life
        { word: "Computer", translation: "Компьютер", example: "Ich arbeite am Computer.", exampleTranslation: "Я работаю за компьютером." },
        { word: "Internet", translation: "Интернет", example: "Das Internet ist sehr nützlich.", exampleTranslation: "Интернет очень полезен." },
        { word: "Handy", translation: "Мобильный телефон", example: "Mein Handy ist kaputt.", exampleTranslation: "Мой телефон сломан." },
        { word: "E-Mail", translation: "Электронная почта", example: "Ich schreibe eine E-Mail.", exampleTranslation: "Я пишу электронное письмо." },
        { word: "Website", translation: "Веб-сайт", example: "Diese Website ist interessant.", exampleTranslation: "Этот сайт интересный." }
    ];
    
    console.log(`📥 Importing ${wordList.length} words...`);
    
    try {
        await database.addWords(wordList);
        console.log('✅ Word list imported successfully!');
        
        // Show statistics
        const counts = await database.getWordCounts();
        console.log('📊 Current word statistics:');
        console.log(`   • Studying: ${counts.studying}`);
        console.log(`   • Review: ${counts.review}`);
        console.log(`   • Learned: ${counts.learned}`);
        
    } catch (error) {
        console.error('❌ Failed to import words:', error);
        throw error;
    }
}

// Auto-run when page loads (only if needed)
if (typeof window !== 'undefined' && window.location.search.includes('init=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔧 Auto-initialization requested...');
        setTimeout(() => {
            initializeAccount().then(success => {
                if (success) {
                    // Remove init parameter from URL
                    const url = new URL(window.location);
                    url.searchParams.delete('init');
                    window.history.replaceState({}, document.title, url.toString());
                    
                    // Refresh the page to show updated stats
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            });
        }, 1000);
    });
}

// Export for manual use
if (typeof window !== 'undefined') {
    window.initializeAccount = initializeAccount;
    window.importWordList = importWordList;
}