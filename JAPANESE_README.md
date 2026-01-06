# Japanese Vocabulary Setup - README

## Quick Start

```bash
# 1. Set API key (get from https://console.anthropic.com/)
$env:ANTHROPIC_API_KEY="your-api-key-here"

# 2. Run complete setup
node setup-japanese-complete.js

# 3. Check results
node check-japanese-status.js
```

**Time**: 45-90 minutes | **Cost**: ~$3-5 USD

---

## What This Does

Replaces 99.6% synthetic test data in `source_words_japanese` with 10,000 real Japanese words:

**BEFORE:**
```
はい_123_A1
いいえ_456_A1
こんにちは_789_A1
```

**AFTER:**
```
こんにちは (hello) - A1 - communication
ありがとう (thank you) - A1 - communication
りんご (apple) - A1 - food
```

---

## Created Files

### Run These

| File | Purpose | Time |
|------|---------|------|
| `setup-japanese-complete.js` | Complete setup (all steps) | 45-90 min |
| `check-japanese-status.js` | Check progress | 5 sec |
| `run-japanese-setup.bat` | Windows launcher | 45-90 min |

### Individual Steps

| File | Purpose | Time |
|------|---------|------|
| `cleanup-japanese-synthetic.js` | Remove test data | 1 min |
| `generate-japanese-vocabulary.js` | Generate 10k words | 30-60 min |
| `assign-japanese-themes-llm.js` | Assign themes | 20-30 min |
| `create-japanese-word-sets.js` | Create word sets | 1 min |

### Documentation

| File | Purpose |
|------|---------|
| `JAPANESE_QUICK_START.md` | Quick reference |
| `JAPANESE_SETUP_GUIDE.md` | Complete guide |
| `JAPANESE_VOCABULARY_COMPLETE.md` | Full documentation |
| `JAPANESE_README.md` | This file |

---

## Vocabulary Breakdown

| Level | Words | Description |
|-------|-------|-------------|
| A1 | 1,000 | Basic (hello, thank you, numbers) |
| A2 | 1,000 | Elementary (family, food, daily) |
| B1 | 1,500 | Intermediate (work, travel, hobbies) |
| B2 | 2,000 | Upper Intermediate (abstract, complex) |
| C1 | 2,500 | Advanced (specialized, nuanced) |
| C2 | 2,000 | Proficiency (sophisticated, rare) |
| **Total** | **10,000** | **Complete vocabulary** |

---

## Themes (18 + general)

- communication, food, home, time, work, emotions
- travel, numbers, weather, colors, health, clothing
- family, culture, nature, sports, education, technology
- general (catchall)

---

## Results

After setup completes:

✅ 10,000 real Japanese words
✅ 100% words have themes
✅ ~100-150 thematic word sets
✅ Ready for production

---

## Requirements

1. Node.js
2. Anthropic API key
3. Internet connection
4. ~1 hour of time

```bash
npm install @anthropic-ai/sdk
```

---

## Commands Cheat Sheet

```bash
# Check current status
node check-japanese-status.js

# Complete setup (recommended)
node setup-japanese-complete.js

# Individual steps
node cleanup-japanese-synthetic.js
node generate-japanese-vocabulary.js
node assign-japanese-themes-llm.js
node create-japanese-word-sets.js
```

---

## Windows Users

Just run:
```cmd
set ANTHROPIC_API_KEY=your-key
run-japanese-setup.bat
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not set" | `$env:ANTHROPIC_API_KEY="your-key"` |
| Rate limit errors | Wait, scripts have auto-delays |
| Partial completion | Safe to re-run any script |
| Low word count | Re-run generation script |

---

## Sample Output

```
JAPANESE VOCABULARY STATUS
================================================================================

Overall Statistics:
  Total words:        10,000
  Real words:         10,000 (100.0%)
  Synthetic words:    0 (0.0%)
  Themed words:       10,000 (100.0%)

Words by Level:
  A1:  1,000 /  1,000 (100.0%)
  A2:  1,000 /  1,000 (100.0%)
  B1:  1,500 /  1,500 (100.0%)
  B2:  2,000 /  2,000 (100.0%)
  C1:  2,500 /  2,500 (100.0%)
  C2:  2,000 /  2,000 (100.0%)

✅ Japanese vocabulary is complete!
```

---

## File Purposes

| Script | What It Does |
|--------|--------------|
| cleanup | Deletes synthetic words (with "_") |
| generate | Creates 10k real Japanese words via AI |
| assign-themes | Categorizes words by theme via AI |
| create-sets | Makes thematic learning sets |
| setup-complete | Runs all 4 scripts in order |
| check-status | Shows current state + next steps |

---

## Database Changes

### source_words_japanese
- Deletes: ~9,964 synthetic words
- Adds: 10,000 real words
- Updates: theme column (new)

### word_sets
- Adds: ~100-150 thematic sets
- For: Japanese language
- Ready: For user learning

---

## Next Steps After Setup

1. Run `check-japanese-status.js` to verify
2. Test in your application
3. Verify word sets display correctly
4. Check sample words for quality
5. Start using in production

---

## Support

- Quick help: `JAPANESE_QUICK_START.md`
- Full guide: `JAPANESE_SETUP_GUIDE.md`
- Complete docs: `JAPANESE_VOCABULARY_COMPLETE.md`

---

## Success Criteria

✅ No synthetic words
✅ 10,000 real words
✅ All words themed
✅ Word sets created
✅ Production ready

---

**Ready to start?** Run `node setup-japanese-complete.js`

---

## License

Part of words-learning-server project

**Last Updated**: 2026-01-02
