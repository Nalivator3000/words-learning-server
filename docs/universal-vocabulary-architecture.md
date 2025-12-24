# Universal Vocabulary Architecture

## Концепция

**Изучаемые слова (Source)** хранятся отдельно для каждого языка.
**Целевые переводы (Target)** создаются по мере необходимости.

## Структура БД

### 1. Таблицы изучаемых слов (по одной на язык)

```sql
-- Немецкие слова (изучаемые)
CREATE TABLE source_words_german (
  id SERIAL PRIMARY KEY,
  word VARCHAR NOT NULL UNIQUE,
  level VARCHAR NOT NULL, -- A1, A2, B1, B2, C1, C2
  pos VARCHAR, -- noun, verb, adjective, etc.
  gender VARCHAR, -- m, f, n (для существительных)
  example_de TEXT NOT NULL, -- пример на немецком
  theme VARCHAR, -- greetings, food, business, etc.
  metadata JSONB, -- дополнительные данные
  created_at TIMESTAMP DEFAULT NOW()
);

-- Английские слова (изучаемые)
CREATE TABLE source_words_english (
  id SERIAL PRIMARY KEY,
  word VARCHAR NOT NULL UNIQUE,
  level VARCHAR NOT NULL,
  pos VARCHAR,
  example_en TEXT NOT NULL, -- пример на английском
  theme VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Испанские слова (изучаемые)
CREATE TABLE source_words_spanish (
  id SERIAL PRIMARY KEY,
  word VARCHAR NOT NULL UNIQUE,
  level VARCHAR NOT NULL,
  pos VARCHAR,
  gender VARCHAR,
  example_es TEXT NOT NULL,
  theme VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Французские слова (изучаемые)
CREATE TABLE source_words_french (
  id SERIAL PRIMARY KEY,
  word VARCHAR NOT NULL UNIQUE,
  level VARCHAR NOT NULL,
  pos VARCHAR,
  gender VARCHAR,
  example_fr TEXT NOT NULL,
  theme VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Русские слова (изучаемые)
CREATE TABLE source_words_russian (
  id SERIAL PRIMARY KEY,
  word VARCHAR NOT NULL UNIQUE,
  level VARCHAR NOT NULL,
  pos VARCHAR,
  gender VARCHAR,
  example_ru TEXT NOT NULL,
  theme VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Итальянские слова (изучаемые)
CREATE TABLE source_words_italian (
  id SERIAL PRIMARY KEY,
  word VARCHAR NOT NULL UNIQUE,
  level VARCHAR NOT NULL,
  pos VARCHAR,
  gender VARCHAR,
  example_it TEXT NOT NULL,
  theme VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Таблицы целевых переводов (target languages)

```sql
-- Переводы на русский (целевой язык)
CREATE TABLE target_translations_russian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR NOT NULL, -- 'de', 'en', 'es', 'fr', 'it'
  source_word_id INTEGER NOT NULL, -- ID из source_words_{lang}
  translation VARCHAR NOT NULL,
  example_ru TEXT, -- локализованный пример (опционально)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

