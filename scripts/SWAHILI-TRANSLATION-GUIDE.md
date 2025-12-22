# Complete Guide: German to Swahili Translation

## Overview
This guide covers the complete process of translating all ~10,515 German words to Swahili using automated translation.

## Quick Start

### Windows Users
```cmd
cd scripts
setup-and-run-swahili.bat
```

### Linux/Mac Users
```bash
cd scripts
chmod +x setup-and-run-swahili.sh
./setup-and-run-swahili.sh
```

### Manual Installation
```bash
# Install dependency
npm install @vitalets/google-translate-api --save

# Run translation
node scripts/translate-all-to-swahili.js

# Verify results
node scripts/verify-swahili-translations.js
```

## Files Created

### 1. Main Translation Script
**File**: `scripts/translate-all-to-swahili.js`

**Purpose**: Translates all German words to Swahili and inserts into database

**Features**:
- Fetches all ~10,515 German words from `source_words_german`
- Translates each word from German to Swahili using Google Translate API
- Inserts translations into `target_translations_swahili` table
- Handles rate limiting with delays (500ms every 10 words)
- Retry logic with exponential backoff (3 attempts per word)
- Skips already-translated words (idempotent)
- Saves failed translations to JSON file
- Real-time progress tracking
- Comprehensive error handling

**Key Functions**:
- `extractBaseWord()` - Removes German articles for better translation
- `translateWord()` - Translates single word with retry logic
- `translateAllToSwahili()` - Main translation orchestrator

### 2. Verification Script
**File**: `scripts/verify-swahili-translations.js`

**Purpose**: Verify translation completeness and quality

**Reports**:
- Total German words vs translated words
- Coverage percentage overall and by CEFR level
- Missing translations (if any)
- Sample translations (random 20)
- Statistics (min/max/avg translation length)
- Recently added translations
- Duplicate check
- Empty translation check

### 3. Setup Scripts
**Files**:
- `scripts/setup-and-run-swahili.bat` (Windows)
- `scripts/setup-and-run-swahili.sh` (Linux/Mac)

**Purpose**: One-click installation and execution

### 4. Documentation
**Files**:
- `scripts/README-SWAHILI-TRANSLATION.md` - Detailed documentation
- `scripts/SWAHILI-TRANSLATION-GUIDE.md` - This guide

## Database Schema

### Source Table: `source_words_german`
```sql
- id: INTEGER (primary key)
- word: TEXT (German word)
- level: VARCHAR (A1, A2, B1, B2, C1, C2)
- example_de: TEXT (German example sentence)
```

### Target Table: `target_translations_swahili`
```sql
CREATE TABLE target_translations_swahili (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id),
  translation TEXT NOT NULL,
  example_sw TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)  -- Prevents duplicates
);
```

## Translation Process Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Fetch all German words from source_words_german     │
│    (~10,515 words ordered by ID)                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. For each word:                                       │
│    a. Check if translation already exists               │
│    b. Skip if exists (idempotent)                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Remove German articles (der, die, das, ein, eine)   │
│    For better translation accuracy                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Translate German → Swahili via Google Translate     │
│    - Up to 3 retry attempts                             │
│    - Exponential backoff (1s, 2s, 4s)                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Insert translation into target_translations_swahili │
│    - Uses ON CONFLICT for safety                        │
│    - Auto-updates timestamp                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Rate limiting: 500ms delay every 10 words           │
│    Prevents API throttling                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Progress tracking: Update every 50 translations     │
│    Shows: translated, failed, skipped, progress %       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Error handling:                                      │
│    - Log translation failures                           │
│    - Log database errors                                │
│    - Save failed words to JSON                          │
│    - Continue processing                                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Final summary:                                       │
│    - Total translated                                   │
│    - Total skipped (already existed)                    │
│    - Total failed                                       │
│    - Overall coverage %                                 │
└─────────────────────────────────────────────────────────┘
```

## Expected Timeline

### Estimated Duration: 9-12 hours

**Breakdown**:
- 10,515 words to translate
- ~3-4 seconds per word (including API call + delays)
- Rate limiting: 500ms delay every 10 words
- Network latency varies

**Tips**:
- Run overnight or during off-hours
- Monitor progress periodically
- Script can be stopped and resumed (skips existing translations)

## Progress Tracking

### Console Output Example
```
🌍 Translating ALL German words → Swahili...

