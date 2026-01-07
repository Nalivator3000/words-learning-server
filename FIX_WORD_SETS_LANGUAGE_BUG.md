# Fix: Word Sets Showing Wrong Language

## Bug Summary
Users were seeing word sets in the wrong language. For example:
- User with **en→es** (learning Spanish from English) saw **English word sets** instead of Spanish
- This caused quiz to show words in wrong language with no translations

## Root Cause

### Frontend Issue ([public/word-lists-ui.js:179](public/word-lists-ui.js#L179))

**Before (WRONG):**
```javascript
const langPairCode = `${this.languagePair.fromLanguage}-${this.languagePair.toLanguage}`;
// For en→es user: sends "en-es"
```

**Backend Interpretation ([server-postgresql.js:2855](server-postgresql.js#L2855)):**
```javascript
const learningLanguage = parts[0]; // Takes FIRST part
// Receives "en-es" → shows English word sets ❌
```

**Result:** User learning Spanish sees English word sets!

## The Fix

**After (CORRECT):**
```javascript
const langPairCode = `${this.languagePair.toLanguage}-${this.languagePair.fromLanguage}`;
// For en→es user: sends "es-en"
```

**Backend Interpretation:**
```javascript
const learningLanguage = parts[0]; // Takes FIRST part
// Receives "es-en" → shows Spanish word sets ✅
```

**Result:** User learning Spanish sees Spanish word sets!

## Changed Files

1. **[public/word-lists-ui.js](public/word-lists-ui.js#L183)** - Fixed languagePair code building

## Impact on User 62

User 62 currently has 50 English words that need to be deleted:
1. Run cleanup script: `node scripts/fix-user-62-words.js`
2. Deploy the frontend fix
3. User can then import correct Spanish word sets

## Testing

### Before Fix:
- User en→es sees: "English A1: General 1", "English A2: General 2", etc.
- Import results in English words with no Spanish translations

### After Fix:
- User en→es sees: "Spanish A1: General 1", "Spanish A2: General 2", etc.
- Import results in Spanish words with English translations

### Test Cases:
- [ ] en→es user sees Spanish word sets
- [ ] es→en user sees English word sets
- [ ] de→en user sees German word sets
- [ ] en→de user sees English word sets
- [ ] Import works correctly with translations

## Deployment Steps

1. Deploy frontend fix ([public/word-lists-ui.js](public/word-lists-ui.js))
2. Clear user 62's incorrect words (optional, via script)
3. Verify word sets show correct language for each user
4. Monitor for any import issues

## Related Issues

This fixes the issue where user 62 saw words in wrong language during quiz (as shown in screenshot with "дополнительный").
