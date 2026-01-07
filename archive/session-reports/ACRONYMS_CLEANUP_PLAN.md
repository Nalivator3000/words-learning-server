# Technical Acronyms Cleanup Plan

## Problem

The database contains **23 technical acronyms** (PDF, PHP, HTTP, DVD, CD, etc.) in word learning sets across all languages. These words are:

1. ❌ **Useless for language learning** - They sound the same in every language
2. ❌ **Not real vocabulary** - Technical abbreviations, not natural language
3. ❌ **Take up space** - Replace useful words that students should learn
4. ❌ **Poor user experience** - Students see "PDF" instead of real Spanish/French/etc. words

## Scale of the Problem

- **23 technical acronyms** found in `source_words_english`
- **289 word set items** affected across all languages
- **Affects all languages**: English, German, Spanish, French, Russian, Italian, Polish, Portuguese, Romanian, Serbian, Turkish, Ukrainian, Arabic, Swahili, Chinese, Hindi, Japanese, Korean

### Acronyms Found:

**A1 Level (6):**
- dvd, cd, tv, pc, url, html

**A2 Level (7):**
- pdf, php, ip, xml, usb, os

**B1 Level (4):**
- rom, sql, gps, ram

**B2 Level (5):**
- css, ftp, cpu, http, api

**C1 Level (2):**
- tcp, dns

## Solution

### Step 1: Remove Acronyms from Database

**Script:** [scripts/remove-acronyms.js](scripts/remove-acronyms.js)

This script will:
1. ✅ Remove 289 items from `word_set_items` table
2. ✅ Update `word_count` for affected word sets
3. ✅ Clean up any user progress entries with these words
4. ⚠️ Optionally delete from `source_words_english` (disabled by default for safety)

**To run:**
```bash
# 1. Review the script first
cat scripts/remove-acronyms.js

# 2. Uncomment the last line: removeAcronyms();
# 3. Run it
node scripts/remove-acronyms.js
```

### Step 2: Prevent Future Acronyms

Add validation when creating word sets from source words:

**File to modify:** Script that populates word sets (e.g., `create-word-sets-from-source.js`)

**Add this function:**
```javascript
function isLikelyAcronym(word) {
    if (!word) return false;
    
    const upperWord = word.toUpperCase();
    
    // All uppercase and short (2-5 chars)
    if (word === upperWord && word.length >= 2 && word.length <= 5) {
        return true;
    }
    
    // Common tech acronyms
    const techAcronyms = [
        'PDF', 'PHP', 'HTTP', 'HTTPS', 'URL', 'API', 'HTML', 'CSS', 'XML', 'JSON',
        'SQL', 'FTP', 'SSH', 'DNS', 'IP', 'TCP', 'UDP', 'USB', 'CD', 'DVD',
        'RAM', 'ROM', 'CPU', 'GPU', 'SSD', 'HDD', 'OS', 'PC', 'TV', 'GPS'
    ];
    
    return techAcronyms.includes(upperWord);
}

// When selecting words for a set:
const validWords = sourceWords.filter(w => !isLikelyAcronym(w.word));
```

### Step 3: Update Word Set Generation

When regenerating word sets in the future:
1. Filter out acronyms BEFORE creating sets
2. Log skipped acronyms for review
3. Ensure word sets maintain their target count by selecting next valid word

## Impact

**After cleanup:**
- ✅ 289 useless items removed from word sets
- ✅ All languages cleaned of technical jargon
- ✅ Better learning experience for all users
- ✅ Word sets contain only real, useful vocabulary

## Verification

After running the cleanup, verify with:

```bash
# Check that acronyms are gone
node scripts/find-acronyms.js

# Check specific word sets
node scripts/check-acronym-word-sets.js
```

## Notes

- Word set counts will decrease by 1 word for each affected set
- Consider regenerating word sets to bring them back to 50 words each
- No user data is lost - only the problematic acronym entries are removed
