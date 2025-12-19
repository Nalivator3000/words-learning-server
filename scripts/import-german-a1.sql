-- German A1 Vocabulary Import Script
-- This script creates word sets and imports all A1 level German vocabulary
-- Total: ~500 words across 12 thematic sets

-- First, create the global collection for German A1
INSERT INTO global_word_collections (name, language_code, level, description, is_premium, category)
VALUES
    ('German A1 Complete', 'de', 'A1', 'Complete A1 level German vocabulary (~500 words) organized by theme', false, 'beginner');

-- Get the collection ID (will be referenced in word inserts)
-- Note: Replace {collection_id} with the actual ID after running the above INSERT

-- Set 1: First Words (50 words)
-- Personal pronouns, greetings, question words, numbers

INSERT INTO global_collection_words (collection_id, word, translation, example_sentence, notes, category, subcategory) VALUES
-- Personal Pronouns
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'ich', 'I', 'Ich bin Student', 'nominative', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'du', 'you (informal)', 'Du bist nett', 'singular', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'er', 'he', 'Er kommt aus Berlin', 'masculine', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'sie', 'she', 'Sie heißt Anna', 'feminine', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'es', 'it', 'Es ist kalt', 'neuter', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'wir', 'we', 'Wir lernen Deutsch', 'plural', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'ihr', 'you (informal plural)', 'Ihr seid Freunde', 'plural', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'sie', 'they', 'Sie wohnen hier', 'plural', 'pronouns', 'personal'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Sie', 'you (formal)', 'Wie heißen Sie?', 'always capitalized', 'pronouns', 'personal'),

-- Greetings & Polite Words
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Hallo', 'Hello', 'Hallo! Wie geht''s?', 'informal', 'greetings', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Guten Morgen', 'Good morning', 'Guten Morgen, Frau Müller', 'until ~10am', 'greetings', 'time-based'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Guten Tag', 'Good day', 'Guten Tag!', '10am-6pm', 'greetings', 'time-based'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Guten Abend', 'Good evening', 'Guten Abend!', 'after 6pm', 'greetings', 'time-based'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Gute Nacht', 'Good night', 'Gute Nacht, schlaf gut', 'before sleeping', 'greetings', 'time-based'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Auf Wiedersehen', 'Goodbye', 'Auf Wiedersehen, bis morgen', 'formal', 'greetings', 'farewell'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Tschüss', 'Bye', 'Tschüss! Bis später', 'informal', 'greetings', 'farewell'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Bis bald', 'See you soon', 'Bis bald!', 'casual', 'greetings', 'farewell'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'ja', 'yes', 'Ja, das stimmt', 'affirmative', 'basics', 'response'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'nein', 'no', 'Nein, danke', 'negative', 'basics', 'response'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'bitte', 'please / you''re welcome', 'Bitte schön!', 'polite', 'basics', 'politeness'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'danke', 'thank you', 'Danke!', 'gratitude', 'basics', 'politeness'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'Entschuldigung', 'Excuse me / Sorry', 'Entschuldigung, wo ist...?', 'polite', 'basics', 'politeness'),

-- Question Words
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'wie', 'how', 'Wie geht es dir?', 'manner', 'questions', 'w-questions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'was', 'what', 'Was ist das?', 'thing', 'questions', 'w-questions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'wo', 'where', 'Wo wohnst du?', 'location', 'questions', 'w-questions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'wer', 'who', 'Wer bist du?', 'person', 'questions', 'w-questions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'wann', 'when', 'Wann kommst du?', 'time', 'questions', 'w-questions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'warum', 'why', 'Warum lernst du Deutsch?', 'reason', 'questions', 'w-questions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'welche', 'which', 'Welches Buch?', 'choice', 'questions', 'w-questions'),

