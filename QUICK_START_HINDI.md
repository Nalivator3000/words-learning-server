# Quick Start: Hindi Vocabulary Rebuild

## TL;DR

To rebuild Hindi vocabulary with real words:

```cmd
node hindi-vocabulary-complete.js
```

That's it! Takes 1-2 minutes.

## What This Does

- Deletes all synthetic test data (words like "हाँ_123_A1")
- Adds ~700 real Hindi words organized by CEFR levels (A1-C2)
- Assigns themes automatically (family, food, travel, etc.)
- Creates word sets for learning

## Before You Start

Check current status:
```cmd
node check-hindi-status.js
```

## Three Options

### 1. Quick Rebuild (Recommended)
```cmd
node hindi-vocabulary-complete.js
```
- **Time:** 1-2 minutes
- **Words:** ~700 real words
- **API:** Not required

### 2. Full Rebuild with LLM
```cmd
node rebuild-hindi-vocabulary-complete.js
```
- **Time:** 15-30 minutes
- **Words:** ~10,000 words (with API) or ~1,000 (fallback)
- **API:** Optional (uses Anthropic Claude)

### 3. Windows Batch Script
```cmd
rebuild-hindi.bat
```
- Interactive, shows before/after stats
- Asks for confirmation
- Uses quick rebuild method

## Results

After rebuild:

✅ All synthetic data removed
✅ 700-10,000 real Hindi words added
✅ Words distributed across A1-C2 levels
✅ Themes assigned (18 categories)
✅ Word sets created (40-145 sets)

## Verify

```cmd
node check-hindi-status.js
```

Should show:
- 0% synthetic data
- 100% real words
- Words across all levels
- Multiple themes assigned

## Troubleshooting

**Error: Cannot find module 'pg'**
```cmd
npm install pg
```

**Connection timeout**
- Check internet connection
- Verify Railway database is online

**Not enough words**
- Use `rebuild-hindi-vocabulary-complete.js` for more words
- Or run the script multiple times (duplicates are skipped)

## Files Created

1. `hindi-vocabulary-complete.js` - Quick rebuild script
2. `rebuild-hindi-vocabulary-complete.js` - Full LLM rebuild
3. `check-hindi-status.js` - Status checker
4. `rebuild-hindi.bat` - Windows batch script
5. `HINDI_REBUILD_INSTRUCTIONS.md` - Detailed guide
6. `README_HINDI_VOCABULARY.md` - Complete documentation

## Next Steps

1. Run the rebuild script
2. Check status to verify
3. Test in your application
4. Enjoy learning Hindi with real words!

---

**Questions?** See `README_HINDI_VOCABULARY.md` for full documentation.
