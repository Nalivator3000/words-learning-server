# ✅ Deployment Checklist - Word Sets Language Fix

## Deployment Status

### ✅ Pushed to develop
- Commit: `2c75d9c`
- Branch: `develop`
- File: `public/word-lists-ui.js`
- Time: 2026-01-06

### Railway Deployment
Railway should automatically deploy from `develop` branch in 2-3 minutes.

## Verification Steps

### 1. Check Console Logs (5 minutes after push)

Open https://lexybooster.com and login as user 62 (test_en_es@lexibooster.test).

**Before fix (OLD):**
```
📋 [WORD-SETS] Built langPairCode: en-es  ❌ WRONG
📋 [WORD-SETS] Fetching from URL: /api/word-sets?languagePair=en-es
```

**After fix (NEW):**
```
📋 [WORD-SETS] Built langPairCode: es-en (learning es from en)  ✅ CORRECT
📋 [WORD-SETS] Fetching from URL: /api/word-sets?languagePair=es-en
```

### 2. Check Word Lists Page

Go to "Word Lists" page as user 62:

**Before fix:** Shows "English A1: General 1", "English A2: General 2", etc.
**After fix:** Shows "Spanish A1: General 1", "Spanish A2: General 2", etc. ✅

### 3. Verify for Different Language Pairs

Test with different users:

- [ ] **en→es**: Should see Spanish word sets
- [ ] **es→en**: Should see English word sets
- [ ] **de→en**: Should see German word sets
- [ ] **en→de**: Should see German word sets

### 4. Clean Up User 62's Data (Optional)

User 62 currently has 100 English words (should be Spanish).

**Option A: Let user manually delete and reimport**
- User can go to Statistics page
- Click "Reset Progress"
- Then reimport correct Spanish word sets

**Option B: Run cleanup script**
```bash
node scripts/fix-user-62-words.js
# Uncomment deletion lines if you want to auto-delete
```

### 5. Test Import Functionality

After cleanup, user 62 should:
1. Go to Word Lists
2. See Spanish word sets (not English)
3. Import "Spanish A1: General 1"
4. Go to Study page
5. Quiz should show SPANISH words with ENGLISH translations

**Example:**
- Word: "hola" (Spanish)
- Options: "hello", "goodbye", "thanks", "please" (English)

### 6. Verify TTS Language

In console, TTS should say:
```
language-manager.js:692 User is studying: Spanish (es)  ✅ CORRECT
```

NOT:
```
language-manager.js:692 User is studying: English (en)  ❌ WRONG
```

## Test Script

Run this to verify API behavior:
```bash
node scripts/test-word-sets-fix.js
```

Expected output:
```
✅ NEW Code (CORRECT): Sending languagePair="es-en"
   Returns: spanish word sets
   Example: "Spanish A1: General 1"
   ✅ CORRECT LANGUAGE!
```

## Rollback Plan (if needed)

If something breaks:

```bash
# Revert the commit
git revert 2c75d9c

# Push revert
git push origin develop
```

This will restore old behavior (showing wrong language sets, but at least it's stable).

## Related Documentation

- [USER_62_ISSUE_REPORT.md](USER_62_ISSUE_REPORT.md) - Full problem analysis
- [FIX_WORD_SETS_LANGUAGE_BUG.md](FIX_WORD_SETS_LANGUAGE_BUG.md) - Technical details
- [DEPLOYMENT_NEEDED.md](DEPLOYMENT_NEEDED.md) - Why deployment was needed

## Timeline

- **Issue reported**: 2026-01-06 ~18:40 (user 62 saw "лучше" in quiz)
- **Root cause found**: 2026-01-06 ~19:30 (wrong language pair code)
- **Fix applied locally**: 2026-01-06 ~19:40
- **Pushed to develop**: 2026-01-06 ~19:45
- **Expected live**: 2026-01-06 ~19:48 (Railway auto-deploy)

## Success Criteria

Fix is successful when:
- ✅ User 62 sees Spanish word sets (not English)
- ✅ Console shows `languagePair=es-en`
- ✅ Quiz shows Spanish words after reimport
- ✅ TTS says "User is studying: Spanish"
- ✅ No errors in console
- ✅ Other users with different language pairs also see correct sets