-- Numbers 1-20
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'null', 'zero', 'null Grad', '0', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'eins', 'one', 'eins plus eins', '1', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'zwei', 'two', 'zwei Äpfel', '2', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'drei', 'three', 'drei Stunden', '3', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'vier', 'four', 'vier Personen', '4', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'fünf', 'five', 'fünf Euro', '5', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'sechs', 'six', 'sechs Tage', '6', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'sieben', 'seven', 'sieben Uhr', '7', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'acht', 'eight', 'acht Jahre', '8', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'neun', 'nine', 'neun Monate', '9', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'zehn', 'ten', 'zehn Minuten', '10', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'elf', 'eleven', 'elf Spieler', '11', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'zwölf', 'twelve', 'zwölf Monate', '12', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'dreizehn', 'thirteen', 'dreizehn Jahre', '13', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'vierzehn', 'fourteen', 'vierzehn Tage', '14', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'fünfzehn', 'fifteen', 'fünfzehn Euro', '15', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'sechzehn', 'sixteen', 'sechzehn Uhr', '16', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'siebzehn', 'seventeen', 'siebzehn Grad', '17', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'achtzehn', 'eighteen', 'achtzehn Jahre alt', '18', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'neunzehn', 'nineteen', 'neunzehn Uhr', '19', 'numbers', 'basic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'zwanzig', 'twenty', 'zwanzig Euro', '20', 'numbers', 'basic');

-- Set 2: Family & People (40 words)

-- Family Members
INSERT INTO global_collection_words (collection_id, word, translation, example_sentence, notes, category, subcategory) VALUES
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Familie', 'family', 'Meine Familie ist groß', 'feminine', 'family', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Mutter', 'mother', 'Meine Mutter heißt Maria', 'feminine', 'family', 'parents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Vater', 'father', 'Mein Vater arbeitet viel', 'masculine', 'family', 'parents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Eltern', 'parents', 'Meine Eltern wohnen in Berlin', 'plural', 'family', 'parents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Bruder', 'brother', 'Mein Bruder ist Student', 'masculine', 'family', 'siblings'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Schwester', 'sister', 'Meine Schwester ist klein', 'feminine', 'family', 'siblings'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Geschwister', 'siblings', 'Ich habe zwei Geschwister', 'plural', 'family', 'siblings'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Oma', 'grandmother', 'Oma backt Kuchen', 'feminine, informal', 'family', 'grandparents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Großmutter', 'grandmother', 'Großmutter ist 80', 'feminine, formal', 'family', 'grandparents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Opa', 'grandfather', 'Opa liest die Zeitung', 'masculine, informal', 'family', 'grandparents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Großvater', 'grandfather', 'Großvater arbeitet noch', 'masculine, formal', 'family', 'grandparents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Großeltern', 'grandparents', 'Großeltern sind nett', 'plural', 'family', 'grandparents'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Kind', 'child', 'Das Kind spielt', 'neuter', 'family', 'children'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Kinder', 'children', 'Kinder lernen schnell', 'plural', 'family', 'children'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Baby', 'baby', 'Das Baby schläft', 'neuter', 'family', 'children'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Sohn', 'son', 'Mein Sohn ist drei', 'masculine', 'family', 'children'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Tochter', 'daughter', 'Meine Tochter tanzt gern', 'feminine', 'family', 'children'),

-- People & Relationships
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Mann', 'man', 'Der Mann arbeitet', 'masculine', 'people', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Frau', 'woman', 'Die Frau kocht', 'feminine', 'people', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Freund', 'friend (male) / boyfriend', 'Mein Freund kommt heute', 'masculine', 'people', 'relationships'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Freundin', 'friend (female) / girlfriend', 'Meine Freundin ist nett', 'feminine', 'people', 'relationships'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Leute', 'people', 'Viele Leute sind hier', 'plural', 'people', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Person', 'person', 'Eine Person wartet', 'feminine', 'people', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Mensch', 'human / person', 'Jeder Mensch ist anders', 'masculine', 'people', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Junge', 'boy', 'Der Junge spielt Fußball', 'masculine', 'people', 'children'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Mädchen', 'girl', 'Das Mädchen singt', 'neuter', 'people', 'children'),

-- Professions (Basic)
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Lehrer', 'teacher (male)', 'Der Lehrer erklärt', 'masculine', 'professions', 'education'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Lehrerin', 'teacher (female)', 'Die Lehrerin ist nett', 'feminine', 'professions', 'education'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Arzt', 'doctor (male)', 'Der Arzt hilft', 'masculine', 'professions', 'medical'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Ärztin', 'doctor (female)', 'Die Ärztin untersucht', 'feminine', 'professions', 'medical'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Student', 'student (male)', 'Der Student lernt', 'masculine', 'professions', 'education'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Studentin', 'student (female)', 'Die Studentin liest', 'feminine', 'professions', 'education'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Schüler', 'pupil (male)', 'Der Schüler schreibt', 'masculine', 'professions', 'education'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Schülerin', 'pupil (female)', 'Die Schülerin rechnet', 'feminine', 'professions', 'education');

