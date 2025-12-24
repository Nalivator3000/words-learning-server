# Vocabulary Metadata & Tagging System

## Purpose
Позволяет создавать кастомные наборы слов по любым критериям:
- "Глаголы уровня B2"
- "Существительные для путешествий A2"
- "Неправильные глаголы A1-B1"
- "Бизнес-лексика B2-C1"
- "Phrasal verbs B1+"

---

## Metadata Structure for Each Word

```javascript
{
  // Basic Information
  "word": "travel",
  "translation": "путешествовать",
  "example": "I love to travel around the world.",
  "exampleTranslation": "Я люблю путешествовать по миру.",

  // Core Metadata
  "level": "A2",                    // CEFR level: A1, A2, B1, B2, C1, C2
  "partOfSpeech": "verb",           // Part of speech (see list below)
  "languagePair": "en-ru",          // Language direction

  // Thematic Tags
  "themes": [                       // Multiple themes possible
    "travel",
    "transportation",
    "leisure"
  ],

  // Grammar Tags
  "grammarTags": [                  // Grammar-specific tags
    "irregular-verb",
    "intransitive",
    "common"
  ],

  // Subcategories
  "subcategory": "movement",        // More specific than theme
  "semanticField": "motion",        // Semantic grouping

  // Usage Metadata
  "register": "neutral",            // formal, neutral, informal, slang
  "frequency": "high",              // high, medium, low (based on corpus)
  "difficulty": "easy",             // easy, medium, hard (for learners)

  // Language-Specific
  "pronunciation": "/ˈtrævəl/",     // IPA notation
  "irregularForms": {               // For irregular verbs, plurals, etc.
    "pastSimple": "traveled",
    "pastParticiple": "traveled",
    "presentParticiple": "traveling"
  },

  // Additional Notes
  "notes": "Regular in US English, can be irregular in British English",
  "synonyms": ["journey", "voyage", "tour"],
  "antonyms": ["stay", "remain"],
  "collocations": ["travel abroad", "travel by train", "business travel"],

  // Learning Metadata
  "priority": "high",               // high, medium, low
  "collection": "A2: Travel & Tourism",
  "collectionId": 28,
  "wordNumber": 1                   // Order within collection
}
```

---

## Part of Speech Categories

### Main Categories
- **noun** - существительное
- **verb** - глагол
- **adjective** - прилагательное
- **adverb** - наречие
- **pronoun** - местоимение
- **preposition** - предлог
- **conjunction** - союз
- **interjection** - междометие
- **article** - артикль (для английского)
- **numeral** - числительное

### Compound Categories
- **phrasal-verb** - фразовый глагол
- **idiom** - идиома
- **phrase** - фраза, выражение
- **compound-noun** - составное существительное
- **compound-adjective** - составное прилагательное

---

## Theme Categories (Thematic Tags)

### A1-A2 Core Themes
- **greetings** - приветствия
- **family** - семья
- **colors** - цвета
- **numbers** - числа
- **time** - время
- **body** - тело
- **clothing** - одежда
- **food** - еда
- **home** - дом
- **places** - места
- **transport** - транспорт
- **weather** - погода
- **emotions** - эмоции
- **hobbies** - хобби
- **work** - работа
- **education** - образование
- **health** - здоровье
- **technology** - технологии
- **shopping** - покупки
- **travel** - путешествия

### B1-B2 Advanced Themes
- **business** - бизнес
- **politics** - политика
- **media** - медиа
- **environment** - окружающая среда
- **science** - наука
- **culture** - культура
- **society** - общество
- **law** - право
- **economy** - экономика
- **psychology** - психология
- **philosophy** - философия
- **art** - искусство
- **literature** - литература
- **communication** - коммуникация
- **relationships** - отношения

### C1-C2 Specialized Themes
- **academic** - академическая лексика
- **professional** - профессиональная
- **technical** - техническая
- **medical** - медицинская
- **legal** - юридическая
- **financial** - финансовая
- **diplomatic** - дипломатическая
- **scientific** - научная

