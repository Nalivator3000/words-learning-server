# Fix: Statistics Page Error for Languages Without Source Examples

## Issue
Statistics page was failing with error for user 87 (Hindi → English):
```
column sw.example_hi does not exist
```

## Root Cause
The database has an inconsistent schema for source language example sentences:

### Languages WITH example columns in source tables:
- English (`source_words_english.example_en`)
- German (`source_words_german.example_de`)
- Spanish (`source_words_spanish.example_es`)
- French (`source_words_french.example_fr`)

### Languages WITHOUT example columns in source tables:
- Arabic, Chinese, Hindi, Italian, Japanese, Korean, Polish, Portuguese, Romanian, Russian, Serbian, Swahili, Turkish, Ukrainian

### Translation Table Structure:
- For `*_from_en` tables: Use `example_native` column (target language example)
- For `*_from_XX` tables (where XX is not English): Use `example_XX` column (target language code)

## The Bug
SQL queries were attempting to select `sw.example_${sourceLanguageCode}` from source tables regardless of whether the column existed.

For Hindi → English:
- Query tried to select: `sw.example_hi` from `source_words_hindi`
- But `source_words_hindi` only has columns: `id`, `word`, `level`, `created_at`, `theme`
- Result: SQL error "column sw.example_hi does not exist"

## The Fix
Updated 3 locations in `server-postgresql.js`:

1. **`/api/words` endpoint** (lines 13089-13162)
2. **`getWordsWithProgress()` helper function** (lines 12492-12657)
3. **`/api/words/random-proportional/:count` endpoint** (lines 13392-13472)

### Changes Made:
1. Added global constant `SOURCE_LANGUAGES_WITH_EXAMPLES` (line 80) to track which languages have example columns
2. Replaced 3 local variable definitions with references to the global constant
3. Check if source language has examples before trying to select from `sw.example_XX`
4. If no source example column exists, use empty string `''` instead
5. Updated table selection logic to use `*_from_XX` tables when source language lacks examples

### Code Pattern:
Added global constant at top of file (line 80):
```javascript
const SOURCE_LANGUAGES_WITH_EXAMPLES = ['english', 'german', 'spanish', 'french'];
```

Then use it in queries:
```javascript
const hasSourceExample = SOURCE_LANGUAGES_WITH_EXAMPLES.includes(sourceLanguage);
const exampleSourceColumn = hasSourceExample ? `sw.example_${sourceLanguageCode}` : `''`;
```

## Affected Language Pairs
This fix resolves the issue for all language pairs where the source language is:
- Hindi → (any target language)
- Arabic → (any target language)
- Russian → (any target language)
- Chinese → (any target language)
- Italian → (any target language)
- Japanese → (any target language)
- Korean → (any target language)
- Polish → (any target language)
- Portuguese → (any target language)
- Romanian → (any target language)
- Serbian → (any target language)
- Swahili → (any target language)
- Turkish → (any target language)
- Ukrainian → (any target language)

## Testing
Test cases should verify:
1. Statistics page loads without errors for Hindi → English (user 87)
2. Other language pairs with missing source examples (Russian → English, Arabic → French, etc.)
3. Existing functionality still works for language pairs with source examples (English → German, etc.)

## Next Steps
Consider standardizing the database schema:
- Either add `example_XX` columns to all source tables
- Or move all examples to translation tables with consistent naming
- This would eliminate the need for special handling in queries