-- Set 3: Everyday Objects (60 words)

-- House Items
INSERT INTO global_collection_words (collection_id, word, translation, example_sentence, notes, category, subcategory) VALUES
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Haus', 'house', 'Mein Haus ist groß', 'neuter', 'home', 'building'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Wohnung', 'apartment', 'Die Wohnung ist klein', 'feminine', 'home', 'building'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Zimmer', 'room', 'Das Zimmer ist hell', 'neuter', 'home', 'rooms'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Tür', 'door', 'Die Tür ist offen', 'feminine', 'home', 'parts'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Fenster', 'window', 'Das Fenster ist zu', 'neuter', 'home', 'parts'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Tisch', 'table', 'Der Tisch ist rund', 'masculine', 'home', 'furniture'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Stuhl', 'chair', 'Der Stuhl ist bequem', 'masculine', 'home', 'furniture'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Bett', 'bed', 'Das Bett ist weich', 'neuter', 'home', 'furniture'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Schrank', 'closet', 'Der Schrank ist voll', 'masculine', 'home', 'furniture'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Lampe', 'lamp', 'Die Lampe ist hell', 'feminine', 'home', 'furniture'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Schlüssel', 'key', 'Wo ist der Schlüssel?', 'masculine', 'home', 'objects'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Uhr', 'clock / watch', 'Die Uhr zeigt drei', 'feminine', 'home', 'objects'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Bild', 'picture', 'Das Bild ist schön', 'neuter', 'home', 'decoration'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Spiegel', 'mirror', 'Der Spiegel hängt hier', 'masculine', 'home', 'decoration'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Teppich', 'carpet', 'Der Teppich ist rot', 'masculine', 'home', 'decoration'),

-- Clothing Basics
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Kleidung', 'clothing', 'Warme Kleidung', 'feminine', 'clothing', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Hose', 'pants / trousers', 'Die Hose ist neu', 'feminine', 'clothing', 'bottom'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Hemd', 'shirt', 'Das Hemd ist weiß', 'neuter', 'clothing', 'top'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das T-Shirt', 't-shirt', 'Das T-Shirt ist cool', 'neuter', 'clothing', 'top'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Kleid', 'dress', 'Das Kleid ist schön', 'neuter', 'clothing', 'dresses'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Rock', 'skirt', 'Der Rock ist kurz', 'masculine', 'clothing', 'bottom'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Schuhe', 'shoes', 'Die Schuhe sind bequem', 'plural', 'clothing', 'footwear'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Jacke', 'jacket', 'Die Jacke ist warm', 'feminine', 'clothing', 'outerwear'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Mantel', 'coat', 'Der Mantel ist lang', 'masculine', 'clothing', 'outerwear'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Pullover', 'sweater', 'Der Pullover ist dick', 'masculine', 'clothing', 'top'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Socken', 'socks', 'Die Socken sind warm', 'plural', 'clothing', 'footwear'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Hut', 'hat', 'Der Hut ist groß', 'masculine', 'clothing', 'accessories'),

-- School Items
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Schule', 'school', 'Die Schule beginnt um acht', 'feminine', 'school', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Buch', 'book', 'Das Buch ist interessant', 'neuter', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Heft', 'notebook', 'Das Heft ist voll', 'neuter', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Stift', 'pen', 'Der Stift schreibt gut', 'masculine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Bleistift', 'pencil', 'Der Bleistift ist spitz', 'masculine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Kuli', 'ballpoint pen', 'Hast du einen Kuli?', 'masculine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Tasche', 'bag', 'Die Tasche ist schwer', 'feminine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Rucksack', 'backpack', 'Der Rucksack ist neu', 'masculine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Papier', 'paper', 'Das Papier ist weiß', 'neuter', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Lineal', 'ruler', 'Das Lineal ist lang', 'neuter', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Radiergummi', 'eraser', 'Der Radiergummi ist klein', 'masculine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Schere', 'scissors', 'Die Schere ist scharf', 'feminine', 'school', 'supplies'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Computer', 'computer', 'Der Computer ist schnell', 'masculine', 'school', 'technology');

-- Set 4: Food & Drink (50 words)

