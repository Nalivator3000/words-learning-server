-- Migration: Add missing 'pos' column to source_words_hindi table
-- Created: 2026-01-06
-- Purpose: Fix "column sw.pos does not exist" error when fetching Hindi word sets
-- Issue: source_words_hindi was created without the 'pos' column that exists in other source_words_* tables

-- Check if the column already exists before adding it
DO $$
BEGIN
    -- Add pos column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'source_words_hindi'
        AND column_name = 'pos'
    ) THEN
        ALTER TABLE source_words_hindi
        ADD COLUMN pos VARCHAR(50);

        RAISE NOTICE 'Added pos column to source_words_hindi table';
    ELSE
        RAISE NOTICE 'Column pos already exists in source_words_hindi table';
    END IF;
END $$;

-- Create index on pos column for better query performance
CREATE INDEX IF NOT EXISTS idx_source_words_hindi_pos ON source_words_hindi(pos);

-- Add comment to the column
COMMENT ON COLUMN source_words_hindi.pos IS 'Part of speech: noun, verb, adjective, adverb, etc.';

-- Display summary
DO $$
DECLARE
    total_words INTEGER;
    words_with_pos INTEGER;
    words_without_pos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_words FROM source_words_hindi;
    SELECT COUNT(*) INTO words_with_pos FROM source_words_hindi WHERE pos IS NOT NULL;
    SELECT COUNT(*) INTO words_without_pos FROM source_words_hindi WHERE pos IS NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Hindi words: %', total_words;
    RAISE NOTICE 'Words with POS: %', words_with_pos;
    RAISE NOTICE 'Words without POS: %', words_without_pos;
    RAISE NOTICE '========================================';
END $$;
