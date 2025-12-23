# Vocabulary Database Collection Status

Last Updated: 2025-12-22

---

## Overview

This document tracks the status of vocabulary database collection across all language pairs in the LexyBooster project.

**Language Pair Convention:** `native_lang → learning_lang` (see [LANGUAGE-PAIR-CONVENTION.md](./LANGUAGE-PAIR-CONVENTION.md))

---

## Current Database Status

### Source Words (Learning Languages)

| Language | Table Name | Words Count | Status | Source |
|----------|------------|-------------|--------|--------|
| **German** | `source_words_german` | **10,540** | ✅ **COMPLETE** | Manual collections A1-C2 |
| English | `source_words_english` | 0 | ❌ Empty | Ready to import |
| Spanish | `source_words_spanish` | 0 | ❌ Empty | Ready to import |
| French | `source_words_french` | 0 | ❌ Empty | Not prepared |
| Russian | `source_words_russian` | 0 | ❌ Empty | Not prepared |
| Italian | `source_words_italian` | 0 | ❌ Empty | Not prepared |

### Translation Pairs (Complete)

| Pair | Description | Count | Status | Quality |
|------|-------------|-------|--------|---------|
| **ru→de** | Russian learning German | **10,540** | ✅ **COMPLETE** | High (manual) |
| **ru→en** | Russian learning English | **10,540** | ✅ Available | Medium (auto-translated from de) |

**Note:** The ru→en translations exist because German words were auto-translated to English. However, these are German vocabulary with English translations, not proper English vocabulary for learners.

### Translation Pairs (Partially Available)

The following translation tables exist with data, but from unexpected source languages:

| Table | Source Languages Available | Notes |
|-------|---------------------------|-------|
| `target_translations_english` | de (10,540) | German words translated to English |
| `target_translations_spanish` | de, en, es (various) | Multiple source languages |
| `target_translations_arabic` | de, en, es | Multiple source languages |
| `target_translations_polish` | de, en, es | Multiple source languages |
| `target_translations_portuguese` | de, en, es | Multiple source languages |
| `target_translations_romanian` | de, en, es | Multiple source languages |
| `target_translations_serbian` | de, en, es | Multiple source languages |
| `target_translations_swahili` | de, en, es | Multiple source languages |
| `target_translations_turkish` | de, en, es | Multiple source languages |
| `target_translations_ukrainian` | de, en, es | Multiple source languages |

---

## Ready-to-Run Collection Scripts

### 1. English Vocabulary Collection

#### Option A: Frequency-based (Recommended)
**Script:** [scripts/import-frequency-words.js](../scripts/import-frequency-words.js)

**Source:** GitHub repository `oprogramador/most-common-words-by-language`
**Words:** 10,000 most common English words
**Features:**
- Automatic CEFR level assignment (A1-C2)
- Frequency ranking
- Includes both English and Spanish

**Command:**
```bash
node scripts/import-frequency-words.js
```

**Expected Result:**
- `source_words_english`: ~10,000 words
- `source_words_spanish`: ~10,000 words
- Distribution: A1(1000), A2(1000), B1(1500), B2(2000), C1(2500), C2(2000)

#### Option B: Oxford 5000
**Script:** [scripts/import-oxford-csv.js](../scripts/import-oxford-csv.js)

**Source:** GitHub repository `Berehulia/Oxford-3000-5000`
**Words:** 5,000 curated English words
**Features:**
- Oxford University Press curated vocabulary
- CEFR levels included
- Part of speech tags
- Higher quality, smaller corpus

**Command:**
```bash
node scripts/import-oxford-csv.js
```

**Expected Result:**
- `source_words_english`: ~5,000 words
- Pre-assigned CEFR levels
- Part of speech information

#### Option C: Manual A1 Collection
**Script:** [scripts/collect-english-vocabulary.js](../scripts/collect-english-vocabulary.js)

**Source:** Manually curated
**Words:** ~450 A1 level words
**Features:**
- Thematically organized
- Only A1 level
- High quality, hand-picked