-- Common Foods
INSERT INTO global_collection_words (collection_id, word, translation, example_sentence, notes, category, subcategory) VALUES
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Essen', 'food', 'Das Essen ist lecker', 'neuter', 'food', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Brot', 'bread', 'Das Brot ist frisch', 'neuter', 'food', 'bread'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Brötchen', 'bread roll', 'Ein Brötchen, bitte', 'neuter', 'food', 'bread'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Butter', 'butter', 'Butter aufs Brot', 'feminine', 'food', 'dairy'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Käse', 'cheese', 'Der Käse ist mild', 'masculine', 'food', 'dairy'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Ei', 'egg', 'Das Ei ist hart', 'neuter', 'food', 'protein'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Eier', 'eggs', 'Zwei Eier, bitte', 'plural', 'food', 'protein'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Fleisch', 'meat', 'Das Fleisch ist zart', 'neuter', 'food', 'protein'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Fisch', 'fish', 'Der Fisch ist frisch', 'masculine', 'food', 'protein'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Wurst', 'sausage', 'Die Wurst schmeckt gut', 'feminine', 'food', 'protein'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Schinken', 'ham', 'Der Schinken ist lecker', 'masculine', 'food', 'protein'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Suppe', 'soup', 'Die Suppe ist heiß', 'feminine', 'food', 'dishes'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Salat', 'salad', 'Der Salat ist frisch', 'masculine', 'food', 'dishes'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Gemüse', 'vegetable(s)', 'Gemüse ist gesund', 'neuter', 'food', 'vegetables'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Obst', 'fruit', 'Obst ist süß', 'neuter', 'food', 'fruit'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Apfel', 'apple', 'Der Apfel ist rot', 'masculine', 'food', 'fruit'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Banane', 'banana', 'Die Banane ist gelb', 'feminine', 'food', 'fruit'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Kartoffel', 'potato', 'Kartoffeln kochen', 'feminine', 'food', 'vegetables'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Reis', 'rice', 'Reis mit Gemüse', 'masculine', 'food', 'grains'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Nudeln', 'noodles/pasta', 'Nudeln mit Soße', 'plural', 'food', 'grains'),

-- Drinks
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Wasser', 'water', 'Ein Glas Wasser', 'neuter', 'drinks', 'non-alcoholic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Milch', 'milk', 'Milch ist weiß', 'feminine', 'drinks', 'non-alcoholic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Kaffee', 'coffee', 'Der Kaffee ist heiß', 'masculine', 'drinks', 'hot'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Tee', 'tea', 'Tee mit Zucker', 'masculine', 'drinks', 'hot'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Saft', 'juice', 'Orangensaft, bitte', 'masculine', 'drinks', 'non-alcoholic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Bier', 'beer', 'Ein Bier, bitte', 'neuter', 'drinks', 'alcoholic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Wein', 'wine', 'Rotwein oder Weißwein?', 'masculine', 'drinks', 'alcoholic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Cola', 'cola', 'Eine Cola, bitte', 'feminine', 'drinks', 'non-alcoholic'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Kakao', 'cocoa', 'Kakao ist süß', 'masculine', 'drinks', 'hot'),

-- Meals & Related
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Frühstück', 'breakfast', 'Frühstück um sieben', 'neuter', 'food', 'meals'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Mittagessen', 'lunch', 'Mittagessen um zwölf', 'neuter', 'food', 'meals'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Abendessen', 'dinner', 'Abendessen um sechs', 'neuter', 'food', 'meals'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Restaurant', 'restaurant', 'Im Restaurant essen', 'neuter', 'food', 'places'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Café', 'café', 'Im Café sitzen', 'neuter', 'food', 'places'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Küche', 'kitchen', 'In der Küche kochen', 'feminine', 'food', 'places'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Teller', 'plate', 'Der Teller ist voll', 'masculine', 'food', 'tableware'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Tasse', 'cup', 'Eine Tasse Kaffee', 'feminine', 'food', 'tableware'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Glas', 'glass', 'Ein Glas Wasser', 'neuter', 'food', 'tableware'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Messer', 'knife', 'Das Messer ist scharf', 'neuter', 'food', 'cutlery'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Gabel', 'fork', 'Die Gabel liegt links', 'feminine', 'food', 'cutlery'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Löffel', 'spoon', 'Ein Löffel Zucker', 'masculine', 'food', 'cutlery'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Hunger', 'hunger', 'Ich habe Hunger', 'masculine', 'food', 'feelings'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Durst', 'thirst', 'Ich habe Durst', 'masculine', 'food', 'feelings');