-- Переводы на английский (целевой язык)
CREATE TABLE target_translations_english (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR NOT NULL,
  example_en TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

-- Переводы на испанский (целевой язык)
CREATE TABLE target_translations_spanish (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR NOT NULL,
  example_es TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

-- Переводы на немецкий (целевой язык)
CREATE TABLE target_translations_german (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR NOT NULL,
  example_de TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

-- Переводы на французский (целевой язык)
CREATE TABLE target_translations_french (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR NOT NULL,
  example_fr TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

-- Переводы на итальянский (целевой язык)
CREATE TABLE target_translations_italian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR NOT NULL,
  example_it TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);
```

### 3. Коллекции (универсальные)

```sql
-- Коллекции привязаны к изучаемому языку
CREATE TABLE universal_collections (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  source_lang VARCHAR NOT NULL, -- 'de', 'en', 'es', etc.
  level VARCHAR,
  theme VARCHAR,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Слова в коллекциях
CREATE TABLE universal_collection_words (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER REFERENCES universal_collections(id) ON DELETE CASCADE,
  source_word_id INTEGER NOT NULL, -- ID из source_words_{source_lang}
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Примеры использования

### Добавить немецкое слово
```sql
INSERT INTO source_words_german (word, level, pos, gender, example_de, theme)
VALUES ('das Brot', 'A1', 'noun', 'n', 'Ich esse gern Brot zum Frühstück.', 'food');
```

### Добавить русский перевод для немецкого слова
```sql
INSERT INTO target_translations_russian (source_lang, source_word_id, translation, example_ru)
VALUES ('de', 1, 'хлеб', 'Я люблю есть хлеб на завтрак.');
```

### Получить de-ru пару для обучения
```sql
SELECT
  sw.word as german_word,
  sw.example_de,
  tr.translation as russian_translation,
  tr.example_ru
FROM source_words_german sw
JOIN target_translations_russian tr
  ON tr.source_lang = 'de' AND tr.source_word_id = sw.id
WHERE sw.level = 'A1';
```

### Создать коллекцию
```sql
-- 1. Создать коллекцию
INSERT INTO universal_collections (name, description, source_lang, level)
VALUES ('German Food Basics', 'Basic German food vocabulary', 'de', 'A1')
RETURNING id; -- предположим, получили id = 1

-- 2. Добавить слова в коллекцию
INSERT INTO universal_collection_words (collection_id, source_word_id, order_index)
VALUES (1, 1, 0), (1, 2, 1), (1, 3, 2);

-- 3. Получить коллекцию de-ru
SELECT
  c.name as collection_name,
  sw.word as german_word,
  sw.example_de,
  tr.translation as russian_translation,
  tr.example_ru,
  cw.order_index
FROM universal_collections c
JOIN universal_collection_words cw ON cw.collection_id = c.id
JOIN source_words_german sw ON sw.id = cw.source_word_id
JOIN target_translations_russian tr
  ON tr.source_lang = 'de' AND tr.source_word_id = sw.id
WHERE c.id = 1
ORDER BY cw.order_index;
```

## Преимущества

✅ **Масштабируемость**: Один раз создаем немецкие слова, используем для всех целевых языков
✅ **Гибкость**: Легко добавить новый целевой язык (просто новая таблица переводов)
✅ **Производительность**: Прямые связи без JOIN через промежуточные таблицы
✅ **Чистота данных**: Изучаемые слова в одном месте, переводы отдельно
✅ **Переиспользование**: 10,800 немецких слов → переводы на 5+ языков

## Миграция существующих данных

Для de-ru у нас уже есть:
- 800 слов A1
- 1,000 слов A2
- 1,200 слов B1
- 820 слов B2
- 400 слов C1 (генерируется)

Нужно:
1. Извлечь немецкие слова → `source_words_german`
2. Извлечь русские переводы → `target_translations_russian`
3. Пересоздать коллекции → `universal_collections` + `universal_collection_words`

## Структура файлов

```
data/
  source-vocabularies/
    german/
      A1-greetings.js
      A1-food.js
      ...
      C2-philosophy.js
    english/
      A1-basics.js
      ...
    spanish/
      A1-basics.js
      ...

  target-translations/
    to-russian/
      from-german/
        A1-greetings.js
        ...
      from-english/
        A1-basics.js
        ...
    to-english/
      from-german/
        ...
      from-spanish/
        ...
```

## Формат файлов

### Source vocabulary (изучаемые слова)
```javascript
// data/source-vocabularies/german/A1-greetings.js
module.exports = {
  lang: 'de',
  level: 'A1',
  theme: 'greetings',
  words: [
    {
      word: "Guten Tag",
      pos: "phrase",
      example: "Guten Tag! Wie geht es Ihnen?",
      metadata: { formality: "formal" }
    },
    {
      word: "Hallo",
      pos: "interjection",
      example: "Hallo! Schön dich zu sehen!",
      metadata: { formality: "informal" }
    }
  ]
};
```

### Target translations (целевые переводы)
```javascript
// data/target-translations/to-russian/from-german/A1-greetings.js
module.exports = {
  source_lang: 'de',
  target_lang: 'ru',
  level: 'A1',
  theme: 'greetings',
  translations: [
    {
      source_word: "Guten Tag",
      translation: "Добрый день",
      example: "Добрый день! Как у вас дела?" // опционально
    },
    {
      source_word: "Hallo",
      translation: "Привет",
      example: "Привет! Рад тебя видеть!"
    }
  ]
};
```
