-- Migration: Add Romance Language Translation Tables
-- Created: 2025-12-21
-- Purpose: Add support for Italian, Spanish, and Portuguese translations
-- Languages: Italian (it), Spanish (es), Portuguese (pt)

-- ============================================================================
-- Italian Translation Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_translations_italian (
    id SERIAL PRIMARY KEY,
    source_lang VARCHAR(10) DEFAULT 'de' NOT NULL,
    source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
    translation TEXT NOT NULL,
    example_it TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one translation per source word
    CONSTRAINT unique_italian_translation UNIQUE (source_lang, source_word_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_italian_source_lookup
ON target_translations_italian(source_lang, source_word_id);

-- Add comment to table
COMMENT ON TABLE target_translations_italian IS 'German to Italian (de→it) translations - Romance language family';

-- ============================================================================
-- Spanish Translation Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_translations_spanish (
    id SERIAL PRIMARY KEY,
    source_lang VARCHAR(10) DEFAULT 'de' NOT NULL,
    source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
    translation TEXT NOT NULL,
    example_es TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one translation per source word
    CONSTRAINT unique_spanish_translation UNIQUE (source_lang, source_word_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_spanish_source_lookup
ON target_translations_spanish(source_lang, source_word_id);

-- Add comment to table
COMMENT ON TABLE target_translations_spanish IS 'German to Spanish (de→es) translations - Romance language family';

-- ============================================================================
-- Portuguese Translation Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_translations_portuguese (
    id SERIAL PRIMARY KEY,
    source_lang VARCHAR(10) DEFAULT 'de' NOT NULL,
    source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
    translation TEXT NOT NULL,
    example_pt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one translation per source word
    CONSTRAINT unique_portuguese_translation UNIQUE (source_lang, source_word_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_portuguese_source_lookup
ON target_translations_portuguese(source_lang, source_word_id);

-- Add comment to table
COMMENT ON TABLE target_translations_portuguese IS 'German to Portuguese (de→pt) translations - Romance language family';

-- ============================================================================
-- Update Triggers for automatic timestamp management
-- ============================================================================

-- Italian
CREATE OR REPLACE FUNCTION update_italian_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_italian_timestamp
    BEFORE UPDATE ON target_translations_italian
    FOR EACH ROW
    EXECUTE FUNCTION update_italian_timestamp();

-- Spanish
CREATE OR REPLACE FUNCTION update_spanish_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_spanish_timestamp
    BEFORE UPDATE ON target_translations_spanish
    FOR EACH ROW
    EXECUTE FUNCTION update_spanish_timestamp();

-- Portuguese
CREATE OR REPLACE FUNCTION update_portuguese_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portuguese_timestamp
    BEFORE UPDATE ON target_translations_portuguese
    FOR EACH ROW
    EXECUTE FUNCTION update_portuguese_timestamp();

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - target_translations_italian (de→it 🇮🇹)';
    RAISE NOTICE '  - target_translations_spanish (de→es 🇪🇸)';
    RAISE NOTICE '  - target_translations_portuguese (de→pt 🇵🇹)';
END $$;
