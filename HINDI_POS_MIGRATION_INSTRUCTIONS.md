# Hindi POS Column Migration Instructions

## Problem

The `source_words_hindi` table is missing the `pos` (part of speech) column, which causes a 500 error when fetching Hindi word set details:

```
Error: column sw.pos does not exist
```

## Solution

Add the `pos` column to the `source_words_hindi` table.

## Files Created

1. **Migration SQL**: [migrations/fix-hindi-source-words-add-pos.sql](migrations/fix-hindi-source-words-add-pos.sql)
   - Adds the `pos` column
   - Creates index for performance
   - Safe to run multiple times (checks if column exists first)

2. **Migration Runner**: [run-hindi-pos-migration.js](run-hindi-pos-migration.js)
   - Node.js script to execute the migration
   - Includes verification and testing
   - Shows detailed output

## How to Run the Migration

### Option 1: Via Railway CLI (Recommended)

```bash
# Connect to Railway project
railway link

# Run the migration script
railway run node run-hindi-pos-migration.js
```

### Option 2: Direct SQL Execution

If you have direct database access, run the SQL file directly:

```bash
psql $DATABASE_URL -f migrations/fix-hindi-source-words-add-pos.sql
```

### Option 3: Push to Git and Run on Server

1. Push the migration files to the repository
2. SSH into the Railway container or use Railway shell
3. Run: `node run-hindi-pos-migration.js`

## Expected Output

```
🔧 Starting Hindi POS column migration...
📄 Migration file loaded: fix-hindi-source-words-add-pos.sql
🔍 Checking current table structure...

✅ Table source_words_hindi exists
🔨 Adding pos column to source_words_hindi...

✅ Migration completed successfully!
✅ Verification: pos column added successfully
   Type: character varying
   Max length: 50

🧪 Testing query that was previously failing...
✅ Query successful! Retrieved 5 rows

Sample data:
   1. अच्छा (no POS) - Level A1
   2. बुरा (no POS) - Level A1
   ...

🎉 Migration completed successfully!
   Hindi word sets should now work correctly in the API.
```

## Verification

After running the migration, test the API:

```bash
node test-hindi-word-sets-api.js
```

This should now successfully fetch Hindi word set details without the "column sw.pos does not exist" error.

## Rollback

If you need to rollback (remove the column):

```sql
ALTER TABLE source_words_hindi DROP COLUMN IF EXISTS pos;
DROP INDEX IF EXISTS idx_source_words_hindi_pos;
```

**Note**: This is unlikely to be necessary as the column should have been there from the start.

## Next Steps

After successful migration:
1. The Hindi word sets API will work correctly
2. Users can view Hindi word set details
3. The earlier fix for language pair format will work end-to-end
