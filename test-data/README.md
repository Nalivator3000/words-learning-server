# 🧪 Test Data for FluentFlow

This folder contains test data files for setting up realistic demo accounts for Google Play Store screenshots.

---

## 📁 Files

### german-words-50.csv
- **Purpose**: Import 50 common German words into test account
- **Format**: CSV with columns: `word`, `translation`, `example`
- **Usage**: Import via FluentFlow app interface (Import → CSV)
- **Size**: 50 words
- **Content**: Common German vocabulary (der Apfel, das Buch, die Katze, etc.)

---

## 🎯 How to Use

### Quick Import (via App):
1. Register test account: `demo@fluentflow.app`
2. Login to production: https://words-learning-server-copy-production.up.railway.app/
3. Go to "Import" section
4. Select "CSV Import"
5. Upload `german-words-50.csv`
6. Verify: 50 words imported successfully

### Manual Import (via Database):
1. See `../seed-test-data.sql` for automated database seeding
2. Includes words + study sessions + achievements + streak

---

## 📋 CSV Format

```csv
word,translation,example
der Apfel,apple,Ich esse einen Apfel
das Buch,book,Ich lese ein interessantes Buch
...
```

**Columns**:
- `word`: German word (with article for nouns)
- `translation`: English translation
- `example`: Example sentence in German

---

## ✅ What This Provides

After importing `german-words-50.csv`:
- ✅ 50 German words in vocabulary
- ✅ Realistic learning content for screenshots
- ✅ Proper German grammar (articles, sentences)
- ✅ Variety of word types (nouns, adjectives, verbs)

---

## 🚀 Next Steps After Import

1. **Study words** (3-4 sessions of 10 words each)
2. **Review words** (wait 24h or use SQL to set due dates)
3. **Unlock achievements** (study 10, 50 words; maintain streak)
4. **Build streak** (login daily for 7 days OR use SQL)
5. **Capture screenshots** (follow SCREENSHOTS_GUIDE.md)

---

## 📖 Related Documentation

- [TEST_ACCOUNT_SETUP.md](../TEST_ACCOUNT_SETUP.md) - Complete setup guide
- [seed-test-data.sql](../seed-test-data.sql) - Automated database seeding
- [SCREENSHOTS_GUIDE.md](../SCREENSHOTS_GUIDE.md) - Screenshot instructions
- [QUICK_START.md](../QUICK_START.md) - Overall quick start guide

---

**Purpose**: Google Play Store Screenshots
**Status**: Ready to use ✅
**Last Updated**: 2025-10-24
