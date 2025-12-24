-- Add a test German-Russian word list for testing
-- Topic: Daily Life, Difficulty: Beginner

BEGIN;

-- Insert the collection
INSERT INTO global_word_collections (
    name,
    description,
    from_lang,
    to_lang,
    category,
    difficulty_level,
    topic,
    word_count,
    is_public
) VALUES (
    'Basic German Greetings & Common Words',
    'Essential German words and phrases for everyday communication. Perfect for absolute beginners.',
    'de',
    'ru',
    'General',
    'beginner',
    'daily_life',
    25,
    true
) RETURNING id;

-- Get the collection ID (will be used in next query)
-- Note: You'll need to replace <COLLECTION_ID> with the actual ID after running the first query

-- For PostgreSQL, we can use a CTE to do this in one go:
WITH new_collection AS (
    INSERT INTO global_word_collections (
        name,
        description,
        from_lang,
        to_lang,
        category,
        difficulty_level,
        topic,
        word_count,
        is_public
    ) VALUES (
        'Basic German Greetings & Common Words',
        'Essential German words and phrases for everyday communication. Perfect for absolute beginners.',
        'de',
        'ru',
        'General',
        'beginner',
        'daily_life',
        25,
        true
    ) RETURNING id
)
INSERT INTO global_collection_words (collection_id, word, translation, example, exampleTranslation, order_index)
SELECT
    id,
    word,
    translation,
    example,
    exampleTranslation,
    order_index
FROM new_collection,
(VALUES
    ('Hallo', 'Привет', 'Hallo! Wie geht es dir?', 'Привет! Как дела?', 0),
    ('Danke', 'Спасибо', 'Danke für deine Hilfe!', 'Спасибо за твою помощь!', 1),
    ('Bitte', 'Пожалуйста', 'Bitte, nimm Platz!', 'Пожалуйста, садись!', 2),
    ('Ja', 'Да', 'Ja, das ist richtig.', 'Да, это правильно.', 3),
    ('Nein', 'Нет', 'Nein, ich verstehe nicht.', 'Нет, я не понимаю.', 4),
    ('Guten Morgen', 'Доброе утро', 'Guten Morgen! Hast du gut geschlafen?', 'Доброе утро! Ты хорошо спал?', 5),
    ('Guten Tag', 'Добрый день', 'Guten Tag! Schön, Sie zu sehen.', 'Добрый день! Приятно вас видеть.', 6),
    ('Guten Abend', 'Добрый вечер', 'Guten Abend! Wie war dein Tag?', 'Добрый вечер! Как прошёл твой день?', 7),
    ('Gute Nacht', 'Спокойной ночи', 'Gute Nacht! Schlaf gut!', 'Спокойной ночи! Спи хорошо!', 8),
    ('Tschüss', 'Пока', 'Tschüss! Bis morgen!', 'Пока! До завтра!', 9),
    ('Auf Wiedersehen', 'До свидания', 'Auf Wiedersehen! Es war schön.', 'До свидания! Было приятно.', 10),
    ('Entschuldigung', 'Извините', 'Entschuldigung, wo ist der Bahnhof?', 'Извините, где вокзал?', 11),
    ('Wie heißt du?', 'Как тебя зовут?', 'Hallo! Wie heißt du?', 'Привет! Как тебя зовут?', 12),
    ('Ich heiße', 'Меня зовут', 'Ich heiße Anna. Freut mich!', 'Меня зовут Анна. Приятно познакомиться!', 13),
    ('Wie geht es dir?', 'Как дела?', 'Hallo! Wie geht es dir heute?', 'Привет! Как дела сегодня?', 14),
    ('Gut', 'Хорошо', 'Mir geht es gut, danke!', 'У меня всё хорошо, спасибо!', 15),
    ('Schlecht', 'Плохо', 'Heute geht es mir schlecht.', 'Сегодня у меня плохо.', 16),
    ('Ich verstehe', 'Я понимаю', 'Ja, ich verstehe das Problem.', 'Да, я понимаю эту проблему.', 17),
    ('Ich verstehe nicht', 'Я не понимаю', 'Entschuldigung, ich verstehe nicht.', 'Извините, я не понимаю.', 18),
    ('Hilfe', 'Помощь', 'Ich brauche Hilfe!', 'Мне нужна помощь!', 19),
    ('Wasser', 'Вода', 'Kann ich bitte ein Glas Wasser haben?', 'Можно мне, пожалуйста, стакан воды?', 20),
    ('Essen', 'Еда', 'Das Essen ist sehr lecker!', 'Еда очень вкусная!', 21),
    ('Trinken', 'Пить', 'Möchtest du etwas trinken?', 'Хочешь что-нибудь выпить?', 22),
    ('Heute', 'Сегодня', 'Was machst du heute?', 'Что ты делаешь сегодня?', 23),
    ('Morgen', 'Завтра', 'Bis morgen! Tschüss!', 'До завтра! Пока!', 24)
) AS words(word, translation, example, exampleTranslation, order_index);

COMMIT;
