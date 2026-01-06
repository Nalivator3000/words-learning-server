# Hindi Vocabulary Rebuild - Execution Instructions

## Overview
This guide will help you rebuild the complete Hindi vocabulary with ~10,000 real words.

## What the Script Does

The script `rebuild-hindi-vocabulary-complete.js` performs these steps:

1. **Delete Synthetic Data** - Removes all test/synthetic words (containing "_")
2. **Generate Real Vocabulary** - Creates ~10,000 real Hindi words using LLM API or fallback data
3. **Assign Themes** - Assigns themes (family, food, travel, etc.) to all words
4. **Create Word Sets** - Creates thematic word sets for learning
5. **Display Statistics** - Shows final counts and distribution

## Distribution Plan

Target: 10,000 words across CEFR levels:
- **A1**: 1,000 words (Beginner)
- **A2**: 1,000 words (Elementary)
- **B1**: 1,500 words (Intermediate)
- **B2**: 2,000 words (Upper Intermediate)
- **C1**: 2,500 words (Advanced)
- **C2**: 2,000 words (Proficiency)

## How to Run

### Method 1: With Anthropic API (Recommended)

If you have an Anthropic API key, set it as environment variable:

**Windows (Command Prompt):**
```cmd
set ANTHROPIC_API_KEY=your-api-key-here
node rebuild-hindi-vocabulary-complete.js
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
node rebuild-hindi-vocabulary-complete.js
```

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY=your-api-key-here
node rebuild-hindi-vocabulary-complete.js
```

### Method 2: Without API (Fallback)

Simply run the script. It will use built-in fallback vocabulary:

```cmd
node rebuild-hindi-vocabulary-complete.js
```

The fallback method includes curated Hindi words for each level and will still create a complete vocabulary, though it won't generate as many unique words via LLM.

## Expected Output

You should see progress through these stages:

```
════════════════════════════════════════════════════════════════════════════════
STEP 1: DELETING SYNTHETIC DATA
════════════════════════════════════════════════════════════════════════════════

📊 Words before deletion: 10000
🗑️  Synthetic words to delete: 9967
✅ Deleted: 9967 synthetic words
📊 Remaining real words: 33

════════════════════════════════════════════════════════════════════════════════
STEP 2: GENERATING REAL HINDI VOCABULARY
════════════════════════════════════════════════════════════════════════════════

📝 Target vocabulary: 10000 words
✨ Already have: 33 words
🔄 Need to generate: 9967 words

📊 Words needed per level:
   A1: 1000 words
   A2: 1000 words
   B1: 1500 words
   B2: 2000 words
   C1: 2500 words
   C2: 2000 words

📚 Generating words for level A1...
   Batch 1/10 (100 words)...
   ✅ Added 100 words for A1
   ...

════════════════════════════════════════════════════════════════════════════════
STEP 3: ASSIGNING THEMES TO WORDS
════════════════════════════════════════════════════════════════════════════════

📝 Using keyword matching for theme assignment...

   ✅ family: 245 words
   ✅ food: 312 words
   ✅ travel: 189 words
   ...

════════════════════════════════════════════════════════════════════════════════
STEP 4: CREATING THEMATIC WORD SETS
════════════════════════════════════════════════════════════════════════════════

🗑️  Deleted old word sets

📚 Creating sets for level A1:
📚 Creating sets for level A2:
...

✅ Created 145 word sets!

════════════════════════════════════════════════════════════════════════════════
FINAL STATISTICS
════════════════════════════════════════════════════════════════════════════════

📊 Total words: 10000

📈 Words by level:
   A1: 1000 words
   A2: 1000 words
   B1: 1500 words
   B2: 2000 words
   C1: 2500 words
   C2: 2000 words

🎨 Words by theme:
   general: 5423 words
   family: 245 words
   food: 312 words
   travel: 189 words
   ...

📚 Word sets created:
   Total: 145 sets

════════════════════════════════════════════════════════════════════════════════
✅ HINDI VOCABULARY REBUILD COMPLETE!
════════════════════════════════════════════════════════════════════════════════
```

## Execution Time

- **With API**: 15-30 minutes (due to API rate limiting)
- **Without API**: 1-2 minutes (using fallback data)

## Themes Assigned

The script assigns these 18 themes:
1. communication
2. food
3. home
4. time
5. work
6. emotions
7. travel
8. numbers
9. weather
10. colors
11. health
12. clothing
13. family
14. culture
15. nature
16. sports
17. education
18. technology

Words that don't match specific themes are assigned to "general".

## Verification

After running, you can verify the results:

```sql
-- Check total words
SELECT COUNT(*) FROM source_words_hindi;

-- Check distribution by level
SELECT level, COUNT(*)
FROM source_words_hindi
GROUP BY level
ORDER BY level;

-- Check distribution by theme
SELECT theme, COUNT(*)
FROM source_words_hindi
GROUP BY theme
ORDER BY COUNT(*) DESC;

-- Check word sets
SELECT COUNT(*)
FROM word_sets
WHERE source_language = 'hindi';
```

## Troubleshooting

### Issue: "Cannot find module 'pg'"
**Solution:** Run `npm install pg` first

### Issue: "Connection timeout"
**Solution:** Check your internet connection and Railway database status

### Issue: "Too few words generated"
**Solution:** The script will use fallback data to fill gaps. You can re-run with API key later to improve variety.

## Next Steps

After successful execution:

1. Test the vocabulary in the application
2. Verify word sets are visible in the UI
3. Check that quizzes work correctly with Hindi words
4. Optionally refine themes by running additional theme assignment scripts

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify database connection string is correct
3. Ensure Node.js and npm are properly installed
4. Review the script logs for details on where it failed
