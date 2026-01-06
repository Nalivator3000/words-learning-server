# Hindi Vocabulary Rebuild - Complete Guide

## Overview

This project contains scripts to rebuild the complete Hindi vocabulary database with real words, replacing synthetic/test data.

## Problem Statement

Currently, the `source_words_hindi` table contains:
- **99.7% synthetic data** (test words like "हाँ_123_A1")
- **Only 33 real words** out of ~10,000

## Solution

We provide three different approaches to rebuild the vocabulary:

### Option 1: Quick Rebuild (Recommended)

**File:** `hindi-vocabulary-complete.js`

**Features:**
- No API required
- Contains built-in comprehensive Hindi vocabulary
- Fast execution (1-2 minutes)
- ~700+ real Hindi words across all CEFR levels
- Organized by themes

**Usage:**
```cmd
node hindi-vocabulary-complete.js
```

**What it does:**
1. Deletes all synthetic data (words with "_")
2. Inserts curated Hindi vocabulary for all levels (A1-C2)
3. Assigns themes automatically based on keywords
4. Creates thematic word sets for learning

### Option 2: LLM-Powered Rebuild (10,000 words)

**File:** `rebuild-hindi-vocabulary-complete.js`

**Features:**
- Generates ~10,000 unique words using Anthropic Claude API
- Falls back to built-in vocabulary if API unavailable
- More comprehensive vocabulary
- Longer execution time (15-30 minutes with API)

**Requirements:**
- Anthropic API key (optional, will use fallback if not available)

**Usage:**

With API:
```cmd
set ANTHROPIC_API_KEY=your-key-here
node rebuild-hindi-vocabulary-complete.js
```

Without API (fallback):
```cmd
node rebuild-hindi-vocabulary-complete.js
```

**What it does:**
1. Deletes synthetic data
2. Generates 10,000 real Hindi words via LLM (or uses fallback)
3. Distributes words across CEFR levels:
   - A1: 1,000 words
   - A2: 1,000 words
   - B1: 1,500 words
   - B2: 2,000 words
   - C1: 2,500 words
   - C2: 2,000 words
4. Assigns themes to all words
5. Creates thematic word sets

### Option 3: Windows Batch Script

**File:** `rebuild-hindi.bat`

**Features:**
- Interactive Windows batch script
- Shows before/after statistics
- Asks for confirmation before rebuild
- Easy to use for non-technical users

**Usage:**
```cmd
rebuild-hindi.bat
```

## Checking Current Status

Before rebuilding, check the current state:

```cmd
node check-hindi-status.js
```

This shows:
- Total word count
- Percentage of synthetic vs real words
- Distribution by CEFR level
- Distribution by theme
- Word sets count
- Sample words

## Target Distribution

Our goal is 10,000 words distributed as follows:

| Level | Target | Description |
|-------|--------|-------------|
| A1 | 1,000 | Beginner |
| A2 | 1,000 | Elementary |
| B1 | 1,500 | Intermediate |
| B2 | 2,000 | Upper Intermediate |
| C1 | 2,500 | Advanced |
| C2 | 2,000 | Proficiency |

## Themes

Words are assigned to 18 themes:

1. **communication** - Speaking, listening, writing
2. **food** - Meals, ingredients, cooking
3. **home** - House, furniture, rooms
4. **time** - Days, hours, dates
5. **work** - Jobs, office, career
6. **emotions** - Feelings, moods
7. **travel** - Transportation, tourism
8. **numbers** - Counting, quantities
9. **weather** - Climate, seasons
10. **colors** - Color names
11. **health** - Medical, body parts
12. **clothing** - Clothes, accessories
13. **family** - Relatives, relationships
14. **culture** - Art, music, traditions
15. **nature** - Animals, plants, geography
16. **sports** - Games, exercise
17. **education** - School, learning
18. **technology** - Computers, internet

Words that don't fit specific themes are marked as "general".

## File Structure

```
c:\Users\Nalivator3000\words-learning-server\
│
├── hindi-vocabulary-complete.js          # Quick rebuild (recommended)
├── rebuild-hindi-vocabulary-complete.js  # Full LLM rebuild
├── check-hindi-status.js                 # Status checker
├── rebuild-hindi.bat                     # Windows batch script
├── HINDI_REBUILD_INSTRUCTIONS.md         # Detailed instructions
└── README_HINDI_VOCABULARY.md            # This file
```

## Expected Results

After successful rebuild:

### Word Count
```
Total: 700-10,000 words (depending on method)
All real Hindi words in Devanagari script
```

### Distribution Example (Quick Rebuild)
```
A1: ~150 words
A2: ~130 words
B1: ~150 words
B2: ~120 words
C1: ~80 words
C2: ~70 words
```

### Word Sets
```
~40-145 thematic word sets created
Organized by level and theme
Ready for learning
```

### Theme Distribution Example
```
general: ~200 words
family: ~20 words
food: ~25 words
health: ~30 words
education: ~25 words
(and others...)
```