---

## Grammar Tags

### Verb Tags
- **regular-verb** - правильный глагол
- **irregular-verb** - неправильный глагол
- **modal-verb** - модальный глагол
- **auxiliary-verb** - вспомогательный глагол
- **phrasal-verb** - фразовый глагол
- **transitive** - переходный
- **intransitive** - непереходный
- **reflexive** - возвратный
- **stative** - глагол состояния
- **dynamic** - динамический глагол

### Noun Tags
- **countable** - исчисляемое
- **uncountable** - неисчисляемое
- **plural-only** - только множественное число
- **singular-only** - только единственное число
- **irregular-plural** - неправильное множественное число
- **compound-noun** - составное существительное
- **proper-noun** - имя собственное
- **abstract-noun** - абстрактное существительное
- **concrete-noun** - конкретное существительное

### Adjective Tags
- **comparative** - сравнительная степень
- **superlative** - превосходная степень
- **irregular-comparison** - неправильное сравнение
- **attributive-only** - только атрибутивное использование
- **predicative-only** - только предикативное использование
- **gradable** - градуируемое
- **non-gradable** - неградуируемое

### Other Grammar Tags
- **false-friend** - ложный друг переводчика
- **cognate** - родственное слово
- **colloquial** - разговорное
- **formal** - формальное
- **archaic** - архаичное
- **literary** - литературное
- **technical** - технический термин

---

## Frequency & Priority Tags

### Frequency (based on corpus data)
- **very-high** - топ 100 слов
- **high** - топ 1000 слов
- **medium-high** - топ 3000 слов
- **medium** - топ 5000 слов
- **medium-low** - топ 10000 слов
- **low** - за пределами топ 10000

### Priority (for learning)
- **essential** - обязательно для уровня
- **high** - очень желательно
- **medium** - желательно
- **low** - опционально
- **specialized** - для специальных целей

### Difficulty (subjective for Russian learners)
- **very-easy** - очень легко
- **easy** - легко
- **medium** - средне
- **hard** - сложно
- **very-hard** - очень сложно

---

## Usage & Register Tags

### Register/Style
- **formal** - формальный
- **neutral** - нейтральный
- **informal** - неформальный
- **colloquial** - разговорный
- **slang** - сленг
- **vulgar** - вульгарный
- **dated** - устаревший
- **archaic** - архаичный
- **literary** - литературный
- **poetic** - поэтический

### Dialect/Variant
- **british** - британский английский
- **american** - американский английский
- **australian** - австралийский английский
- **standard** - стандартный/нейтральный
- **regional** - региональный

---

## Database Schema Enhancement

### Updated `global_collection_words` table structure:

```sql
ALTER TABLE global_collection_words ADD COLUMN IF NOT EXISTS
  level VARCHAR(2),                    -- A1, A2, B1, B2, C1, C2
  part_of_speech VARCHAR(50),          -- noun, verb, adjective, etc.
  themes JSONB,                        -- array of theme tags
  grammar_tags JSONB,                  -- array of grammar tags
  subcategory VARCHAR(100),
  semantic_field VARCHAR(100),
  register VARCHAR(20),                -- formal, neutral, informal, slang
  frequency VARCHAR(20),               -- very-high, high, medium, low
  difficulty VARCHAR(20),              -- easy, medium, hard
  pronunciation VARCHAR(200),
  irregular_forms JSONB,               -- for verbs, plurals, etc.
  synonyms JSONB,                      -- array of synonyms
  antonyms JSONB,                      -- array of antonyms
  collocations JSONB,                  -- array of common collocations
  priority VARCHAR(20),                -- essential, high, medium, low
  dialect_tags JSONB;                  -- british, american, etc.
```

---

## Example Queries with Metadata

### 1. Get all B2 verbs
```sql
SELECT * FROM global_collection_words
WHERE level = 'B2' AND part_of_speech = 'verb';
```

