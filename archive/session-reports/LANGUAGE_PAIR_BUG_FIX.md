# Language Pair Bug Fix - Hindi and Other Languages

## Problem Description

When viewing word sets for Hindi → English (and potentially other language pairs), the interface was showing Russian translations instead of the correct target language (Hindi words with English translations).

## Root Cause

There was a mismatch between how the database stores language pair information and how the frontend was building the `languagePair` parameter for API requests.

### Database Schema

In the `language_pairs` table:
- `from_lang` = the language being **learned** (e.g., `hi` for Hindi)
- `to_lang` = the **native** language (e.g., `en` for English)

### API Transformation

The server transforms database columns to camelCase ([server-postgresql.js:52-53](server-postgresql.js#L52-L53)):
```javascript
fromLanguage: pair.from_lang,  // learning language
toLanguage: pair.to_lang,      // native language
```

### Frontend Bug

The frontend code in [word-lists-ui.js:186](public/word-lists-ui.js#L186) was **incorrectly** building the `languagePair` parameter:

**BEFORE (incorrect):**
```javascript
const langPairCode = this.languagePair
    ? `${this.languagePair.toLanguage}-${this.languagePair.fromLanguage}`
    : null;
```

This created `en-hi` (native-learning) when it should be `hi-en` (learning-native).

**AFTER (correct):**
```javascript
const langPairCode = this.languagePair
    ? `${this.languagePair.fromLanguage}-${this.languagePair.toLanguage}`
    : null;
```

This now correctly creates `hi-en` (learning-native).

### Why This Caused Russian Translations

When the wrong language pair was sent:
1. Frontend sent `en-hi` to the API
2. Server expected format: `{learning}-{native}`
3. Server interpreted this as "learning English from Hindi"
4. Server found English word sets instead of Hindi word sets
5. Server used fallback logic for missing translations
6. Fallback defaulted to Russian when source language was English ([server-postgresql.js:3121](server-postgresql.js#L3121))

## Changes Made

### File: [public/word-lists-ui.js](public/word-lists-ui.js)

#### Change 1: Fixed languagePair format (lines 177-187)
- **Before:** `${toLanguage}-${fromLanguage}` → incorrect format
- **After:** `${fromLanguage}-${toLanguage}` → correct format
- Updated comments to clarify the correct interpretation

#### Change 2: Fixed console.log message (line 189)
- **Before:** `learning ${toLanguage} from ${fromLanguage}` → misleading
- **After:** `learning ${fromLanguage} from ${toLanguage}` → correct

### No Changes Needed

The `native_lang` parameter in [word-lists-ui.js:874](public/word-lists-ui.js#L874) was already correct:
```javascript
url += `?native_lang=${this.languagePair.toLanguage}`;
```

This correctly sends the native language (e.g., `en` for English) as the target translation language.

## Impact

This fix affects **all language pairs**, not just Hindi → English. Any language pair where:
- The learning language has word sets
- The native language is not the default (Russian for non-English, English for others)

Would have experienced similar issues showing incorrect translations.

## Testing

To test the fix:
1. Deploy the updated [word-lists-ui.js](public/word-lists-ui.js)
2. Log in with a user who has Hindi → English language pair
3. Navigate to Word Lists
4. Verify that word sets show:
   - Hindi words (देवनागरी script)
   - English translations
   - NO Russian characters (а-я, А-Я)

## Test Script

Created [test-hindi-word-sets-api.js](test-hindi-word-sets-api.js) to verify the API returns correct translations.

**Note:** There is a separate database issue where `source_words_hindi` table is missing the `pos` column, which causes the word set details endpoint to return a 500 error. This is a different issue and needs to be addressed separately.

## Related Files

- [public/word-lists-ui.js](public/word-lists-ui.js) - Fixed
- [server-postgresql.js](server-postgresql.js) - No changes needed (server logic was correct)
- Other files using `fromLanguage`/`toLanguage` ([app.js](public/app.js), etc.) - Display only, no fix needed
