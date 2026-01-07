# User 62 Quiz Language Issue - Root Cause Analysis

## Problem Summary
User 62 (en→es language pair) is seeing words in the wrong language during quizzes.

## Investigation Results

### User Details
- **User ID**: 62
- **Name**: test_en_es
- **Language Pair**: English → Spanish (en→es)
  - **From Language (native)**: en (English)
  - **To Language (learning)**: es (Spanish)
- **Expected Quiz Behavior**: Should show SPANISH words with ENGLISH translations

### Current State
- **Total Words**: 50
- **All words are ENGLISH** (should be Spanish!)
- **All translations are EMPTY**
- **Language codes are undefined**
- **Example word**: "older", "operating", "option" (all English words)

### Root Cause

User 62 imported **wrong word sets** for their language pair:

1. **Imported Sets**:
   - Set 8574: "English A1: General 1" (`source_language: english`)
   - Set 8608: "English A1: General 10" (`source_language: english`)

2. **Problem**:
   - These sets contain English words ("able", "about", "orders", etc.)
   - For language pair en→es, user needs **Spanish word sets**, not English!
   - The system should show sets like "Spanish A1: General 1" for this user

### Why This Happened

**Frontend Bug in [public/word-lists-ui.js:179](public/word-lists-ui.js#L179)**:

The code built language pair code incorrectly:
```javascript
// WRONG: Sends "en-es" for en→es user
const langPairCode = `${fromLanguage}-${toLanguage}`;
```

Backend interprets FIRST part as learning language:
```javascript
const learningLanguage = parts[0]; // Gets "en" from "en-es"
// Shows English word sets ❌
```

For user learning **en→es** (English to Spanish):
- ❌ Current: Sends "en-es" → Shows "English" word sets
- ✅ Should send: "es-en" → Show "Spanish" word sets

## Solutions

### ✅ Solution 1: Fix Frontend Language Pair Code (IMPLEMENTED)

**File**: [public/word-lists-ui.js:183](public/word-lists-ui.js#L183)

**Change**:
```javascript
// BEFORE (WRONG):
const langPairCode = `${this.languagePair.fromLanguage}-${this.languagePair.toLanguage}`;

// AFTER (CORRECT):
const langPairCode = `${this.languagePair.toLanguage}-${this.languagePair.fromLanguage}`;
```

**Why**: First part of languagePair is interpreted by backend as the learning language. For en→es user learning Spanish, we need to send "es-en" not "en-es".

### Solution 2: Clean Up User 62's Incorrect Words

**Script**: [scripts/fix-user-62-words.js](scripts/fix-user-62-words.js)

Run this to delete user 62's 50 English words:
```bash
node scripts/fix-user-62-words.js
```

After deletion, user can import correct Spanish word sets.

### Solution 3: Add Validation (Future Enhancement)
Add validation in import endpoint to prevent importing incompatible word sets:
- Check if `word_set.source_language` matches user's TARGET language (`to_lang`)
- Show error if mismatch

## Immediate Fix for User 62

Run this script to clean up and reimport correct words:

```sql
-- Delete all words for user 62
DELETE FROM user_word_progress
WHERE user_id = 62 AND language_pair_id = 66;

-- User should then import SPANISH word sets, not English ones
```

## Files to Fix

1. **[public/word-lists-ui.js](public/word-lists-ui.js:182)** - Fix word set filtering logic
2. **[server-postgresql.js](server-postgresql.js:3307)** - Add validation in import endpoint

## Test Case

After fix, verify:
- User with en→es pair sees only Spanish word sets
- User with es→en pair sees only English word sets
- Import only allows matching source_language to user's to_lang
