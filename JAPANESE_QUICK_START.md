# Japanese Vocabulary Quick Start

## One-Line Setup

```bash
# 1. Set your API key
$env:ANTHROPIC_API_KEY="your-api-key-here"

# 2. Run complete setup
node setup-japanese-complete.js
```

That's it! The script will automatically:
1. Clean up synthetic data
2. Generate 10,000 real Japanese words
3. Assign themes to all words
4. Create thematic word sets

**Time**: 45-90 minutes

---

## Even Easier (Windows)

```cmd
# 1. Set API key
set ANTHROPIC_API_KEY=your-api-key-here

# 2. Double-click this file:
run-japanese-setup.bat
```

---

## Check Status Anytime

```bash
node check-japanese-status.js
```

This shows:
- Total words (target: 10,000)
- Words by level
- Words by theme
- Word sets created
- What to do next

---

## What Gets Created

### Words by Level
- A1: 1,000 words (basic)
- A2: 1,000 words (elementary)
- B1: 1,500 words (intermediate)
- B2: 2,000 words (upper intermediate)
- C1: 2,500 words (advanced)
- C2: 2,000 words (proficiency)

### Themes
Each word gets one theme:
- communication, food, home, time, work, emotions
- travel, numbers, weather, colors, health, clothing
- family, culture, nature, sports, education, technology
- general (catchall)

### Word Sets
~100-150 thematic sets for users to learn from

---

## If Something Goes Wrong

Run individual scripts:

```bash
# 1. Cleanup
node cleanup-japanese-synthetic.js

# 2. Generate words
node generate-japanese-vocabulary.js

# 3. Assign themes
node assign-japanese-themes-llm.js

# 4. Create sets
node create-japanese-word-sets.js
```

---

## Files Created

- `cleanup-japanese-synthetic.js` - Remove test data
- `generate-japanese-vocabulary.js` - Generate real words
- `assign-japanese-themes-llm.js` - Assign themes
- `create-japanese-word-sets.js` - Create word sets
- `setup-japanese-complete.js` - Run everything
- `check-japanese-status.js` - Check progress
- `run-japanese-setup.bat` - Windows launcher
- `JAPANESE_SETUP_GUIDE.md` - Full documentation
- `JAPANESE_QUICK_START.md` - This file

---

## Cost

~$3-5 USD in API calls (300-400 requests to Claude)

---

## Get API Key

1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Generate API key
4. Set in environment variable

---

## Support

See `JAPANESE_SETUP_GUIDE.md` for detailed troubleshooting and information.
