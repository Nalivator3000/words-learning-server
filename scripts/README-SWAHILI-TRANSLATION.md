# Swahili Translation Script

## Overview
This script translates ALL German words from the `source_words_german` table to Swahili and inserts them into the `target_translations_swahili` table.

## File
- **Location**: `scripts/translate-all-to-swahili.js`
- **Target Table**: `target_translations_swahili`
- **Source Table**: `source_words_german`
- **Expected Words**: ~10,515 German words

## Prerequisites

### 1. Install Required Package
The script uses the Google Translate API through a Node.js library:

```bash
npm install @vitalets/google-translate-api --save
```

### 2. Database Setup
Ensure the `target_translations_swahili` table exists. If not, run:

```bash
node scripts/create-translation-tables.js
```

## Usage

### Run the Translation Script
```bash
node scripts/translate-all-to-swahili.js
```

### What the Script Does

1. **Fetches all German words** from `source_words_german` table (ordered by ID)
2. **Checks for existing translations** to avoid duplicates (uses UNIQUE constraint)
3. **Translates each word** from German to Swahili using Google Translate API
4. **Inserts translations** into `target_translations_swahili` table
5. **Handles errors gracefully** with retry logic (3 attempts per word)
6. **Rate limiting protection** with delays between requests (500ms every 10 words)
7. **Progress tracking** with regular updates every 50 translations
8. **Saves failed translations** to `scripts/failed-swahili-translations.json` for review

## Features

### Intelligent Translation
- **Article Removal**: Automatically removes German articles (der, die, das, ein, eine) before translation for better results
- **Retry Logic**: 3 attempts per word with exponential backoff (1s, 2s, 4s)
- **Duplicate Prevention**: Skips words that are already translated

### Error Handling
- Catches and logs translation failures
- Catches database insertion errors
- Saves failed words to JSON file for manual review
- Continues processing even if some words fail

### Progress Monitoring
- Shows real-time progress percentage
- Updates every 50 successful translations
- Displays count of translated, skipped, and failed words
- Final summary with coverage statistics

## Expected Output

```
🚀 Starting Swahili translation script...

🌍 Translating ALL German words → Swahili...

📊 Fetching German words from database...

Found 10515 total German words in database

Starting translation process...

────────────────────────────────────────────────────────────
✓ Translated: 50 | Progress: 0.5% | Failed: 0 | Skipped: 0
✓ Translated: 100 | Progress: 1.0% | Failed: 0 | Skipped: 0
✓ Translated: 150 | Progress: 1.4% | Failed: 0 | Skipped: 0
...
✓ Translated: 10515 | Progress: 100.0% | Failed: 0 | Skipped: 0

────────────────────────────────────────────────────────────

✅ Translation complete!

📈 Summary:
   Total words in database: 10515
   Successfully translated: 10515
   Already existed (skipped): 0
   Failed to translate: 0
   Coverage: 100.00%

✅ Total Swahili translations in database: 10515

🎉 Script completed successfully!
```

## Database Schema

The translations are stored in:

```sql
CREATE TABLE target_translations_swahili (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id),
  translation TEXT NOT NULL,
  example_sw TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);
```

## Performance Considerations

### Estimated Runtime
- **~10,515 words** to translate
- **~500ms delay** every 10 words for rate limiting
- **Estimated time**: 9-12 hours (depending on network speed and API response time)

### Rate Limiting
The script includes built-in delays to avoid overwhelming the Google Translate API:
- 500ms delay every 10 words
- Retry logic with exponential backoff for failed requests

### Optimization Tips
1. **Run overnight**: Due to the large number of words, consider running overnight
2. **Monitor progress**: Check console output periodically
3. **Resume capability**: Script automatically skips already-translated words, so you can stop and resume

## Troubleshooting

### Issue: Rate Limit Errors
**Solution**: The script already includes delays. If you still hit rate limits, increase the delay in line 113:
```javascript
await delay(1000); // Increase from 500ms to 1000ms
```

### Issue: Network Errors
**Solution**: The script has retry logic. Check your internet connection and restart.

### Issue: Database Connection Errors
**Solution**: Verify database credentials in the connection string.

### Issue: Failed Translations
**Solution**: Check `scripts/failed-swahili-translations.json` for words that couldn't be translated. You may need to translate these manually.

## Verifying Results

After running the script, verify the translations:

```sql
-- Check total count
SELECT COUNT(*) FROM target_translations_swahili WHERE source_lang = 'de';

-- View sample translations
SELECT
  sw.id,
  sw.word AS german_word,
  sw.level,
  ts.translation AS swahili_translation
FROM source_words_german sw
JOIN target_translations_swahili ts ON ts.source_word_id = sw.id
WHERE ts.source_lang = 'de'
LIMIT 20;

-- Check coverage by level
SELECT
  sw.level,
  COUNT(*) as total_words,
  COUNT(ts.id) as translated_words,
  ROUND(COUNT(ts.id)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percent
FROM source_words_german sw
LEFT JOIN target_translations_swahili ts ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
GROUP BY sw.level
ORDER BY sw.level;
```

## Notes

- The script uses `ON CONFLICT` to handle duplicates gracefully
- All timestamps are automatically managed (created_at, updated_at)
- The script is idempotent - safe to run multiple times
- Failed translations are saved for manual review
- Article removal improves translation accuracy for German nouns

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Review `scripts/failed-swahili-translations.json` if it exists
3. Verify database connectivity
4. Ensure the Google Translate API package is installed
5. Check your internet connection

## Related Scripts

- `scripts/translate-batch1-english.js` - English translation reference
- `scripts/create-translation-tables.js` - Creates translation tables
- `migrations/create-translation-tables.sql` - SQL schema for all translation tables
