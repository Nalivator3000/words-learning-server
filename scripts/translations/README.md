# Translation Scripts Guide

## Overview

This folder contains scripts to build a complete translation matrix for all 16 source languages.

**Goal:** 272 translation pairs (16 sources × 17 targets each, excluding self-pairs)
**Current Status:** 57/272 complete (21.0%)
**Remaining:** 215 pairs (~2.2M translations)

---

## Scripts

### 1. `translate-matrix-parallel.js`
**Main translation worker**

Translates all 215 remaining pairs in batches of 3 parallel workers.

**Features:**
- ✅ Runs 3 pairs simultaneously for speed
- ✅ Saves progress after each batch
- ✅ Resumes from last checkpoint if interrupted
- ✅ Organized by priority phases (1-7)

**Usage:**
```bash
node translate-matrix-parallel.js
```

**Output:**
- Progress saved to: `.translation-progress.json`
- Displays batch progress in real-time
- Shows overall completion percentage

**Estimated Runtime:**
- ~200+ hours total (if run continuously)
- ~7-10 days at 3 pairs/hour average

---

### 2. `auto-translate-cron.js`
**Automatic scheduler**

Runs `translate-matrix-parallel.js` every N hours automatically.

**Usage:**
```bash
# Run every 6 hours (default)
node auto-translate-cron.js

# Run every 12 hours
node auto-translate-cron.js 12

# Run every 24 hours
node auto-translate-cron.js 24
```

**Features:**
- ✅ Runs indefinitely until all pairs complete
- ✅ Handles errors gracefully (30min retry)
- ✅ Graceful shutdown on Ctrl+C
- ✅ Tracks total run count

---

### 3. `start-auto-translate.bat`
**Windows starter (easiest option)**

Interactive launcher for Windows users.

**Usage:**
1. Double-click `start-auto-translate.bat`
2. Choose:
   - **Option 1:** Foreground (see output, blocks terminal)
   - **Option 2:** Background (silent, logs to file)
   - **Option 3:** Cancel

**Background Mode:**
- Logs to: `auto-translate.log`
- Runs silently in background
- To stop: Use Task Manager or `taskkill /F /IM node.exe`

---

### 4. `translate-pair-v2.js`
**Single pair translator**

Translates one source→target pair.

**Usage:**
```bash
node translate-pair-v2.js [source_lang] [target_lang]

# Examples:
node translate-pair-v2.js de ja    # German → Japanese
node translate-pair-v2.js fr hi    # French → Hindi
node translate-pair-v2.js ru pl    # Russian → Polish
```

**Features:**
- ✅ Batch translation (100 words/request)
- ✅ Retry logic for failed translations
- ✅ Progress bar
- ✅ Summary statistics

---

## Translation Phases

The 215 remaining pairs are organized into 7 phases by priority:

| Phase | Focus | Pairs | Priority |
|-------|-------|-------|----------|
| **1** | Complete Big 3 (de, en, es) → ja, ko, hi, tr | 12 | 🔴 HIGHEST |
| **2** | European (fr, it, pt) → All missing | 39 | 🟠 HIGH |
| **3** | Arabic & Chinese → All missing | 28 | 🟡 MEDIUM |
| **4** | Russian → All | 17 | 🟡 MEDIUM |
| **5** | Eastern European (pl, ro, uk) → All | 51 | 🟢 LOW-MED |
| **6** | Asian (ja, ko, hi) → All | 51 | 🔵 LOW |
| **7** | Turkish → All | 17 | 🔵 LOW |

The parallel script processes them in this order automatically.

---

## Recommended Workflow

### For Fast Completion (24/7 Running):
```bash
# Start the cron job to run every 6 hours
node auto-translate-cron.js 6

# Or use the Windows starter
start-auto-translate.bat → Choose Option 2 (Background)
```

This will:
1. Run 3 pairs in parallel
2. Process all batches
3. Wait 6 hours
4. Repeat until all 215 pairs are done

**Estimated timeline:** ~10-15 days

---

### For Manual Control:
```bash
# Run one batch manually (3 pairs)
node translate-matrix-parallel.js

# Check progress
cat .translation-progress.json

# Continue from where you left off
node translate-matrix-parallel.js
```

---

### For Testing a Single Pair:
```bash
# Test one pair first
node translate-pair-v2.js de ja

# If successful, run the full matrix
node translate-matrix-parallel.js
```

---

## Progress Tracking

### Check Overall Progress:
```bash
node ../utils/check-all-translations.js
```

Shows:
- All source languages
- Pairs completed per source
- Total translations in database
- Missing pairs

### Check Progress File:
```bash
cat .translation-progress.json
```

Contains:
```json
{
  "completed": [
    { "source": "de", "target": "ja", "duration": "45.2", "success": true },
    ...
  ],
  "failed": [
    { "source": "fr", "target": "zh", "error": "...", "success": false }
  ]
}
```

---

## Stopping the Process

### If Running in Foreground:
Press `Ctrl+C`

### If Running in Background (Windows):
1. Open Task Manager
2. Find `Node.js` process
3. End task

Or use command:
```bash
taskkill /F /IM node.exe /FI "WINDOWTITLE eq auto-translate-cron"
```

---

## Troubleshooting

### Problem: Script stops midway
**Solution:** Just run it again! Progress is saved after each batch.
```bash
node translate-matrix-parallel.js
```

### Problem: Some pairs fail
**Check:** `.translation-progress.json` for failed pairs
**Fix:** Re-run those pairs manually:
```bash
node translate-pair-v2.js [source] [target]
```

### Problem: Database connection errors
**Check:** Railway database is running
**Fix:** Wait a few minutes, try again

### Problem: API rate limits
**Fix:** Increase delay in `translate-pair-v2.js`:
```javascript
// Change this line (around line 50)
await new Promise(resolve => setTimeout(resolve, 200)); // Increase to 500
```

---

## API Usage

Uses **free Google Translate API** endpoint:
- No API key needed
- Rate limit: ~100 requests/second
- Batch size: 100 words/request
- Cost: $0

**Total API calls for 215 pairs:**
- ~2,150 requests (assuming 10 batches per pair)
- At 200ms delay: ~7 minutes per pair
- Total API time: ~25 hours

---

## Files Created

During execution, these files are created:

- `.translation-progress.json` - Progress tracker
- `auto-translate.log` - Log file (background mode only)

**Safe to delete** if you want to start fresh.

---

## Next Steps

1. **Run Phase 1 first** (highest priority, only 9 pairs):
   ```bash
   node translate-matrix-parallel.js
   ```

2. **Let it run** for a few hours (will complete ~9-12 pairs)

3. **Check results**:
   ```bash
   node ../utils/check-all-translations.js | grep "GERMAN\|ENGLISH\|SPANISH"
   ```

4. **If successful**, start the cron job for continuous operation:
   ```bash
   node auto-translate-cron.js 6
   ```

---

## Support

For issues or questions:
1. Check `.translation-progress.json` for failed pairs
2. Check `auto-translate.log` for error messages
3. Run `node ../utils/check-all-translations.js` to verify database state
4. Re-run failed pairs manually with `translate-pair-v2.js`

---

**Created:** 2025-12-25
**Status:** Ready to run 🚀