📊 Fetching German words from database...
Found 10515 total German words in database

Starting translation process...
────────────────────────────────────────────────────────────
✓ Translated: 50 | Progress: 0.5% | Failed: 0 | Skipped: 0
✓ Translated: 100 | Progress: 1.0% | Failed: 0 | Skipped: 0
✓ Translated: 500 | Progress: 4.8% | Failed: 2 | Skipped: 0
✓ Translated: 1000 | Progress: 9.5% | Failed: 5 | Skipped: 0
...
✓ Translated: 10500 | Progress: 99.9% | Failed: 15 | Skipped: 0
────────────────────────────────────────────────────────────

✅ Translation complete!

📈 Summary:
   Total words in database: 10515
   Successfully translated: 10500
   Already existed (skipped): 0
   Failed to translate: 15
   Coverage: 99.86%
```

## Error Handling

### Types of Errors

1. **Network/API Errors**
   - Retry up to 3 times with exponential backoff
   - If still fails, log error and continue
   - Save failed word to JSON file

2. **Database Errors**
   - Log error with word details
   - Continue processing other words
   - Save failed word to JSON file

3. **Rate Limiting**
   - Built-in delays prevent this
   - If occurs, retry logic handles it

### Failed Translations File
Location: `scripts/failed-swahili-translations.json`

Structure:
```json
[
  {
    "id": 1234,
    "word": "das Beispielwort",
    "level": "B2",
    "error": "Translation failed after 3 attempts"
  }
]
```

## Verification Process

### After Translation Completes

1. **Run verification script**:
   ```bash
   node scripts/verify-swahili-translations.js
   ```

2. **Check output for**:
   - Coverage percentage (should be 100% or close)
   - Missing translations
   - Sample translations quality
   - No duplicates
   - No empty translations

3. **SQL verification queries**:
   ```sql
   -- Total count
   SELECT COUNT(*) FROM target_translations_swahili WHERE source_lang = 'de';

   -- Sample translations
   SELECT sw.word, ts.translation, sw.level
   FROM source_words_german sw
   JOIN target_translations_swahili ts ON ts.source_word_id = sw.id
   WHERE ts.source_lang = 'de'
   LIMIT 20;

   -- Missing translations
   SELECT sw.word, sw.level
   FROM source_words_german sw
   LEFT JOIN target_translations_swahili ts
     ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
   WHERE ts.id IS NULL;
   ```

## Troubleshooting

### Issue: Script stops unexpectedly
**Solution**:
- Check internet connection
- Review console for error messages
- Restart script (will skip already-translated words)

### Issue: Many translation failures
**Solution**:
- Check API availability
- Increase retry delay in code
- Check network connectivity
- Review failed words in JSON file

### Issue: Database connection errors
**Solution**:
- Verify database credentials
- Check database is running
- Test connection with other scripts

### Issue: Rate limiting errors
**Solution**:
- Increase delay (line 113): `await delay(1000);` instead of 500ms
- Reduce batch processing speed

### Issue: Translations seem incorrect
**Solution**:
- Google Translate API quality varies
- Some technical terms may need manual review
- Context-dependent words may need adjustment
- Consider post-translation review for critical terms

## Post-Translation Tasks

1. **Review Failed Translations**
   - Check `scripts/failed-swahili-translations.json`
   - Manually translate failed words if needed
   - Insert manual translations into database

2. **Quality Spot Check**
   - Review random sample of translations
   - Check technical terms accuracy
   - Verify CEFR level consistency

3. **Database Backup**
   ```bash
   # Backup translations table
   pg_dump -h mainline.proxy.rlwy.net -p 54625 -U postgres -d railway \
     -t target_translations_swahili > swahili_translations_backup.sql
   ```

4. **Update Application**
   - Ensure app can query Swahili translations
   - Test user experience with Swahili language option
   - Verify quiz functionality

## SQL Queries for Analysis

### Coverage by Level
```sql
SELECT
  sw.level,
  COUNT(*) as total,
  COUNT(ts.id) as translated,
  ROUND(COUNT(ts.id)::numeric / COUNT(*) * 100, 2) as coverage
