# 📋 Future Plan: POS (Part of Speech) Data Population

**Priority:** Low (Optional Enhancement)
**Status:** Planned
**Created:** 2026-01-07

## Current Status

✅ **Database structure ready:**
- All 18 `source_words_*` tables have `pos` column
- Column type: `VARCHAR(50)`, nullable
- Indexes created for performance
- Currently all values are `NULL`

## What is POS?

POS (Part of Speech) identifies the grammatical role of a word:
- **noun** - дом, human, idea
- **verb** - to run, думать, être
- **adjective** - beautiful, большой, schnell
- **adverb** - quickly, хорошо, très
- **pronoun** - I, ты, er
- **preposition** - in, на, dans
- **conjunction** - and, но, und
- **interjection** - oh, ой, ah

## Benefits of POS Data

### For Users
1. **Filtering**: "Show me only verbs" or "A2 level adjectives"
2. **Context**: Display words with proper grammar (articles, conjugation hints)
3. **Organization**: "100 most important verbs", "Food-related nouns"
4. **Better learning**: Different parts of speech need different learning strategies

### For Application
1. **Smart word sets**: Auto-group by POS
2. **SRS optimization**: Different repetition intervals for nouns vs verbs
3. **Grammar integration**: Show conjugation for verbs, plural for nouns
4. **Search enhancement**: "Find all adjectives describing emotions"

## Implementation Plan

### Phase 1: Research & Setup (1-2 days)
1. Evaluate POS detection libraries:
   - **Wink-NLP** (English, lightweight)
   - **compromise** (English, fast)
   - **spaCy** (multilingual, accurate but heavy)
   - **Translation APIs** (Google, DeepL) - may include POS in response

2. Test accuracy on sample data:
   - Take 100 words from each language
   - Compare library results with manual classification
   - Choose best tool per language

### Phase 2: Script Development (2-3 days)
1. Create POS detection script:
   ```javascript
   // scripts/populate-pos-data.js
   // - Connects to database
   // - Reads words from source_words_* tables
   // - Detects POS using chosen library
   // - Updates pos column
   // - Handles errors gracefully
   ```

2. Features to implement:
   - Batch processing (100 words at a time)
   - Progress tracking
   - Error logging
   - Dry-run mode (preview changes)
   - Resume capability (if interrupted)

### Phase 3: Data Population (varies by method)

**Option A: Offline processing (Fast, ~1 hour)**
- Run script locally with all libraries installed
- Process all 18 languages sequentially
- Update database in batches

**Option B: API-based (Slow, may cost money)**
- Use translation API with POS detection
- Rate-limited, may take hours/days
- Potentially more accurate for non-English

**Option C: Hybrid**
- Use Wink-NLP for English, French, German, Spanish
- Use APIs for Asian languages (Chinese, Japanese, Korean)
- Manual verification for edge cases

### Phase 4: Verification & QA (1 day)
1. Sample check: Verify 100 random words per language
2. Statistics: Count distribution (how many nouns, verbs, etc.)
3. Edge cases: Check multi-word phrases, idioms
4. API testing: Ensure queries work with POS filtering

### Phase 5: Feature Development (3-5 days)
1. **Backend API**:
   ```javascript
   // GET /api/word-sets?languagePair=en-es&level=A1&pos=verb
   // Returns only verb word sets
   ```

2. **Frontend UI**:
   - Add POS filter dropdown in word sets page
   - Show POS badge on word cards
   - Statistics page: "You know 120 verbs, 80 nouns..."

3. **Word details**:
   - Display POS in word info
   - Show relevant grammar (conjugation for verbs, etc.)

## Technical Considerations

### Database Queries
```sql
-- Find all verbs at A1 level
SELECT word, pos, level FROM source_words_english
WHERE pos = 'verb' AND level = 'A1';

-- Statistics by POS
SELECT pos, COUNT(*) as count
FROM source_words_english
GROUP BY pos
ORDER BY count DESC;
```

### Performance
- ✅ Indexes already created on `pos` column
- ✅ Queries will be fast
- ⚠️ Initial population may take time

### Data Quality
- Some words can be multiple POS (e.g., "light" = noun/adjective/verb)
- Store primary POS, note in comments if ambiguous
- Regular expressions and idioms may need manual classification

## Dependencies

### Libraries (if using offline processing)
```json
{
  "wink-nlp": "^1.x",
  "wink-eng-lite-model": "^1.x",
  "compromise": "^14.x"
}
```

### APIs (if using external services)
- Google Cloud Translation API
- DeepL API (may not include POS)
- Custom linguistic analysis services

## Estimated Effort

- **Database setup**: ✅ DONE
- **Research & testing**: 1-2 days
- **Script development**: 2-3 days
- **Data population**: 1 hour - 1 week (depends on method)
- **Verification**: 1 day
- **Feature development**: 3-5 days

**Total**: ~1-2 weeks for full implementation

## When to Implement?

Consider implementing when:
1. ✅ Basic vocabulary features are stable
2. ✅ All languages have sufficient word coverage
3. 🔲 User feedback requests filtering/organization features
4. 🔲 Have development time available
5. 🔲 Want to differentiate from competitors

## Alternative: Manual Entry

For now, POS can be manually added for high-frequency words:
```sql
-- Add POS for common English verbs
UPDATE source_words_english
SET pos = 'verb'
WHERE word IN ('be', 'have', 'do', 'say', 'go', 'get', 'make', 'know', 'think', 'take');
```

This could be done gradually without full automation.

---

**Status**: 📋 Planned for future
**Priority**: Low (nice-to-have, not critical)
**Database**: ✅ Ready (all columns added)
**Estimated effort**: 1-2 weeks
**Next step**: User feedback on whether this feature is valuable

