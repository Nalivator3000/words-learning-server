# API Architecture Update - Status Report

**Date:** December 30, 2025
**Status:** COMPLETED - Ready for Testing

---

## Changes Implemented

### 1. Helper Functions Added (Lines 11474-11730)

Created three new helper functions for the new architecture:

#### `getWordsWithProgress(userId, languagePairId, sourceLanguage, status, limit, onlyDue)`
- Fetches words from `source_words_*` tables with user progress tracking
- Handles three cases:
  - **'new' status**: Returns words user hasn't started yet (NOT EXISTS in user_word_progress)
  - **'review' status**: Returns words in review stages (review_1 through review_120) that are due
  - **Other statuses**: Returns words with specific status (studying, mastered, etc.)
- Always includes `id` field (= source_word_id) for frontend compatibility
- Returns columns: id, source_word_id, word, level, theme, translation, example, status, correct_count, etc.

#### `getWordCountsByStatus(userId, languagePairId, sourceLanguage)`
- Returns word counts grouped by status
- Compatible with dashboard display requirements
- Includes backward compatibility fields (review7, review30, learned, mastered)

#### `updateWordProgress(userId, languagePairId, sourceLanguage, sourceWordId, progressData)`
- Creates or updates user_word_progress record
- Idempotent: checks if record exists before INSERT/UPDATE
- Handles all progress fields: status, counts, review_cycle, ease_factor, etc.

---

### 2. Updated API Endpoints

#### `/api/words/random/:status/:count` ✅ UPDATED
**Old:** Queried `words` table directly
**New:**
1. Fetches language pair to get `from_lang` (source language)
2. Calls `getWordsWithProgress()` to get words from source_words_* + progress
3. Returns same JSON structure as before (frontend compatible)

**Changes:**
- Added validation for userId & languagePairId
- Added 404 response if language pair not found
- Uses dynamic table name based on source language

#### `/api/words/counts` ✅ UPDATED
**Old:** Queried `words` table with WHERE user_id/language_pair_id
**New:**
1. Fetches language pair to get source language
2. Calls `getWordCountsByStatus()`
3. Returns same JSON structure (backward compatible)

**Changes:**
- Required userId & languagePairId (no longer optional)
- Added 404 response if language pair not found

#### `/api/words/:id/progress` ✅ COMPLETELY REWRITTEN
**Old:** Updated `words` table by ID
**New:**
1. `:id` parameter now represents `source_word_id` (not words.id)
2. Extracts userId & languagePairId from request body
3. Fetches source word from `source_words_*` table
4. Loads or initializes progress from `user_word_progress`
5. Applies same SRS algorithm logic
6. Calls `updateWordProgress()` to save changes
7. Awards XP and checks achievements (same as before)

**Breaking Changes:**
- Frontend MUST send `userId` and `languagePairId` in request body
- The `id` param must be source_word_id (already the case with updated random endpoint)

---

## Frontend Changes Required

### 1. Update `updateWordProgress()` call in database.js

**Current (Line 74):**
```javascript
const response = await fetch(`${this.apiUrl}/api/words/${wordId}/progress`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        correct: isCorrect,
        questionType: quizType
    })
});
```

**Required:**
```javascript
const response = await fetch(`${this.apiUrl}/api/words/${wordId}/progress`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        correct: isCorrect,
        questionType: quizType,
        userId: this.getUserId(),           // ADD THIS
        languagePairId: this.getLanguagePairId()  // ADD THIS
    })
});
```

**Note:** The database.js file already has `getUserId()` and likely has language pair context.

---

## Testing Checklist

### Backend Tests (via curl or Postman)

1. **Test /api/words/counts**
```bash
curl "http://localhost:3000/api/words/counts?userId=5&languagePairId=1"
```
Expected: JSON with counts by status

2. **Test /api/words/random (new words)**
```bash
curl "http://localhost:3000/api/words/random/new/10?userId=7&languagePairId=1"
```
Expected: Array of 10 new German words (assuming languagePairId=1 is German)

3. **Test /api/words/random (studying)**
```bash
curl "http://localhost:3000/api/words/random/studying/5?userId=5&languagePairId=1"
```
Expected: Array of words with status='studying' (may be empty for new users)

4. **Test /api/words/:id/progress**
```bash
curl -X PUT "http://localhost:3000/api/words/1/progress" \
  -H "Content-Type: application/json" \
  -d '{"correct": true, "questionType": "multiple", "userId": 5, "languagePairId": 1}'
```
Expected: JSON with points, status, percentage

### Frontend Tests

1. **Dashboard loads without errors**
   - Word counts display correctly
   - No console errors

2. **Quiz/Learning flow works**
   - Can fetch new words
   - Can answer questions
   - Progress updates correctly
   - XP is awarded

3. **New user experience**
   - User #8, #9, #10 (0 words) should see "new" words
   - Can start learning immediately

---

## Database State

### Current User Data:
- **User #5 (Demo)**: 399 words in OLD `words` table
- **User #7 (Kovalex)**: 25 words in OLD `words` table
- **Users #1-4, #6, #8-10**: 0 words

### New Architecture:
- **source_words_german**: 8,076 words
- **source_words_english**: 9,974 words
- **source_words_french**: 9,332 words
- **source_words_italian**: 10,000 words
- **source_words_chinese**: 10,000 words
- **word_sets**: 170+ sets organized by level (A1-C2) and theme

### Migration Status:
- ✅ `user_word_progress` table created
- ✅ `word_sets` table populated
- ⏳ Need to migrate User #5 and #7 data from `words` to `user_word_progress`
- ⏳ Old `words` table still exists (backward compatibility during transition)

---

## Next Steps

### 1. Update Frontend (CRITICAL)
- Modify `public/database.js` or `public/api-database.js`
- Add `userId` and `languagePairId` to progress update requests

### 2. Test Endpoints
- Start server: `npm start`
- Test all three updated endpoints
- Verify new users can fetch words
- Verify progress updates work

### 3. Migration Script (for existing users)
Create script to copy data from `words` table to `user_word_progress`:
```javascript
// For each row in words table where user_id = 5 or 7:
// 1. Look up source_word_id by matching word text
// 2. Insert into user_word_progress with same progress data
```

### 4. Onboarding UI
- Create language selection flow
- Allow users to import word sets
- See ONBOARDING_PLAN.md for details

---

## Rollback Plan

If something breaks:

1. **Revert server.js changes**
   ```bash
   git diff server-postgresql.js > api-update.patch
   git checkout server-postgresql.js
   ```

2. **Old endpoints still work** (for now)
   - `words` table still exists
   - Can switch back by reverting changes

3. **No data loss**
   - `user_word_progress` table is new (empty except for new progress)
   - Old `words` table data intact

---

## Performance Notes

### Benefits:
- No word duplication (saves DB space)
- All users share source vocabularies
- Scales to millions of users

### Considerations:
- Extra JOIN required (source_words_* + user_word_progress)
- Indexes on user_word_progress should help:
  - PRIMARY KEY (id)
  - UNIQUE (user_id, language_pair_id, source_language, source_word_id)
  - These were created in migration

---

**Last Updated:** 2025-12-30
**Status:** Ready for testing
