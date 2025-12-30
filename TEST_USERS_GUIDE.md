# Test Users Guide - Language Pairs Testing

## Overview

Created **37 test users** covering all major language pairs in the application. These users allow testing of UI elements, particularly word sets organized by levels and themes.

## Quick Access

**All test users have the same password:** `test123`

## Test Users by Priority

### High Priority Pairs (Main Language Pairs)

These are the most important language pairs with the best word set coverage:

| Username | Language Pair | From → To | Word Sets | Total Words | Levels | Themes |
|----------|--------------|-----------|-----------|-------------|--------|--------|
| `test_de_en` | German → English | de → en | 17 | 13,399 | A1, A2, B1, B2, beginner, C1, C2 | 10 thematic categories |
| `test_de_ru` | German → Russian | de → ru | 17 | 13,399 | A1, A2, B1, B2, beginner, C1, C2 | 10 thematic categories |
| `test_en_ru` | English → Russian | en → ru | 6 | 9,974 | A1, A2, B1, B2, C1, C2 | NONE (level-based only) |
| `test_en_de` | English → German | en → de | 6 | 9,974 | A1, A2, B1, B2, C1, C2 | NONE (level-based only) |

### Medium Priority Pairs (Popular Languages)

| Username | Language Pair | Word Sets | Total Words | Levels |
|----------|--------------|-----------|-------------|--------|
| `test_de_es` | German → Spanish | 17 | 13,399 | A1-C2, beginner |
| `test_de_fr` | German → French | 17 | 13,399 | A1-C2, beginner |
| `test_de_it` | German → Italian | 17 | 13,399 | A1-C2, beginner |
| `test_de_pt` | German → Portuguese | 17 | 13,399 | A1-C2, beginner |
| `test_en_es` | English → Spanish | 6 | 9,974 | A1-C2 |
| `test_en_fr` | English → French | 6 | 9,974 | A1-C2 |
| `test_en_it` | English → Italian | 6 | 9,974 | A1-C2 |
| `test_en_pt` | English → Portuguese | 6 | 9,974 | A1-C2 |
| `test_es_en` | Spanish → English | 6 | 9,972 | A1-C2 |
| `test_es_de` | Spanish → German | 6 | 9,972 | A1-C2 |
| `test_fr_en` | French → English | 6 | 9,332 | A1-C2 |
| `test_fr_de` | French → German | 6 | 9,332 | A1-C2 |
| `test_it_en` | Italian → English | 6 | 10,000 | A1-C2 |
| `test_it_de` | Italian → German | 6 | 10,000 | A1-C2 |
| `test_pt_en` | Portuguese → English | 6 | 10,000 | A1-C2 |
| `test_pt_de` | Portuguese → German | 6 | 10,000 | A1-C2 |

### Low Priority Pairs (Less Common Languages)

| Username | Language Pair | Word Sets | Total Words |
|----------|--------------|-----------|-------------|
| `test_de_ar` | German → Arabic | 17 | 13,399 |
| `test_de_zh` | German → Chinese | 17 | 13,399 |
| `test_de_ja` | German → Japanese | 17 | 13,399 |
| `test_de_tr` | German → Turkish | 17 | 13,399 |
| `test_en_ar` | English → Arabic | 6 | 9,974 |
| `test_en_zh` | English → Chinese | 6 | 9,974 |
| `test_en_ja` | English → Japanese | 6 | 9,974 |
| `test_en_tr` | English → Turkish | 6 | 9,974 |
| `test_ar_en` | Arabic → English | 6 | 10,000 |
| `test_ar_de` | Arabic → German | 6 | 10,000 |
| `test_zh_en` | Chinese → English | 6 | 10,000 |
| `test_zh_de` | Chinese → German | 6 | 10,000 |
| `test_es_fr` | Spanish → French | 6 | 9,972 |
| `test_es_pt` | Spanish → Portuguese | 6 | 9,972 |
| `test_fr_es` | French → Spanish | 6 | 9,332 |

## Hindi Language Pairs (NEW! ✨)

Hindi now has full word set coverage with thematic collections:

| Username | Language Pair | Word Sets | Total Words | Features |
|----------|--------------|-----------|-------------|----------|
| `test_hi_en` | Hindi → English | 16 | 9,999 | Levels A1-C2 + 10 themes |
| `test_hi_de` | Hindi → German | 16 | 9,999 | Levels A1-C2 + 10 themes |

**Hindi Themes:** Communication, Culture, Economics, Education, General, Law, Philosophy, Politics, Science, Work

**Special Note:** All 9,999 Hindi words are covered. Words can appear in multiple sets (both level and thematic). Duplicate prevention is automatic when adding words to user's vocabulary.

