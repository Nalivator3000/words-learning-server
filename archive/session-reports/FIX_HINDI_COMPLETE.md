# Hindi Word Sets - Complete Fix Required

## Problem Summary

The `source_words_hindi` table was created with an incomplete structure, missing several required columns that exist in other `source_words_*` tables.

## Missing Columns Found

1. ✅ `pos` - **FIXED** (part of speech)
2. ✅ `example_hi` - **FIXED** (example sentence in Hindi)
3. ❌ Translation table issues - `example_native` column missing in `target_translations_english_from_hi`

## Root Cause

The Hindi tables were created by a custom script rather than following the standard migration template used for other languages (German, Spanish, etc.).

## Recommendation

Since we're encountering multiple structural issues, there are two options:

### Option 1: Complete Table Recreation (RECOMMENDED)
- Create proper migration following the standard template
- Recreate `source_words_hindi` with all required columns
- Recreate translation tables with proper structure
- Re-import Hindi word data

### Option 2: Incremental Fixes (Current Approach)
- Keep finding and fixing missing columns one by one
- Risk: May encounter more issues later
- Pro: No data loss

## Current Status

- ✅ Language pair format fixed (frontend)
- ✅ `pos` column added
- ✅ `example_hi` column added
- ❌ Translation table structure needs fixing

## Next Steps

The translation table `target_translations_english_from_hi` needs the `example_native` column. However, this suggests a deeper structural mismatch.

**Recommended**: Check if this is worth fixing piecemeal or if we should properly recreate the Hindi tables following the standard structure.
