-- Migration: Create user_word_progress table
-- This table tracks user progress for words from source_words_* tables
-- Instead of copying words to user's personal vocabulary

-- Drop existing table if it exists
DROP TABLE IF EXISTS user_word_progress CASCADE;

-- Create user_word_progress table
CREATE TABLE user_word_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_pair_id INTEGER NOT NULL REFERENCES language_pairs(id) ON DELETE CASCADE,

    -- Reference to source word (e.g., from source_words_german)
    source_language VARCHAR(20) NOT NULL, -- e.g., 'german', 'english', 'spanish'
    source_word_id INTEGER NOT NULL, -- ID from source_words_* table

    -- Learning progress
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120', 'learned'
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- SRS (Spaced Repetition System) data
    review_cycle INTEGER DEFAULT 1, -- Current review cycle (1, 3, 7, 14, 30, 60, 120 days)
    last_review_date TIMESTAMP,
    next_review_date TIMESTAMP,
    ease_factor DECIMAL(3,2) DEFAULT 2.50, -- SM-2 algorithm ease factor

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(user_id, language_pair_id, source_language, source_word_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_word_progress_user_pair
    ON user_word_progress(user_id, language_pair_id);

CREATE INDEX idx_user_word_progress_status
    ON user_word_progress(user_id, language_pair_id, status);

CREATE INDEX idx_user_word_progress_review_date
    ON user_word_progress(next_review_date)
    WHERE next_review_date IS NOT NULL;

CREATE INDEX idx_user_word_progress_source
    ON user_word_progress(source_language, source_word_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_word_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_word_progress_updated_at
    BEFORE UPDATE ON user_word_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_word_progress_updated_at();

-- Comments
COMMENT ON TABLE user_word_progress IS 'Tracks user learning progress for words from source vocabularies';
COMMENT ON COLUMN user_word_progress.source_language IS 'Source language name (e.g., german, english)';
COMMENT ON COLUMN user_word_progress.source_word_id IS 'ID from source_words_* table';
COMMENT ON COLUMN user_word_progress.ease_factor IS 'SM-2 algorithm ease factor (2.5 default, min 1.3)';