**Command:**
```bash
node scripts/collect-english-vocabulary.js
```

### 2. Spanish Vocabulary Collection

**Script:** [scripts/import-frequency-words.js](../scripts/import-frequency-words.js) (same as English)

This script imports both English and Spanish simultaneously from the same source.

### 3. Translation Scripts (German to Other Languages)

The following scripts translate the 10,540 German words to various target languages:

| Script | Target Language | Status |
|--------|----------------|--------|
| `translate-all-to-english.js` | English | ✅ Already run |
| `translate-all-to-spanish.js` | Spanish | ⏳ Ready to run |
| `translate-all-to-italian.js` | Italian | ⏳ Ready to run |
| `translate-all-to-french.js` | French | ⏳ Ready to run |
| `translate-all-to-polish.js` | Polish | ⏳ Ready to run |
| `translate-all-to-portuguese.js` | Portuguese | ⏳ Ready to run |
| `translate-all-to-romanian.js` | Romanian | ⏳ Ready to run |
| `translate-all-to-serbian.js` | Serbian | ⏳ Ready to run |
| `translate-all-to-turkish.js` | Turkish | ⏳ Ready to run |
| `translate-all-to-ukrainian.js` | Ukrainian | ⏳ Ready to run |
| `translate-all-to-arabic.js` | Arabic | ⏳ Ready to run |
| `translate-all-to-swahili.js` | Swahili | ⏳ Ready to run |

**Method:** Free Google Translate API
**Rate Limit:** ~100ms delay between requests
**Expected Time:** 15-30 minutes per language

---

## Missing Scripts Needed

### Critical: Reverse Translation Scripts

For language pairs where German is NOT the source language, we need reverse translation scripts:

#### 1. English → Russian (en→ru)
**Need:** Script to translate English words to Russian
**Input:** `source_words_english` (after import)
**Output:** `target_translations_russian` WHERE `source_lang = 'en'`
**Status:** ❌ Not created

#### 2. Spanish → Russian (es→ru)
**Need:** Script to translate Spanish words to Russian
**Input:** `source_words_spanish` (after import)
**Output:** `target_translations_russian` WHERE `source_lang = 'es'`
**Status:** ❌ Not created

#### 3. English → Other Languages
For pairs like:
- en→fr (English → French)
- en→it (English → Italian)
- en→de (English → German)

**Status:** ❌ Not created

---

## Action Plan: Complete Priority Language Pairs

### Phase 1: Complete ru→de ✅ IN PROGRESS
**Current Status:** 10,540 words, A1-B2 complete, C1-C2 in progress
**No database collection needed** - continue with C1-C2 vocabulary generation

### Phase 2A: Prepare ru→en (Russian → English)

**Step 1:** Import English vocabulary base
```bash
# Recommended: Use frequency list for comprehensive coverage
node scripts/import-frequency-words.js
# This will import ~10,000 English words to source_words_english
```

**Step 2:** Create translation script `translate-english-to-russian.js`
- Read from `source_words_english`
- Translate en→ru using Google Translate API
- Write to `target_translations_russian` with `source_lang = 'en'`

**Step 3:** Run translation script
```bash
node scripts/translate-english-to-russian.js
```

**Expected Result:** ru→en pair ready with ~10,000 words

### Phase 2B: Prepare ru→es (Russian → Spanish)

**Step 1:** Already done (if using import-frequency-words.js in Phase 2A)
- Spanish words imported alongside English

**Step 2:** Create translation script `translate-spanish-to-russian.js`
- Read from `source_words_spanish`
- Translate es→ru using Google Translate API
- Write to `target_translations_russian` with `source_lang = 'es'`

**Step 3:** Run translation script
```bash
node scripts/translate-spanish-to-russian.js
```

**Expected Result:** ru→es pair ready with ~10,000 words

### Phase 3: Other Language Pairs

Repeat similar process for:
- en→fr (English → French)
- en→ru (English → Russian)
- en→it (English → Italian)