## Verification Queries

After rebuild, verify in database:

```sql
-- Total words
SELECT COUNT(*) FROM source_words_hindi;

-- No synthetic data
SELECT COUNT(*) FROM source_words_hindi WHERE word LIKE '%_%';
-- Should return 0

-- By level
SELECT level, COUNT(*)
FROM source_words_hindi
GROUP BY level
ORDER BY level;

-- By theme
SELECT theme, COUNT(*)
FROM source_words_hindi
GROUP BY theme
ORDER BY COUNT(*) DESC;

-- Word sets
SELECT COUNT(*)
FROM word_sets
WHERE source_language = 'hindi';

-- Sample words
SELECT word, level, theme
FROM source_words_hindi
LIMIT 20;
```

## Troubleshooting

### Issue: "Cannot find module 'pg'"
**Solution:**
```cmd
npm install pg
```

### Issue: Connection timeout
**Solution:**
- Check internet connection
- Verify Railway database is online
- Check connection string is correct

### Issue: Script hangs during LLM generation
**Solution:**
- Use the quick rebuild method instead: `hindi-vocabulary-complete.js`
- Or run without API key (will use fallback)

### Issue: Not enough words generated
**Solution:**
- The quick rebuild gives ~700 words minimum
- For 10,000 words, you need API key or multiple script runs
- You can run the rebuild multiple times (it skips duplicates)

## Performance

| Method | Time | Words | API Required |
|--------|------|-------|--------------|
| Quick Rebuild | 1-2 min | ~700 | No |
| LLM Rebuild (fallback) | 2-3 min | ~1,000 | No |
| LLM Rebuild (with API) | 15-30 min | ~10,000 | Yes |

## Recommendations

1. **For quick testing:** Use `hindi-vocabulary-complete.js`
2. **For production:** Use `rebuild-hindi-vocabulary-complete.js` with API
3. **For non-technical users:** Use `rebuild-hindi.bat`

## Next Steps After Rebuild

1. ✅ Verify vocabulary in database
2. ✅ Test word sets in application UI
3. ✅ Create quizzes with Hindi words
4. ✅ Test learning functionality
5. ✅ Verify translations work correctly
6. (Optional) Add more specialized vocabulary
7. (Optional) Refine theme assignments

## Support

For issues or questions:
1. Check the console output for specific errors
2. Run `check-hindi-status.js` to diagnose
3. Review error messages carefully
4. Verify Node.js and database connectivity

## Database Schema

The scripts work with these tables:

### source_words_hindi
```sql
- id (serial)
- word (text) - Hindi word in Devanagari
- level (text) - CEFR level (A1-C2)
- theme (text) - Theme category
- created_at (timestamp)
```

### word_sets
```sql
- id (serial)
- source_language (text) - 'hindi'
- title (text)
- description (text)
- level (text)
- theme (text)
- word_count (integer)
- is_public (boolean)
```

## Example Output

```
════════════════════════════════════════════════════════════════════════════════
HINDI VOCABULARY COMPLETE REBUILD
════════════════════════════════════════════════════════════════════════════════

STEP 1: Deleting synthetic data...

✅ Deleted 9967 synthetic words

STEP 2: Inserting real Hindi vocabulary...

📚 Level A1:
   Added 152 words
📚 Level A2:
   Added 128 words
📚 Level B1:
   Added 147 words
📚 Level B2:
   Added 119 words
📚 Level C1:
   Added 84 words
📚 Level C2:
   Added 72 words

✅ Total inserted: 702 words

STEP 3: Assigning themes...

   ✅ family: 21 words
   ✅ food: 24 words
   ✅ travel: 18 words
   ✅ home: 15 words
   ✅ health: 32 words
   ✅ work: 11 words
   ✅ education: 27 words
   ✅ nature: 29 words
   ✅ weather: 14 words
   ✅ communication: 19 words
   ✅ culture: 23 words
   ✅ emotions: 16 words
   ✅ sports: 12 words
   ✅ technology: 13 words
   ✅ time: 22 words
   ✅ numbers: 26 words
   ✅ colors: 12 words
   ✅ clothing: 18 words
   📦 general: 390 words

✅ Total themed: 702 words

STEP 4: Creating word sets...

✅ Created 42 word sets

════════════════════════════════════════════════════════════════════════════════
FINAL STATISTICS
════════════════════════════════════════════════════════════════════════════════

📊 Total words: 702

📈 By level:
   A1: 152 words
   A2: 128 words
   B1: 147 words
   B2: 119 words
   C1: 84 words
   C2: 72 words

🎨 By theme:
   general: 390 words
   health: 32 words
   nature: 29 words
   education: 27 words
   numbers: 26 words
   food: 24 words
   culture: 23 words
   time: 22 words
   family: 21 words
   communication: 19 words

════════════════════════════════════════════════════════════════════════════════
✅ REBUILD COMPLETE!
════════════════════════════════════════════════════════════════════════════════
```

## License

Part of the Words Learning Server project.
