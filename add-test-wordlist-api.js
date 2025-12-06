// Add German-Russian word list via API
// Using Node.js 22 built-in fetch

const wordListData = {
    name: 'Basic German Greetings & Common Words',
    description: 'Essential German words and phrases for everyday communication. Perfect for absolute beginners.',
    from_lang: 'de',
    to_lang: 'ru',
    category: 'General',
    difficulty_level: 'beginner',
    topic: 'daily_life',
    words: [
        { word: 'Hallo', translation: 'Привет', example: 'Hallo! Wie geht es dir?', exampleTranslation: 'Привет! Как дела?' },
        { word: 'Danke', translation: 'Спасибо', example: 'Danke für deine Hilfe!', exampleTranslation: 'Спасибо за твою помощь!' },
        { word: 'Bitte', translation: 'Пожалуйста', example: 'Bitte, nimm Platz!', exampleTranslation: 'Пожалуйста, садись!' },
        { word: 'Ja', translation: 'Да', example: 'Ja, das ist richtig.', exampleTranslation: 'Да, это правильно.' },
        { word: 'Nein', translation: 'Нет', example: 'Nein, ich verstehe nicht.', exampleTranslation: 'Нет, я не понимаю.' },
        { word: 'Guten Morgen', translation: 'Доброе утро', example: 'Guten Morgen! Hast du gut geschlafen?', exampleTranslation: 'Доброе утро! Ты хорошо спал?' },
        { word: 'Guten Tag', translation: 'Добрый день', example: 'Guten Tag! Schön, Sie zu sehen.', exampleTranslation: 'Добрый день! Приятно вас видеть.' },
        { word: 'Guten Abend', translation: 'Добрый вечер', example: 'Guten Abend! Wie war dein Tag?', exampleTranslation: 'Добрый вечер! Как прошёл твой день?' },
        { word: 'Gute Nacht', translation: 'Спокойной ночи', example: 'Gute Nacht! Schlaf gut!', exampleTranslation: 'Спокойной ночи! Спи хорошо!' },
        { word: 'Tschüss', translation: 'Пока', example: 'Tschüss! Bis morgen!', exampleTranslation: 'Пока! До завтра!' },
        { word: 'Auf Wiedersehen', translation: 'До свидания', example: 'Auf Wiedersehen! Es war schön.', exampleTranslation: 'До свидания! Было приятно.' },
        { word: 'Entschuldigung', translation: 'Извините', example: 'Entschuldigung, wo ist der Bahnhof?', exampleTranslation: 'Извините, где вокзал?' },
        { word: 'Wie heißt du?', translation: 'Как тебя зовут?', example: 'Hallo! Wie heißt du?', exampleTranslation: 'Привет! Как тебя зовут?' },
        { word: 'Ich heiße', translation: 'Меня зовут', example: 'Ich heiße Anna. Freut mich!', exampleTranslation: 'Меня зовут Анна. Приятно познакомиться!' },
        { word: 'Wie geht es dir?', translation: 'Как дела?', example: 'Hallo! Wie geht es dir heute?', exampleTranslation: 'Привет! Как дела сегодня?' },
        { word: 'Gut', translation: 'Хорошо', example: 'Mir geht es gut, danke!', exampleTranslation: 'У меня всё хорошо, спасибо!' },
        { word: 'Schlecht', translation: 'Плохо', example: 'Heute geht es mir schlecht.', exampleTranslation: 'Сегодня у меня плохо.' },
        { word: 'Ich verstehe', translation: 'Я понимаю', example: 'Ja, ich verstehe das Problem.', exampleTranslation: 'Да, я понимаю эту проблему.' },
        { word: 'Ich verstehe nicht', translation: 'Я не понимаю', example: 'Entschuldigung, ich verstehe nicht.', exampleTranslation: 'Извините, я не понимаю.' },
        { word: 'Hilfe', translation: 'Помощь', example: 'Ich brauche Hilfe!', exampleTranslation: 'Мне нужна помощь!' },
        { word: 'Wasser', translation: 'Вода', example: 'Kann ich bitte ein Glas Wasser haben?', exampleTranslation: 'Можно мне, пожалуйста, стакан воды?' },
        { word: 'Essen', translation: 'Еда', example: 'Das Essen ist sehr lecker!', exampleTranslation: 'Еда очень вкусная!' },
        { word: 'Trinken', translation: 'Пить', example: 'Möchtest du etwas trinken?', exampleTranslation: 'Хочешь что-нибудь выпить?' },
        { word: 'Heute', translation: 'Сегодня', example: 'Was machst du heute?', exampleTranslation: 'Что ты делаешь сегодня?' },
        { word: 'Morgen', translation: 'Завтра', example: 'Bis morgen! Tschüss!', exampleTranslation: 'До завтра! Пока!' }
    ]
};

async function addWordList() {
    try {
        console.log('📚 Creating word list via API...');

        const response = await fetch('http://localhost:3001/api/word-lists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wordListData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create word list');
        }

        const result = await response.json();
        console.log(`✅ Created collection with ID: ${result.collection.id}`);
        console.log(`\n📚 Word List: "${wordListData.name}"`);
        console.log(`   Language: ${wordListData.from_lang.toUpperCase()} → ${wordListData.to_lang.toUpperCase()}`);
        console.log(`   Difficulty: ${wordListData.difficulty_level}`);
        console.log(`   Topic: ${wordListData.topic}`);
        console.log(`   Words: ${wordListData.words.length}`);
        console.log('\n✅ Word list added successfully!');

    } catch (err) {
        console.error('❌ Failed to add word list:', err.message);
        process.exit(1);
    }
}

addWordList();
