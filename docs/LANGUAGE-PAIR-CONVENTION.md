# Language Pair Convention

## Notation Standard

**Format:** `[native_language] → [learning_language]`

The arrow (`→`) always points FROM the user's native language TO the language they are learning.

## Examples

- **ru→de** - User with native Russian learning German
- **ru→en** - User with native Russian learning English
- **en→es** - User with native English learning Spanish
- **de→en** - User with native German learning English

## Database Structure

### Source Words Tables
Contains vocabulary in the **learning language**:
- `source_words_german` - German vocabulary (for learners of German)
- `source_words_english` - English vocabulary (for learners of English)
- `source_words_spanish` - Spanish vocabulary (for learners of Spanish)
- etc.

### Translation Tables
Contains translations INTO the **native language**:
- `target_translations_russian` - Russian translations (for Russian native speakers)
- `target_translations_english` - English translations (for English native speakers)
- `target_translations_spanish` - Spanish translations (for Spanish native speakers)
- etc.

### Linking Source and Target
The `source_lang` field in translation tables identifies which source language the words come from:

```sql
-- Example: Russian native speaker learning German (ru→de)
SELECT
  sw.word AS german_word,
  tr.translation AS russian_translation,
  sw.level
FROM source_words_german sw
JOIN target_translations_russian tr
  ON tr.source_word_id = sw.id
  AND tr.source_lang = 'de'
WHERE sw.level = 'A1';
```

## Implementation Examples

### Pair: ru→de (Russian learning German)
- **Source:** `source_words_german` (10,540 words)
- **Target:** `target_translations_russian` WHERE `source_lang = 'de'` (10,540 translations)
- **UI Display:** Show German word, ask for Russian translation (or vice versa)

### Pair: ru→en (Russian learning English)
- **Source:** `source_words_english` (to be imported)
- **Target:** `target_translations_russian` WHERE `source_lang = 'en'` (to be created)
- **UI Display:** Show English word, ask for Russian translation

### Pair: en→es (English learning Spanish)
- **Source:** `source_words_spanish` (to be imported)
- **Target:** `target_translations_english` WHERE `source_lang = 'es'` (to be created)
- **UI Display:** Show Spanish word, ask for English translation

## Priority Language Pairs

As documented in [PROGRESS.md](./PROGRESS.md):

1. 🔥🔥🔥 **ru→de** (Russian → German) - CURRENT, 35% complete
2. 🔥🔥🔥 **ru→en** (Russian → English) - HIGHEST priority
3. 🔥🔥🔥 **ru→es** (Russian → Spanish) - HIGHEST priority
4. 🔥🔥 **en→fr** (English → French) - HIGH priority
5. 🔥🔥 **en→ru** (English → Russian) - HIGH priority
6. 🔥 **en→it** (English → Italian) - MEDIUM priority

## API Endpoints Convention

When building API endpoints, use consistent naming:

```
GET  /api/collections/:from_lang/:to_lang
GET  /api/collections/ru/de  # Returns German words with Russian translations
GET  /api/collections/en/es  # Returns Spanish words with English translations

POST /api/study/:from_lang/:to_lang
POST /api/study/ru/en        # Study session for Russian native learning English
```

## Important Notes

1. **Arrow Direction:** Always `native → learning`, never `learning → native`
2. **Database Reality:**
   - Learning language words are in `source_words_*`
   - Native language translations are in `target_translations_*`
3. **Translation Scripts:**
   - Current scripts translate FROM German TO other languages
   - Need reverse scripts for pairs where German is not the source

## Historical Context

The database was initially built for German vocabulary with translations to various languages. As we expand to support multiple source languages (English, Spanish, etc.), this convention ensures clarity about:
- Which language the user is learning
- Which language they want translations in
- How to query the correct tables

---

**Created:** 2025-12-22
**Status:** Active convention for all new development