### 2. Get all travel-related nouns for A2
```sql
SELECT * FROM global_collection_words
WHERE level = 'A2'
  AND part_of_speech = 'noun'
  AND themes @> '["travel"]';
```

### 3. Get all irregular verbs from A1 to B1
```sql
SELECT * FROM global_collection_words
WHERE level IN ('A1', 'A2', 'B1')
  AND part_of_speech = 'verb'
  AND grammar_tags @> '["irregular-verb"]'
ORDER BY frequency DESC;
```

### 4. Get all phrasal verbs for B1
```sql
SELECT * FROM global_collection_words
WHERE level = 'B1'
  AND part_of_speech = 'phrasal-verb';
```

### 5. Get business vocabulary B2-C1
```sql
SELECT * FROM global_collection_words
WHERE level IN ('B2', 'C1')
  AND themes @> '["business"]'
ORDER BY priority DESC, frequency DESC;
```

### 6. Get high-frequency essential words for A1
```sql
SELECT * FROM global_collection_words
WHERE level = 'A1'
  AND frequency IN ('very-high', 'high')
  AND priority = 'essential'
ORDER BY frequency DESC;
```

### 7. Get formal academic vocabulary for C1
```sql
SELECT * FROM global_collection_words
WHERE level = 'C1'
  AND register = 'formal'
  AND themes @> '["academic"]';
```

### 8. Get all false friends (to warn learners)
```sql
SELECT * FROM global_collection_words
WHERE grammar_tags @> '["false-friend"]'
ORDER BY level, frequency DESC;
```

---

## Custom Collection Builder Interface

### Example UI for creating custom collections:

```
┌─────────────────────────────────────────┐
│ Create Custom Word Collection           │
├─────────────────────────────────────────┤
│                                         │
│ Collection Name: ___________________    │
│                                         │
│ Filters:                                │
│ ┌─────────────────────────────────────┐ │
│ │ Level:                              │ │
│ │ ☑ A1  ☑ A2  ☑ B1  ☐ B2  ☐ C1  ☐ C2 │ │
│ │                                     │ │
│ │ Part of Speech:                     │ │
│ │ ☑ Verb  ☐ Noun  ☐ Adjective  ☐ All │ │
│ │                                     │ │
│ │ Themes:                             │ │
│ │ ☑ Travel  ☐ Business  ☐ Food  ☐ All│ │
│ │                                     │ │
│ │ Grammar:                            │ │
│ │ ☑ Irregular verbs                   │ │
│ │ ☐ Phrasal verbs                     │ │
│ │ ☐ False friends                     │ │
│ │                                     │ │
│ │ Frequency:                          │ │
│ │ ☑ Very High  ☑ High  ☐ Medium       │ │
│ │                                     │ │
│ │ Register:                           │ │
│ │ ☐ Formal  ☑ Neutral  ☑ Informal     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Preview: 87 words] [Create Collection] │
└─────────────────────────────────────────┘
```

---

## Pre-built Custom Collections (Examples)

### 1. Essential Irregular Verbs (A1-B1)
```json
{
  "name": "Essential Irregular Verbs A1-B1",
  "filters": {
    "level": ["A1", "A2", "B1"],
    "partOfSpeech": "verb",
    "grammarTags": ["irregular-verb"],
    "frequency": ["very-high", "high"],
    "priority": ["essential", "high"]
  },
  "estimatedWords": 120
}
```

### 2. Business Communication B2
```json
{
  "name": "Business Communication B2",
  "filters": {
    "level": "B2",
    "themes": ["business", "work"],
    "register": ["formal", "neutral"]
  },
  "estimatedWords": 200
}
```

### 3. Travel Essentials A2
```json
{
  "name": "Travel Essentials A2",
  "filters": {
    "level": "A2",
    "themes": ["travel", "transport", "places"],
    "priority": ["essential", "high"]
  },
  "estimatedWords": 150
}
```

### 4. Academic Writing C1
```json
{
  "name": "Academic Writing C1",
  "filters": {
    "level": "C1",
    "themes": ["academic", "science"],
    "register": "formal",
    "partOfSpeech": ["noun", "verb", "adjective"]
  },
  "estimatedWords": 300
}
```