## Missing Word Sets (Need Creation)

⚠️ These language pairs currently **DO NOT** have word sets:

- `test_ru_en` - Russian → English
- `test_ru_de` - Russian → German

**Note:** Russian as a source language doesn't have word sets yet. You'll need to create them to test these pairs.

## Word Set Structure

### Levels Available

Word sets are organized by CEFR levels:
- **A1** - Beginner
- **A2** - Elementary
- **B1** - Intermediate
- **B2** - Upper Intermediate
- **C1** - Advanced
- **C2** - Proficiency

Some sets (particularly German) also include:
- **beginner** - General beginner level

### Thematic Categories (German & Hindi Sources)

**German** word sets include 10 thematic categories:
1. **communication** - Communication topics
2. **culture** - Cultural topics
3. **economics** - Economic vocabulary
4. **education** - Educational terms
5. **general** - General vocabulary
6. **law** - Legal terminology
7. **philosophy** - Philosophical concepts
8. **politics** - Political vocabulary
9. **science** - Scientific terms
10. **work** - Work-related vocabulary

**Hindi** word sets include 10 thematic categories (matching German):
1. **communication** - Communication topics (99 words)
2. **culture** - Cultural topics (999 words)
3. **economics** - Economic vocabulary (599 words)
4. **education** - Educational terms (1,499 words)
5. **general** - General vocabulary (2,999 words)
6. **law** - Legal terminology (499 words)
7. **philosophy** - Philosophical concepts (299 words)
8. **politics** - Political vocabulary (999 words)
9. **science** - Scientific terms (1,199 words)
10. **work** - Work-related vocabulary (799 words)

**Total:** All 9,999 Hindi words are distributed across these categories.

## Testing Word Sets UI

### What to Test

1. **Level-based organization**
   - Are words properly grouped by CEFR levels?
   - Can users filter by level?
   - Do level indicators display correctly?

2. **Thematic organization** (German only)
   - Are thematic collections visible?
   - Can users browse by theme?
   - Do theme labels display correctly?

3. **Word count accuracy**
   - Does the displayed word count match actual words?
   - Are word counts consistent across sets?

4. **Multi-language support**
   - Does the UI work for all language pairs?
   - Are translations accurate?
   - Do RTL languages (Arabic) display correctly?

### Recommended Testing Order

1. **Start with German or Hindi pairs** (most features)
   - `test_de_en` - German → English, best coverage, 10 themes
   - `test_hi_en` - Hindi → English, 9 themes, Devanagari script
   - `test_de_ru` - German → Russian, Russian interface testing

2. **Test English pairs** (level-only organization)
   - `test_en_ru`
   - `test_en_de`
   - `test_en_es`

3. **Test reverse pairs**
   - `test_es_en`
   - `test_fr_en`
   - `test_it_en`

4. **Test edge cases**
   - `test_ar_en` - RTL source language
   - `test_zh_en` - Non-Latin script
   - `test_ja_en` - Different character system

## Coverage Summary

- **Total test users:** 39 (updated!)
- **Language pairs with word sets:** 37 (94.9%)
- **Language pairs without word sets:** 2 (5.1%)
- **Languages with thematic collections:** 2 (German, Hindi)
- **Languages covered as source:** 16/17 (Russian missing word sets)

## Accessing Test Users

### Web Interface
1. Go to your application login page
2. Enter username (e.g., `test_de_en`)
3. Enter password: `test123`
4. Navigate to word sets/vocabulary sections

### API Testing
All test users can be used for API testing and automated tests.

## Scripts Available

### Create Test Users
```bash
node scripts/create-test-users.js
```
Creates all 37 test users with language pairs.

### Verify Coverage
```bash
node scripts/verify-word-sets-coverage.js
```
Checks which language pairs have word sets and provides detailed coverage report.

### Check Word Sets Structure
```bash
node scripts/check-word-sets-structure.js
```
Analyzes word sets structure, levels, and themes.

## Notes

- Test users are created with minimal profile data (just username, email, password)
- All test users have `is_active = true` for their language pairs
- Word sets are shared across all target languages for the same source language
- German has the most comprehensive word set organization (levels + themes)
- Other languages currently only have level-based organization

## Future Improvements

To achieve 100% coverage, create word sets for:
- Russian (source language) - This will enable testing for `test_ru_en`, `test_ru_de`

To add thematic collections to more languages:
- Consider adding themes to English, Spanish, French, Italian, Arabic, Chinese, and other major languages
- This would provide the same rich vocabulary organization available in German and Hindi
