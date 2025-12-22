# Arabic Translation Script

## Overview

`translate-all-to-arabic.js` - Translates all German words (~10,540 words) to Arabic and inserts them into the `target_translations_arabic` table.

## Features

- **Complete Translation**: Translates all ~10,540 German words to Arabic
- **RTL Text Support**: Properly handles Right-to-Left Arabic text
- **Arabic Character Validation**: Verifies translations contain actual Arabic Unicode characters (U+0600-U+06FF)
- **Batch Processing**: Processes 100 words at a time for efficiency
- **Rate Limiting**: 1.5-second delay between batches to avoid API throttling
- **Retry Logic**: Up to 3 retry attempts per word with exponential backoff
- **Progress Tracking**: Real-time progress display with statistics
- **Error Handling**: Comprehensive error logging and recovery
- **Skip Existing**: Automatically skips words that are already translated
- **Error Log**: Saves failed translations to `translation-errors-arabic.json`

## Technical Details

### Configuration

```javascript
BATCH_SIZE = 100              // Words per batch
DELAY_BETWEEN_BATCHES = 1500  // Milliseconds (1.5 seconds)
MAX_RETRIES = 3               // Retry attempts per word
```

### RTL Handling

- Uses Unicode range U+0600-U+06FF to validate Arabic characters
- Stores text in UTF-8 format (PostgreSQL `text` type)
- Validates each translation contains Arabic characters
- Warns if translation doesn't include Arabic script

### Database Schema

Inserts into `target_translations_arabic` table:
- `source_lang`: 'de' (German)
- `source_word_id`: ID from source_words_german
- `translation`: Arabic translation text (RTL)

## Usage

### Run the script

```bash
node scripts/translate-all-to-arabic.js
```

### Expected Runtime

- ~10,540 words total
- ~100 words per batch
- ~1.5 seconds between batches
- Estimated total time: 25-35 minutes

### Output Example

```
Starting German to Arabic translation for ALL words...

Configuration:
  Batch size: 100 words
  Delay between batches: 1500ms
  Max retries per word: 3
  RTL text handling: Enabled

Total German words in database: 10540

======================================================================

Processing batch 1 (words 1-100)...

======================================================================
Progress: 100/10540 (0.9%)
  Translated: 100
  Skipped (already exist): 0
  Failed: 0

Last translation:
  DE: Hallo
  AR: مرحبا
  Level: A1
======================================================================

Waiting 1500ms before next batch...
```

### Final Summary

```
======================================================================
TRANSLATION COMPLETE
======================================================================

Final Statistics:
  Total words processed: 10540
  Successfully translated: 10540
  Already existed (skipped): 0
  Failed: 0
  Total time: 28.45 minutes
  Average: 370.5 words/minute

Database verification:
  Total Arabic translations now in database: 10540

Random sample of translations:
  [A1] Hallo → مرحبا
  [A1] danke → شكرا
  [A2] Freund → صديق
  [B1] verstehen → فهم
  [B2] entwickeln → يطور
  [C1] vermitteln → يوصل
  [C2] konkretisieren → يحدد

======================================================================
All translations completed successfully!
======================================================================
```

## Error Handling

### Automatic Retries
- Network errors: 3 retry attempts with exponential backoff
- Parse errors: 3 retry attempts
- Delays: 1s, 2s, 3s for retries 1, 2, 3

### Error Logging
If errors occur, they're saved to `translation-errors-arabic.json`:

```json
{
  "timestamp": "2025-12-21T10:30:00.000Z",
  "totalErrors": 5,
  "errors": [
    {
      "id": 1234,
      "word": "problematic word",
      "level": "B2",
      "error": "Translation request failed"
    }
  ]
}
```

### Resume Capability
- Script automatically skips already-translated words
- Safe to stop and restart
- No duplicate translations created

## Verification

### Check translation count

```bash
node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: 'postgresql://postgres:...', ssl: {rejectUnauthorized: false}}); pool.query('SELECT COUNT(*) FROM target_translations_arabic WHERE source_lang = \\'de\\'').then(r => {console.log('Arabic translations:', r.rows[0].count); pool.end();});"
```

### View sample translations

```bash
node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: 'postgresql://postgres:...', ssl: {rejectUnauthorized: false}}); pool.query('SELECT sw.word, ta.translation FROM source_words_german sw JOIN target_translations_arabic ta ON ta.source_word_id = sw.id WHERE ta.source_lang = \\'de\\' ORDER BY RANDOM() LIMIT 10').then(r => {r.rows.forEach(row => console.log(row.word, '→', row.translation)); pool.end();});"
```

## API Used

- **Google Translate API** (free tier)
- Endpoint: `translate.googleapis.com/translate_a/single`
- Translation: German (de) → Arabic (ar)
- No API key required for this endpoint

## Notes

- Arabic is written Right-to-Left (RTL)
- Text is stored as UTF-8 in PostgreSQL
- All translations are validated for Arabic characters
- Script displays Arabic text correctly in terminal (if terminal supports RTL)
- Progress is saved to database in real-time
- Safe to interrupt and resume

## Troubleshooting

### "Invalid translation response"
- Retry automatically triggered
- Check internet connection
- May indicate API rate limiting

### "Translation doesn't contain Arabic characters"
- Warning only (translation still saved)
- Review translation manually
- May occur for numbers, names, or technical terms

### Script stops unexpectedly
- Check `translation-errors-arabic.json` for details
- Restart script (it will skip completed translations)
- Database connection may have timed out

## See Also

- `translate-batch1-english.js` - English translation reference
- `source_words_german` table - Source German words
- `target_translations_arabic` table - Target Arabic translations
