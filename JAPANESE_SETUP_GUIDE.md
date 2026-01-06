# Japanese Vocabulary Complete Setup Guide

## Overview

This guide will help you set up a complete Japanese vocabulary database with ~10,000 real words, themes, and thematic word sets.

## Current State

- **source_words_japanese**: 99.6% synthetic data (test words like "はい_123_A1")
- **Real words**: Only 36 out of ~10,000
- **Goal**: Replace with 10,000 real Japanese words with themes and sets

## What Will Be Created

### 1. Vocabulary Distribution
- **A1** (Beginner): 1,000 words
- **A2** (Elementary): 1,000 words
- **B1** (Intermediate): 1,500 words
- **B2** (Upper Intermediate): 2,000 words
- **C1** (Advanced): 2,500 words
- **C2** (Proficiency): 2,000 words
- **Total**: 10,000 words

### 2. Themes
Each word will be assigned one of these themes:
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
- general (for words that don't fit other themes)

### 3. Word Sets
Thematic word sets will be created for each level and theme combination, making it easy for users to learn vocabulary by topic.

## Prerequisites

1. **Node.js** installed
2. **Anthropic API Key** - Get from https://console.anthropic.com/
3. **Database access** - Connection string already configured in scripts

## Setup Instructions

### Step 1: Set Environment Variable

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

**Windows CMD:**
```cmd
set ANTHROPIC_API_KEY=your-api-key-here
```

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Step 2: Install Dependencies (if needed)

```bash
npm install @anthropic-ai/sdk
```

### Step 3: Run Complete Setup

The easiest way is to run the master script that does everything:

```bash
node setup-japanese-complete.js
```

This will:
1. Clean up synthetic data
2. Generate 10,000 real Japanese words
3. Assign themes to all words
4. Create thematic word sets

**Estimated time**: 45-90 minutes (depending on API rate limits)

## Alternative: Run Steps Individually

If you prefer to run steps separately or if something fails:

### 1. Cleanup Synthetic Data
```bash
node cleanup-japanese-synthetic.js
```

This removes all synthetic test data (words containing "_").

### 2. Generate Real Vocabulary
```bash
node generate-japanese-vocabulary.js
```

Generates ~10,000 real Japanese words using Claude AI.
- Uses JLPT level-appropriate vocabulary
- Includes kanji, hiragana, and katakana
- Provides accurate English translations

**Estimated time**: 30-60 minutes

### 3. Assign Themes
```bash
node assign-japanese-themes-llm.js
```

Assigns themes to all Japanese words using Claude AI.
- Processes words in batches of 50
- Uses AI to determine the most appropriate theme

**Estimated time**: 20-30 minutes

### 4. Create Word Sets
```bash
node create-japanese-word-sets.js
```

Creates thematic word sets in the database.
- Groups words by level and theme
- Creates multiple sets for "general" theme
- Minimum 10 words per themed set

**Estimated time**: < 1 minute

## Verification

After setup is complete, you can verify the results:

```javascript
// Check word count
SELECT COUNT(*) FROM source_words_japanese;
// Should be ~10,000

// Check theme distribution
SELECT theme, COUNT(*)
FROM source_words_japanese
GROUP BY theme
ORDER BY COUNT(*) DESC;

// Check word sets
SELECT COUNT(*)
FROM word_sets
WHERE source_language = 'japanese';

// View sample words
SELECT word, translation, level, theme
FROM source_words_japanese
LIMIT 20;
```

## Troubleshooting

### API Key Issues
- Error: "ANTHROPIC_API_KEY environment variable is not set"
- Solution: Set the environment variable in your current terminal session

### Rate Limiting
- If you hit rate limits, the scripts will automatically delay between requests
- You can adjust `DELAY_MS` in the scripts if needed

### Partial Completion
- If a script fails partway through, you can safely re-run it
- The scripts use `ON CONFLICT DO NOTHING` to avoid duplicates
- You can continue from any step

### Low Word Count
- If fewer than expected words are generated, check API responses
- Increase `BATCH_SIZE` or run generation script multiple times
- Words are inserted with `ON CONFLICT DO NOTHING` to avoid duplicates

## Script Descriptions

### cleanup-japanese-synthetic.js
- Removes synthetic test data
- Shows before/after statistics
- Preserves any existing real words

### generate-japanese-vocabulary.js
- Uses Claude AI to generate authentic Japanese words
- Generates in batches to avoid rate limits
- Ensures level-appropriate vocabulary
- Prevents duplicates

### assign-japanese-themes-llm.js
- Uses Claude AI to categorize words by theme
- Processes in batches of 50 words
- Validates themes against allowed list
- Falls back to "general" for unmatched themes

### create-japanese-word-sets.js
- Creates word_sets entries for learning
- Groups by level and theme
- Splits large "general" theme into manageable chunks
- Sets minimum threshold for themed sets

### setup-japanese-complete.js
- Master orchestration script
- Runs all steps in sequence
- Shows progress and statistics
- Handles errors gracefully

## Database Schema

### source_words_japanese
```sql
CREATE TABLE source_words_japanese (
  id SERIAL PRIMARY KEY,
  word TEXT UNIQUE NOT NULL,
  translation TEXT NOT NULL,
  level TEXT NOT NULL,  -- A1, A2, B1, B2, C1, C2
  theme TEXT,           -- Assigned by AI
  created_at TIMESTAMP DEFAULT NOW()
);
```

### word_sets
```sql
CREATE TABLE word_sets (
  id SERIAL PRIMARY KEY,
  source_language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  theme TEXT,
  word_count INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Expected Results

After successful completion:

- **~10,000 real Japanese words** in source_words_japanese
- **100% of words have themes** assigned
- **~100-150 word sets** created across all levels and themes
- **No synthetic data** remaining

## Cost Estimate

- **API calls**: ~300-400 requests to Claude API
- **Estimated cost**: $3-5 USD (depending on exact token usage)
- Uses Claude 3.5 Sonnet model for quality results

## Next Steps

After setup is complete:

1. Test the vocabulary in your application
2. Verify word sets are accessible to users
3. Check that themes are displayed correctly
4. Review sample words for quality

## Support

If you encounter issues:
1. Check the error messages in console output
2. Verify API key is set correctly
3. Check database connectivity
4. Ensure all dependencies are installed
5. Review this guide for troubleshooting steps

## Files Created

- `cleanup-japanese-synthetic.js` - Cleanup script
- `generate-japanese-vocabulary.js` - Vocabulary generation
- `assign-japanese-themes-llm.js` - Theme assignment
- `create-japanese-word-sets.js` - Word set creation
- `setup-japanese-complete.js` - Master orchestration script
- `JAPANESE_SETUP_GUIDE.md` - This guide

All scripts are ready to run and will produce detailed console output showing progress.
