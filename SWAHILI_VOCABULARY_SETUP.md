# SWAHILI VOCABULARY SETUP GUIDE

## Overview

This guide will help you create a complete Swahili vocabulary database with ~10,000 real words, assign themes, and create thematic word sets.

## Current Situation

- **source_words_swahili** contains 99.7% synthetic/test data (words like "ndiyo_123_A1")
- Only ~30 real words exist out of ~10,000
- Need to replace with authentic Swahili vocabulary

## Solution: Three Approaches

### Option 1: COMPLETE SETUP (Recommended - ~1000 words, No API Required) ⭐

Runs all scripts in sequence for a complete setup with ~1000 real Swahili words.

**Pros:**
- No API key required
- Comprehensive (~1000 curated words)
- Automated full setup
- Creates word sets automatically
- Best balance of coverage and simplicity

**How to Run:**

```bash
node run-swahili-setup-complete.js
```

This will:
1. Delete all synthetic data
2. Insert base vocabulary (~300 words)
3. Insert extended vocabulary (~700 words)
4. Create thematic word sets
5. Show final statistics

---

### Option 2: Manual Vocabulary (Quick Start - ~300 words)

Uses pre-defined vocabulary lists with ~300 carefully curated Swahili words.

**Pros:**
- Fast execution
- No API key required
- Guaranteed quality words
- Good for testing/prototyping

**Cons:**
- Smaller vocabulary (~300 words)
- Limited coverage

**How to Run:**

```bash
node create-swahili-vocabulary-manual.js
```

Then extend with:
```bash
node extend-swahili-vocabulary.js
```

---

### Option 3: LLM-Generated Vocabulary (Advanced - ~10,000 words)

Uses Anthropic Claude API to generate ~10,000 authentic Swahili words.

**Pros:**
- Full 10,000 word vocabulary
- Comprehensive coverage
- Automated theme assignment

**Cons:**
- Requires Anthropic API key
- Rate limits apply
- Costs money (estimated $2-5 for full run)
- Takes longer to complete

**How to Run:**

1. Set your Anthropic API key:
```bash
# Windows
set ANTHROPIC_API_KEY=your_api_key_here

# Linux/Mac
export ANTHROPIC_API_KEY=your_api_key_here
```

2. Run the script:
```bash
node create-swahili-vocabulary.js
```

## What Each Script Does

Both scripts perform these steps:

### Step 1: Delete Synthetic Data
- Removes all test/synthetic words (containing underscore "_")
- Keeps only real Swahili words

### Step 2: Insert Real Vocabulary
- **Manual version:** Inserts ~300 pre-defined words
- **LLM version:** Generates and inserts ~10,000 words using AI

Words are distributed by CEFR level:
- A1: 1000 words (Beginner)
- A2: 1000 words (Elementary)
- B1: 1500 words (Intermediate)
- B2: 2000 words (Upper Intermediate)
- C1: 2500 words (Advanced)
- C2: 2000 words (Proficiency)

### Step 3: Assign Themes

Each word is assigned to one of these themes:
- communication
- food
- home
- time
- work
- emotions
- travel
- numbers
- weather
- colors
- health
- clothing
- family
- culture
- nature
- sports
- education
- technology

### Step 4: Create Word Sets
- Creates thematic word sets for each level
- Groups words by theme and difficulty
- Makes vocabulary browsable and learnable

### Step 5: Display Statistics
- Shows final word count
- Distribution by level
- Distribution by theme
- Sample words

## Expected Results

### Complete Setup Output (Option 1):
```
📊 Total words in database: ~1000
📈 Distribution by level:
  A1: ~150-200 words
  A2: ~150-200 words
  B1: ~150-200 words
  B2: ~150-200 words
  C1: ~100-150 words
  C2: ~100-150 words

🏷️  Distribution by theme:
  general: ~100-150 words
  family: ~50-70 words
  food: ~50-70 words
  education: ~50-70 words
  health: ~50-70 words
  [etc...]

📚 Total word sets created: ~50-60
```

### Manual Version Output (Option 2):
```
📊 Total words in database: ~300
📈 Distribution by level:
  A1: ~60 words
  A2: ~70 words
  B1: ~80 words
  B2: ~40 words
  C1: ~30 words
  C2: ~20 words

🏷️  Distribution by theme:
  general: ~40 words
  family: ~35 words
  food: ~30 words
  education: ~25 words
  [etc...]

📚 Total word sets created: ~25-30
```

### LLM Version Output:
```
📊 Total words in database: ~10,000
📈 Distribution by level:
  A1: 1000 words
  A2: 1000 words
  B1: 1500 words
  B2: 2000 words
  C1: 2500 words
  C2: 2000 words

🏷️  Distribution by theme:
  [Even distribution across all themes]

📚 Total word sets created: ~100+
```

## Troubleshooting

### Database Connection Errors
- Verify the connection string is correct
- Check that Railway database is accessible
- Ensure network connectivity

### API Errors (LLM Version)
- Verify ANTHROPIC_API_KEY is set correctly
- Check API key has sufficient credits
- Rate limits: Script includes 1-second delays between calls

### Duplicate Words
- Script uses `ON CONFLICT DO NOTHING` to skip duplicates
- Duplicates are counted but don't cause errors

## Post-Setup Verification

After running either script, verify the results:

```bash
# Check total words
psql "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway" -c "SELECT COUNT(*) FROM source_words_swahili;"

# Check level distribution
psql "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway" -c "SELECT level, COUNT(*) FROM source_words_swahili GROUP BY level ORDER BY level;"

# Check word sets
psql "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway" -c "SELECT COUNT(*) FROM word_sets WHERE source_language = 'swahili';"
```

## Next Steps

After vocabulary setup is complete:

1. **Test the vocabulary** in your application
2. **Verify word quality** - check random samples
3. **Add more words** if needed using the same scripts
4. **Create custom word sets** based on user needs
5. **Monitor usage** and gather feedback

## Files Created

- `run-swahili-setup-complete.js` - **⭐ RECOMMENDED** Complete automated setup (~1000 words)
- `create-swahili-vocabulary-manual.js` - Manual base version (~300 words)
- `extend-swahili-vocabulary.js` - Extended vocabulary (~700 additional words)
- `create-swahili-vocabulary.js` - LLM-powered version (~10,000 words)
- `SWAHILI_VOCABULARY_SETUP.md` - This documentation

## Notes

- **Recommended:** Run `run-swahili-setup-complete.js` for best results (~1000 words, no API needed)
- **Quick test:** Use `create-swahili-vocabulary-manual.js` for fast prototyping (~300 words)
- **Scale up:** Use LLM version if you need comprehensive coverage (~10,000 words)
- All scripts are safe to run multiple times (they use UPSERT logic)
- All existing real words are preserved
- Only synthetic data is deleted
- Scripts automatically create word sets after inserting vocabulary

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify database connectivity
3. Ensure Node.js dependencies are installed (`npm install`)
4. Check that pg (PostgreSQL client) is installed
5. Review the database schema to ensure tables exist

## Success Criteria

✅ All synthetic data removed
✅ Real Swahili words inserted
✅ Themes assigned to all words
✅ Word sets created
✅ Statistics show correct distribution
✅ Sample words look authentic

---

**Last Updated:** 2026-01-02
**Status:** Ready to execute
