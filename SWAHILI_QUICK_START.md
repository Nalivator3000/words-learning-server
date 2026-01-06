# SWAHILI VOCABULARY - QUICK START

## TL;DR - Just Run This! ⚡

```bash
node run-swahili-setup-complete.js
```

This single command will:
- ✅ Delete all synthetic test data
- ✅ Add ~1000 real Swahili words
- ✅ Assign themes to all words
- ✅ Create thematic word sets
- ✅ Show statistics

**No API key needed. Takes ~2-3 minutes.**

---

## What You Get

- **~1000 authentic Swahili words** organized by CEFR level (A1-C2)
- **18 themes**: family, food, travel, home, health, work, education, nature, weather, communication, culture, emotions, sports, technology, time, numbers, colors, clothing
- **~50-60 word sets** ready to use in your application
- **Quality vocabulary** - all words manually curated

---

## Before Running

Make sure you have:
- Node.js installed
- PostgreSQL client (`pg` package)
- Database connection working

Test database connection:
```bash
node -e "const {Pool}=require('pg');new Pool({connectionString:'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'}).query('SELECT 1').then(()=>console.log('✅ Connected')).catch(e=>console.error('❌',e.message)).finally(()=>process.exit())"
```

---

## Alternative Options

### Option A: Quick Test (~300 words, 1 minute)
```bash
node create-swahili-vocabulary-manual.js
```

### Option B: Extended (~1000 words, step-by-step)
```bash
node create-swahili-vocabulary-manual.js
node extend-swahili-vocabulary.js
node create-thematic-sets-universal.js swahili
```

### Option C: Full LLM Version (~10,000 words, requires API key)
```bash
export ANTHROPIC_API_KEY=your_key_here
node create-swahili-vocabulary.js
```

---

## Verify Results

After running, check your database:

```bash
# Total words
psql "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway" -c "SELECT COUNT(*) FROM source_words_swahili;"

# Word sets
psql "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway" -c "SELECT COUNT(*) FROM word_sets WHERE source_language='swahili';"
```

Expected output:
- Words: ~1000
- Word sets: ~50-60

---

## Sample Words

After setup, you should see words like:

```
mama (mother) - A1 - family
habari (news/hello) - A1 - communication
safari (journey) - A2 - travel
elimu (education) - B1 - education
utamaduni (culture) - B2 - culture
falsafa (philosophy) - C1 - general
```

---

## Troubleshooting

**Database connection error?**
- Check that Railway database is running
- Verify connection string is correct
- Test with simple query first

**Duplicate words?**
- Scripts use `ON CONFLICT DO NOTHING`
- Safe to run multiple times
- Duplicates are skipped, not errors

**Want more words?**
- Run `extend-swahili-vocabulary.js` again (safe)
- Or use LLM version for 10,000 words
- Or add your own words to the scripts

---

## What Happens

1. **Delete synthetic data** - Removes test words like "ndiyo_123_A1"
2. **Insert base vocabulary** - ~300 core words (A1-C2)
3. **Insert extended vocabulary** - ~700 additional words
4. **Create word sets** - Groups words by theme and level
5. **Show statistics** - Confirms everything worked

---

## Support

See full documentation: `SWAHILI_VOCABULARY_SETUP.md`

**Current Status:**
- ❌ 99.7% synthetic data (before)
- ✅ 100% real words (after setup)

---

**Last Updated:** 2026-01-02
**Recommended:** Use `run-swahili-setup-complete.js`