---

## Script Templates Needed

### Template 1: translate-[source]-to-[target].js

```javascript
// Example: translate-english-to-russian.js
const { Pool } = require('pg');
const pool = new Pool({ /* connection config */ });

async function translateWithGoogleAPI(text, sourceLang, targetLang) {
  // Implementation using free Google Translate API
}

async function translateEnglishToRussian() {
  // 1. Read from source_words_english
  // 2. Check existing translations (ON CONFLICT)
  // 3. Translate in batches with delay
  // 4. Insert into target_translations_russian with source_lang='en'
}
```

### Template 2: import-[language]-vocabulary.js

For languages without public frequency lists, need manual collection scripts similar to `collect-english-vocabulary.js`.

---

## Quality Considerations

### Current Quality Levels

| Pair | Source Quality | Translation Quality | Overall |
|------|---------------|---------------------|---------|
| ru→de | ⭐⭐⭐⭐⭐ Manual | ⭐⭐⭐⭐⭐ Manual | Excellent |
| ru→en (future) | ⭐⭐⭐⭐ Frequency | ⭐⭐⭐ Auto-translate | Good |
| ru→es (future) | ⭐⭐⭐⭐ Frequency | ⭐⭐⭐ Auto-translate | Good |

### Improvement Opportunities

1. **Manual Review:** Auto-translated content should be reviewed by native speakers
2. **Context Examples:** Add example sentences for each word
3. **Audio:** Generate pronunciation audio for all words
4. **Metadata:** Add part of speech, frequency, and thematic tags
5. **Deduplication:** Ensure no duplicate words across levels

---

## Database Schema Notes

### Important Fields

**source_words_[language]:**
- `id` - Primary key
- `word` - The actual word
- `level` - CEFR level (A1, A2, B1, B2, C1, C2)
- `frequency_rank` - Optional: frequency ranking
- `part_of_speech` - Optional: noun, verb, adjective, etc.
- `example_[lang]` - Optional: example sentence

**target_translations_[language]:**
- `id` - Primary key
- `source_lang` - **CRITICAL:** Which language the source word is from (de, en, es, etc.)
- `source_word_id` - Foreign key to source_words_[source_lang]
- `translation` - The translated word/phrase
- `example_[lang]` - Optional: translated example sentence

### Key Constraint

```sql
UNIQUE (source_lang, source_word_id)
-- Ensures one translation per source word per source language
```

---

## Next Immediate Actions

### Option A: Continue German C1-C2 (Current Plan)
Focus on completing ru→de to 100% before starting new pairs

### Option B: Parallel Approach (Faster Launch)
1. ✅ Run `import-frequency-words.js` to get English + Spanish base (~30 min)
2. ✅ Create `translate-english-to-russian.js` (~1 hour coding)
3. ✅ Create `translate-spanish-to-russian.js` (~30 min coding)
4. ✅ Run both translation scripts (~1 hour each)
5. ✅ Launch ru→en and ru→es with basic vocabulary (~4-5 hours total)

**Recommendation:** Option B allows launching new language pairs quickly while continuing German C1-C2 development in parallel.

---

## Success Metrics

### Per Language Pair
- [ ] Source vocabulary: 8,000-10,000 words
- [ ] Translation coverage: 100%
- [ ] CEFR distribution: A1(10%), A2(15%), B1(20%), B2(25%), C1(15%), C2(15%)
- [ ] Example sentences: >80% coverage
- [ ] Audio files: >90% coverage

### Overall Platform
- [ ] 6 language pairs active (ru→de, ru→en, ru→es, en→fr, en→ru, en→it)
- [ ] 60,000+ total words across all pairs
- [ ] Multi-language interface (12 languages)
- [ ] User satisfaction: >4.5/5 stars

---

**Status:** 📊 Database infrastructure complete, ready for vocabulary import
**Bottleneck:** Source vocabulary collection for non-German languages
**Quick Win:** Run frequency import scripts to unlock 2 new language pairs immediately