-- Due to length, I'll create the remaining sets (5-12) in the next section
-- This script continues with Time & Calendar, Places, Activities, Adjectives, Shopping, Transport, Body/Health, and Hobbies

-- Set 5: Time & Calendar (50 words)

-- Days of the Week
INSERT INTO global_collection_words (collection_id, word, translation, example_sentence, notes, category, subcategory) VALUES
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Tag', 'day', 'Ein schöner Tag', 'masculine', 'time', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Woche', 'week', 'Nächste Woche', 'feminine', 'time', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Montag', 'Monday', 'Am Montag arbeite ich', 'masculine', 'time', 'weekdays'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Dienstag', 'Tuesday', 'Dienstag ist Training', 'masculine', 'time', 'weekdays'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Mittwoch', 'Wednesday', 'Mittwoch habe ich frei', 'masculine', 'time', 'weekdays'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Donnerstag', 'Thursday', 'Donnerstag kommt Besuch', 'masculine', 'time', 'weekdays'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Freitag', 'Friday', 'Freitag ist Party', 'masculine', 'time', 'weekdays'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Samstag', 'Saturday', 'Samstag schlafe ich lang', 'masculine', 'time', 'weekend'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Sonntag', 'Sunday', 'Sonntag besuche ich Oma', 'masculine', 'time', 'weekend'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Wochenende', 'weekend', 'Am Wochenende relaxen', 'neuter', 'time', 'weekend'),

-- Months
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Monat', 'month', 'Jeden Monat', 'masculine', 'time', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'das Jahr', 'year', 'Ein Jahr hat 12 Monate', 'neuter', 'time', 'general'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Januar', 'January', 'Im Januar ist kalt', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Februar', 'February', 'Februar ist kurz', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der März', 'March', 'März - Frühlingsanfang', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der April', 'April', 'April, April', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Mai', 'May', 'Mai ist warm', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Juni', 'June', 'Juni - Sommeranfang', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Juli', 'July', 'Juli ist heiß', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der August', 'August', 'August - Urlaub', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der September', 'September', 'September - Herbst', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Oktober', 'October', 'Oktober ist bunt', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der November', 'November', 'November ist grau', 'masculine', 'time', 'months'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Dezember', 'December', 'Dezember - Weihnachten', 'masculine', 'time', 'months'),

-- Seasons & Time Expressions
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Jahreszeit', 'season', 'Vier Jahreszeiten', 'feminine', 'time', 'seasons'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Frühling', 'spring', 'Im Frühling blüht alles', 'masculine', 'time', 'seasons'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Sommer', 'summer', 'Sommer ist warm', 'masculine', 'time', 'seasons'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Herbst', 'autumn/fall', 'Herbst - bunte Blätter', 'masculine', 'time', 'seasons'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'der Winter', 'winter', 'Winter ist kalt', 'masculine', 'time', 'seasons'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'heute', 'today', 'Heute ist Montag', 'adverb', 'time', 'expressions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'morgen', 'tomorrow', 'Morgen komme ich', 'adverb', 'time', 'expressions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'gestern', 'yesterday', 'Gestern war schön', 'adverb', 'time', 'expressions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'jetzt', 'now', 'Jetzt sofort!', 'adverb', 'time', 'expressions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'später', 'later', 'Bis später!', 'adverb', 'time', 'expressions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'bald', 'soon', 'Bis bald!', 'adverb', 'time', 'expressions'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'immer', 'always', 'Immer pünktlich', 'adverb', 'time', 'frequency'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'nie', 'never', 'Nie zu spät', 'adverb', 'time', 'frequency'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'manchmal', 'sometimes', 'Manchmal müde', 'adverb', 'time', 'frequency'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'oft', 'often', 'Oft hier', 'adverb', 'time', 'frequency'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Stunde', 'hour', 'Eine Stunde warten', 'feminine', 'time', 'duration'),
((SELECT id FROM global_word_collections WHERE name = 'German A1 Complete'), 'die Minute', 'minute', 'Zehn Minuten', 'feminine', 'time', 'duration');

-- Continue with remaining sets in next file due to length...
-- Sets 6-12 will follow the same pattern