FROM source_words_german sw
LEFT JOIN target_translations_swahili ts
  ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
GROUP BY sw.level
ORDER BY sw.level;
```

### Find Longest Translations
```sql
SELECT sw.word, ts.translation, LENGTH(ts.translation) as len
FROM source_words_german sw
JOIN target_translations_swahili ts ON ts.source_word_id = sw.id
WHERE ts.source_lang = 'de'
ORDER BY len DESC
LIMIT 10;
```

### Find Shortest Translations
```sql
SELECT sw.word, ts.translation, LENGTH(ts.translation) as len
FROM source_words_german sw
JOIN target_translations_swahili ts ON ts.source_word_id = sw.id
WHERE ts.source_lang = 'de'
ORDER BY len ASC
LIMIT 10;
```

### Translation Statistics
```sql
SELECT
  COUNT(*) as total_translations,
  MIN(LENGTH(translation)) as min_length,
  MAX(LENGTH(translation)) as max_length,
  ROUND(AVG(LENGTH(translation)), 2) as avg_length,
  MIN(created_at) as first_translation,
  MAX(created_at) as last_translation
FROM target_translations_swahili
WHERE source_lang = 'de';
```

## Dependencies

### Required Package
```json
{
  "dependencies": {
    "@vitalets/google-translate-api": "^2.3.0"
  }
}
```

### Installation
```bash
npm install @vitalets/google-translate-api --save
```

## Performance Optimization

### If Translation is Too Slow
1. Reduce delay: Change `await delay(500)` to `await delay(300)`
2. Process in batches: Split into multiple runs
3. Run parallel instances (with different ID ranges)

### If API Rate Limited
1. Increase delay: Change to `await delay(1000)` or higher
2. Reduce batch size before delay
3. Add longer delays between batches

## Maintenance

### Re-running Translation
The script is idempotent and can be safely re-run:
- Existing translations are skipped
- Only new/missing words are translated
- No duplicates created (UNIQUE constraint)

### Updating Existing Translations
To force re-translation:
```sql
-- Delete specific translations
DELETE FROM target_translations_swahili
WHERE source_word_id IN (SELECT id FROM source_words_german WHERE level = 'A1');

-- Then re-run script
```

### Adding New German Words
1. Insert new words into `source_words_german`
2. Run translation script
3. Script will automatically translate only new words

## Success Criteria

✅ **Complete Success**:
- 10,515 translations in database
- 100% coverage
- No failed translations
- Verification script shows all green

✅ **Acceptable Success**:
- 99%+ coverage
- Failed translations reviewed
- Critical words manually translated
- Overall quality verified

## Support & Resources

### Files Reference
- Main script: `scripts/translate-all-to-swahili.js`
- Verification: `scripts/verify-swahili-translations.js`
- Setup (Windows): `scripts/setup-and-run-swahili.bat`
- Setup (Linux/Mac): `scripts/setup-and-run-swahili.sh`
- Documentation: `scripts/README-SWAHILI-TRANSLATION.md`
- This guide: `scripts/SWAHILI-TRANSLATION-GUIDE.md`

### Translation Library
- Package: [@vitalets/google-translate-api](https://www.npmjs.com/package/@vitalets/google-translate-api)
- GitHub: https://github.com/vitalets/google-translate-api

### Contact
For issues or questions, check:
1. Console output for specific errors
2. `failed-swahili-translations.json` for failed words
3. Verification script output
4. Database connection logs

## Next Steps After Translation

1. ✅ Run verification script
2. ✅ Review failed translations (if any)
3. ✅ Spot check translation quality
4. ✅ Backup database
5. ✅ Update application to support Swahili
6. ✅ Test user interface with Swahili
7. ✅ Deploy to production

---

**Last Updated**: 2025-12-21
**Script Version**: 1.0
**Expected Words**: ~10,515
**Target Table**: `target_translations_swahili`
**Source Language**: German (de)
**Target Language**: Swahili (sw)
