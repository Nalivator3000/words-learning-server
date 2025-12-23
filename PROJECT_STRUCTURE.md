# LexyBooster Project Structure

Last Updated: 2025-12-22

---

## Directory Structure

```
words-learning-server/
├── 📁 public/              # Frontend static files (HTML, CSS, JS)
├── 📁 scripts/             # Database and utility scripts (organized by category)
│   ├── checks/            # Database status and verification scripts
│   ├── collections/       # CEFR collection generation scripts
│   ├── imports/           # Vocabulary import scripts
│   ├── translations/      # Translation automation scripts
│   └── utils/             # General utility scripts
├── 📁 migrations/          # Database migration scripts
├── 📁 docs/                # Project documentation
├── 📁 config/              # Configuration files
├── 📁 utils/               # General utility scripts (icons, screenshots, etc.)
├── 📁 temp/                # Temporary files and deprecated docs
├── 📁 translations/        # Translation JSON files for UI
├── 📁 test-data/           # Test data files
├── 📁 tests/               # Automated tests
├── 📁 releases/            # Release builds
├── 📁 uploads/             # User uploaded files
├── 📁 cache/               # Application cache
├── 📁 audio-cache/         # TTS audio cache
├── 📁 archive/             # Archived files
├── 📄 server-postgresql.js # Main server file
├── 📄 package.json         # NPM dependencies
├── 📄 .env                 # Environment variables (not in git)
└── 📄 README.md            # Main project README

```

---

## Scripts Organization

### `/scripts/checks/`
Database status and verification scripts

- `check-collections-*.js` - Verify collection data
- `check-vocab-status.js` - Check vocabulary database status
- `check-ru-de-collections.js` - Verify ru→de collections
- `check-language-pairs.js` - Check language pair configuration
- `delete-*.js` - Cleanup scripts

### `/scripts/collections/`
CEFR vocabulary collection generation

- `create-german-a1-thematic-collections.js` - A1 German collections
- `create-b2-collections.js` - B2 level collections
- `generate-vocab-templates.js` - Template generation

### `/scripts/imports/`
Vocabulary import from external sources

- `import-frequency-words.js` - Import 10K most common words (EN/ES)
- `import-oxford-5000.js` - Import Oxford 5000 words
- `import-german-*.js` - German vocabulary imports
- `import-c1-universal.js` - C1 level imports
- `import-c2-universal.js` - C2 level imports
- `collect-english-vocabulary.js` - Manual English collection

### `/scripts/translations/`
Auto-translation scripts using Google Translate API

- `translate-all-to-english.js` - DE→EN translations
- `translate-all-to-spanish.js` - DE→ES translations
- `translate-all-to-russian.js` - DE/EN/ES→RU translations
- `translate-all-to-[lang].js` - Other language pairs
- `auto-translate.js` - Generic translation utility

### `/scripts/utils/`
Miscellaneous utility scripts

---

## Utils Organization

### `/utils/`
General application utilities

- `generate-icons.js` - Icon generation
- `generate-screenshots.js` - Screenshot automation
- `generate-feature-graphic.js` - App store graphics
- `check-site.js` - Site health check
- `fix-quiz-audio.js` - Audio fixes

---

## Temp Directory

### `/temp/`
Temporary and deprecated files (safe to clean up)

- Deprecated documentation (`.md` files)
- Temporary SQL scripts
- Debug files (`translation-errors-*.json`)
- Old configuration backups

---

## Key Configuration Files

### Root Level
- `.env` - Environment variables (DATABASE_URL, API keys)
- `.env.example` - Example environment configuration
- `package.json` - NPM dependencies and scripts
- `.gitignore` - Git ignore patterns
- `server-postgresql.js` - Main Express server (12,000+ lines)

### Documentation
- `README.md` - Main project overview
- `docs/VOCABULARY-DATABASE-STATUS.md` - Vocabulary collection status
- `docs/PROGRESS.md` - Development progress tracker
- `docs/LANGUAGE-PAIR-CONVENTION.md` - Language pair notation guide

---

## Database Structure

### Source Words Tables
- `source_words_german` - German vocabulary (10,540 words)
- `source_words_english` - English vocabulary (TBD)
- `source_words_spanish` - Spanish vocabulary (TBD)
- `source_words_[language]` - Other languages

### Translation Tables
- `target_translations_russian` - Translations to Russian
- `target_translations_english` - Translations to English
- `target_translations_[language]` - Other target languages

### Collections
- `universal_collections` - Public CEFR word collections
- `universal_collection_words` - Words in each collection

### User Data
- `users` - User accounts
- `language_pairs` - User language pair selections
- `words` - User's personal vocabulary
- `quiz_sessions` - Quiz history

---

## Development Workflow

### 1. Check Database Status
```bash
node scripts/checks/check-vocab-status.js
node scripts/checks/check-language-pairs.js
```

### 2. Import Vocabulary
```bash
# English + Spanish (10K words each)
node scripts/imports/import-frequency-words.js

# Oxford 5000 (higher quality, smaller corpus)
node scripts/imports/import-oxford-5000.js
```

### 3. Generate Translations
```bash
# German → English (if needed)
node scripts/translations/translate-all-to-english.js

# German → Spanish
node scripts/translations/translate-all-to-spanish.js

# English/Spanish → Russian (for ru→en, ru→es pairs)
node scripts/translations/translate-english-to-russian.js
```

### 4. Create CEFR Collections
```bash
node scripts/collections/create-german-a1-thematic-collections.js
node scripts/collections/create-b2-collections.js
```

---

## Running the Server

### Development
```bash
npm start
```

### Production (Railway)
Automatic deployment on push to `main` or `develop` branch.

---

## Common Tasks

### Add New Language Pair
1. Create `source_words_[language]` table
2. Create import script in `scripts/imports/`
3. Create translation script in `scripts/translations/`
4. Update language pair mappings in `server-postgresql.js`

### Generate New CEFR Level
1. Create collection script in `scripts/collections/`
2. Define word lists by theme
3. Run import script to populate database

### Check System Status
```bash
node scripts/checks/check-vocab-status.js
node scripts/checks/check-collections-visibility.js
```

---

## Important Notes

### Language Pair Convention
`native_lang → learning_lang`

Example: **ru→de** = Russian native speaker learning German

See [docs/LANGUAGE-PAIR-CONVENTION.md](docs/LANGUAGE-PAIR-CONVENTION.md) for details.

### Translation Quality
- **de→ru**: ⭐⭐⭐⭐⭐ (Manual, high quality)
- **de→en**: ⭐⭐⭐⭐ (Auto-translate, good quality)
- **en/es→ru**: ⭐⭐⭐ (Auto-translate, needs review)

---

## Next Steps

See [docs/VOCABULARY-DATABASE-STATUS.md](docs/VOCABULARY-DATABASE-STATUS.md) for:
- Current vocabulary status
- Ready-to-run scripts
- Missing translations
- Action plan for new language pairs
