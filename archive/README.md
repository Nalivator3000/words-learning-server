# Archive Directory
**Created:** 2025-12-13
**Purpose:** Store outdated files that are no longer used in production

⚠️ **DO NOT USE FILES FROM THIS DIRECTORY IN PRODUCTION CODE**

All files here are preserved for historical reference only.

---

## Directory Structure

```
archive/
├── server/          # Old server implementations
├── css/             # Old stylesheets
├── docs/            # Outdated documentation
├── scripts/         # One-time migration scripts
│   └── migration/   # I18n & data migration scripts
├── translations/    # Old translation system files
├── public/          # Unused public assets
└── test-data/       # Old test files
```

---

## Contents Inventory

### /server
- `server.js` - Old Express server (replaced by server-postgresql.js)
- `server-old.js` - Very old server backup

**Replaced by:** `server-postgresql.js` (current)

---

### /css
- `style-old.css` - Outdated stylesheet
- `style-v3.css` - Versioned stylesheet

**Replaced by:** `public/style.css` (current)

---

### /docs
#### Completed Migrations
- `I18N_MIGRATION_FINAL.md` - i18n migration completed
- `I18N_MIGRATION_STATUS.md` - Migration status tracking
- `PHASE_2_COMPLETE.md` - Phase 2 completion summary
- `PHASE_2_PROGRESS.md` - Phase 2 progress tracking
- `PHASE_3.4_COMPLETE.md` - Phase 3.4 completion
- `PHASE_4_QA_SUMMARY.md` - QA summary

#### Old Releases
- `DEPLOYMENT_SUMMARY_v5.1.3.md` - v5.1.3 deployment (current: v5.4.6)
- `RELEASE_NOTES_5.1.3.md` - v5.1.3 release notes
- `PLAY_STORE_RELEASE_NOTES_5.1.0.md` - v5.1.0 Play Store notes
- `UPLOAD_TO_PLAY_STORE_v5.1.0.md` - v5.1.0 upload guide

#### Duplicate Guides
- `ANDROID_BUILD_QUICKSTART.md` - Consolidated into ANDROID_RELEASE_README.md
- `ANDROID_STUDIO_TWA_GUIDE.md` - Consolidated
- `APK_BUILD_INSTRUCTIONS_5.1.0.md` - Consolidated
- `BUILD_AAB_QUICKSTART.md` - Consolidated
- `TWA_BUILD_GUIDE.md` - Consolidated
- `TWA_SETUP_GUIDE.md` - Consolidated
- `README_ANDROID_RELEASE.md` - Consolidated

#### Cache Busting
- `CACHE_BUSTING_SOLUTION.md` - Merged into CACHE_BUSTING.md

**Current docs in root:** See PROJECT_STRUCTURE.md for active documentation list

---

### /scripts
Root-level one-time utility scripts:

#### Database & Data Management
- `add-demo-activity.js` - Add demo user activity
- `add-language.js` - Add language pair
- `add-test-wordlist-api.js` - Test word list API
- `add-word-list.js` - Populate word lists
- `populate-cefr-word-sets.js` - CEFR word sets (one-time)
- `populate-thematic-word-sets.js` - Thematic sets (one-time)

#### Data Cleanup
- `check-duplicates.js` - Find duplicate words
- `check-points-mismatch.js` - Point system validation
- `check-review-words.js` - Review queue validation
- `check-user-goals.js` - Goal system check
- `check-word-statuses.js` - Word status validation
- `remove-duplicates.js` - Remove duplicate entries

#### Migrations
- `migrate-words.js` - Word data migration
- `migrate-word-statuses.js` - Status migration
- `run-migration-daily-goals.js` - Daily goals migration
- `update-daily-goals.js` - Goal updates
- `update-today-goals.js` - Today's goal updates

#### CSV & Translation Fixes
- `fix-csv.js` - CSV data cleanup
- `fix-csv-smart.js` - Smart CSV fixing
- `fix-translations.js` - Translation fixes
- `fix-word-stages.js` - Word stage corrections
- `check-i18n-coverage.js` - Translation coverage check

#### Testing
- `create-test-account.js` - Create test users
- `delete-test-account.js` - Delete test users
- `build-production.js` - Production build script

**Active scripts:** See `scripts/` directory (screenshot generation, build tools)

---

### /scripts/migration
I18n and data migration scripts (one-time use):

#### Extract & Merge
- `extract-hardcoded-texts.js` - Extract hardcoded UI strings
- `extract-translations.js` - Extract existing translations
- `merge-additional-keys.js` - Merge additional translation keys
- `merge-basic-ui.js` - Merge basic UI translations
- `merge-essential-keys.js` - Merge essential keys
- `merge-html-keys.js` - Merge HTML template keys
- `merge-js-strings.js` - Merge JS string translations
- `merge-lm-keys.js` - Merge language manager keys
- `merge-missing-essential.js` - Merge missing essential keys
- `merge-onboarding-keys.js` - Merge onboarding keys
- `merge-remaining-keys.js` - Merge remaining keys

#### Fill & Fix
- `fill-from-source.js` - Fill from source texts
- `fill-with-english.js` - Fill missing with English
- `fix-final-html.js` - Final HTML i18n fixes
- `fix-html-i18n.js` - HTML internationalization fixes

#### Migration
- `migrate-all-js.js` - Migrate all JS files to i18n
- `migrate-html-i18n.js` - Migrate HTML to i18n
- `migrate-js-i18n.js` - Migrate JS to i18n system
- `migrate-remaining-js.js` - Migrate remaining JS files

#### Rename
- `rename-to-lexibooster.js` - Rename project to LexiBooster
- `rename-to-lexybooster.js` - Rename to LexyBooster

**Replaced by:** Unified `public/translations/source-texts.json` system

---

### /translations
Old translation system files (replaced by unified source-texts.json):

- `additional-keys.json` - Additional UI keys
- `basic-ui-keys.json` - Basic UI translations
- `essential-ui-keys.json` - Essential UI keys
- `js-strings.json` - JavaScript string translations
- `language-manager-keys.json` - Language manager keys
- `onboarding-survival-keys.json` - Onboarding & survival mode keys
- `remaining-html-keys.json` - Remaining HTML keys
- `remaining-js-keys.json` - Remaining JS keys

**Replaced by:** `public/translations/source-texts.json` (unified system)

---

### /public
Unused public assets:

#### Browser Extension Files (Not Used)
- `background.js` - Extension background script
- `content-script.js` - Extension content script
- `popup.js` - Extension popup script
- `popup.html` - Extension popup page

**Note:** This is a PWA (Progressive Web App), not a browser extension.

#### Old Pages
- `migrate.html` - Data migration page (one-time use)
- `generate-icons.html` - Icon generator page

**Replaced by:** Scripts in `/scripts` directory

---

## Recovery Instructions

If you need to recover a file from the archive:

```bash
# Copy file back to original location
cp archive/[category]/[filename] [original-path]/

# Example: Recover old server
cp archive/server/server.js ./server.js
```

**Note:** Check git history first - all files are in version control:
```bash
git log --all --full-history -- path/to/file
git show <commit-hash>:path/to/file
```

---

## Deletion Policy

Files in this archive may be permanently deleted after:
- ✅ 6 months with no access
- ✅ Verified not referenced in any active code
- ✅ Git history preserved

**Last review:** 2025-12-13
**Next review:** 2026-06-13

---

## See Also

- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Current active files
- [PROJECT_CLEANUP_PLAN.md](../PROJECT_CLEANUP_PLAN.md) - Cleanup strategy
- [CHANGELOG.md](../CHANGELOG.md) - Version history