### 5. Phrasal Verbs B1-B2
```json
{
  "name": "Common Phrasal Verbs B1-B2",
  "filters": {
    "level": ["B1", "B2"],
    "partOfSpeech": "phrasal-verb",
    "frequency": ["very-high", "high", "medium-high"]
  },
  "estimatedWords": 180
}
```

### 6. Food & Cooking Vocabulary A1-A2
```json
{
  "name": "Food & Cooking A1-A2",
  "filters": {
    "level": ["A1", "A2"],
    "themes": ["food"],
    "partOfSpeech": ["noun", "verb", "adjective"]
  },
  "estimatedWords": 120
}
```

---

## Implementation in Import Scripts

### Enhanced word entry format:

```javascript
{
  word: "go",
  translation: "идти, ехать",
  example: "I go to school every day.",
  exampleTranslation: "Я хожу в школу каждый день.",
  notes: "Past: went, Past Participle: gone",

  // Metadata
  level: "A1",
  partOfSpeech: "verb",
  themes: ["movement", "daily-routine", "transport"],
  grammarTags: ["irregular-verb", "intransitive", "high-frequency"],
  subcategory: "movement",
  semanticField: "motion",
  register: "neutral",
  frequency: "very-high",
  difficulty: "medium",
  pronunciation: "/ɡoʊ/",
  irregularForms: {
    baseForm: "go",
    thirdPerson: "goes",
    pastSimple: "went",
    pastParticiple: "gone",
    presentParticiple: "going"
  },
  synonyms: ["travel", "move", "walk"],
  collocations: ["go to school", "go home", "go shopping", "go by bus"],
  priority: "essential",
  dialectTags: ["standard"]
}
```

---

## API Endpoints for Metadata Queries

### GET /api/words/custom-collection
```javascript
// Query parameters
{
  level: 'B2',
  partOfSpeech: 'verb',
  themes: ['business'],
  frequency: 'high',
  limit: 50
}

// Response
{
  words: [...],
  totalCount: 87,
  filters: {...}
}
```

### GET /api/words/metadata/themes
```javascript
// Returns all available themes with word counts
{
  themes: [
    { name: 'travel', count: 234, levels: ['A1', 'A2', 'B1'] },
    { name: 'business', count: 456, levels: ['B1', 'B2', 'C1'] },
    ...
  ]
}
```

### GET /api/words/metadata/grammar-tags
```javascript
// Returns all grammar tags with word counts
{
  grammarTags: [
    { name: 'irregular-verb', count: 180, levels: ['A1', 'A2', 'B1', 'B2'] },
    { name: 'phrasal-verb', count: 250, levels: ['A2', 'B1', 'B2', 'C1'] },
    ...
  ]
}
```

---

## Benefits of This System

1. **Flexible Learning Paths** - Users can create personalized study sets
2. **Targeted Practice** - Focus on specific grammar (e.g., irregular verbs)
3. **Thematic Learning** - Group by topic (travel, business, etc.)
4. **Level Progression** - Easy to track vocabulary across CEFR levels
5. **Smart Recommendations** - Algorithm can suggest words based on tags
6. **Gap Analysis** - Identify missing vocabulary areas
7. **Spaced Repetition** - Combine with SRS using metadata
8. **Testing** - Generate targeted quizzes (e.g., "B2 business verbs")
9. **Analytics** - Track progress by theme, part of speech, level
10. **Export Options** - Users can export filtered word lists

---

## Next Steps

1. ✅ Update database schema to include metadata fields
2. Create migration script for existing words
3. Add metadata to all new vocabulary entries
4. Build custom collection creator UI
5. Implement metadata-based queries in API
6. Create pre-built custom collections
7. Add metadata filters to quiz generation
8. Build analytics dashboard by metadata

---

**Status:** Metadata system designed and ready for implementation
**Priority:** Implement alongside A1-B1 vocabulary generation
