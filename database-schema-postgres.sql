-- External Database Schema for Words Learning App (PostgreSQL)
-- This replaces the local IndexedDB with a persistent server-side database

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table - stores user account information
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Language pairs table - defines language combinations for learning
CREATE TABLE language_pairs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    from_language VARCHAR(50) NOT NULL, -- Language being learned (e.g., "German")
    to_language VARCHAR(50) NOT NULL,   -- Native language (e.g., "Russian")
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_language_pairs ON language_pairs(user_id);

-- Word status enum
CREATE TYPE word_status AS ENUM ('studying', 'review_7', 'review_30', 'learned');

-- Words table - stores all vocabulary words and their learning progress
CREATE TABLE words (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_pair_id VARCHAR(50) NOT NULL REFERENCES language_pairs(id) ON DELETE CASCADE,
    
    -- Word data
    word VARCHAR(255) NOT NULL,
    translation VARCHAR(255) NOT NULL,
    example TEXT,
    example_translation TEXT,
    
    -- Learning progress
    status word_status DEFAULT 'studying',
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    review_attempts INTEGER DEFAULT 0,
    
    -- Timestamps
    date_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_studied TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for words updated_at
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_user_words ON words(user_id);
CREATE INDEX idx_language_pair_words ON words(language_pair_id);
CREATE INDEX idx_status ON words(status);
CREATE INDEX idx_next_review ON words(next_review);
CREATE INDEX idx_user_status ON words(user_id, status);
CREATE INDEX idx_user_language_status ON words(user_id, language_pair_id, status);
CREATE INDEX idx_words_review_due ON words(user_id, status, next_review) 
    WHERE status IN ('review_7', 'review_30') AND next_review IS NOT NULL;

-- Quiz type enum
CREATE TYPE quiz_type AS ENUM ('multiple_choice', 'typing', 'audio', 'translation', 'example');

-- Word attempts table - detailed history of learning attempts
CREATE TABLE word_attempts (
    id BIGSERIAL PRIMARY KEY,
    word_id BIGINT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Attempt details
    is_correct BOOLEAN NOT NULL,
    quiz_type quiz_type NOT NULL,
    response_time_ms INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for attempts
CREATE INDEX idx_word_attempts ON word_attempts(word_id);
CREATE INDEX idx_user_attempts ON word_attempts(user_id);
CREATE INDEX idx_attempt_date ON word_attempts(created_at);

-- User progress table - stores overall learning statistics
CREATE TABLE user_progress (
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_pair_id VARCHAR(50) NOT NULL REFERENCES language_pairs(id) ON DELETE CASCADE,
    
    -- Statistics
    total_words_added INTEGER DEFAULT 0,
    words_learned INTEGER DEFAULT 0,
    total_study_sessions INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    
    -- Last activity
    last_study_date DATE,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key and foreign keys
    PRIMARY KEY (user_id, language_pair_id)
);

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Difficulty level enum
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- User settings table - stores user preferences
CREATE TABLE user_settings (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- UI preferences
    ui_language VARCHAR(10) DEFAULT 'ru',
    lesson_size INTEGER DEFAULT 10,
    
    -- Learning preferences
    auto_play_audio BOOLEAN DEFAULT TRUE,
    show_example_sentences BOOLEAN DEFAULT TRUE,
    difficulty_level difficulty_level DEFAULT 'beginner',
    
    -- Notification preferences
    daily_reminder BOOLEAN DEFAULT TRUE,
    reminder_time TIME DEFAULT '19:00:00',
    
    -- Backup preferences
    auto_backup BOOLEAN DEFAULT TRUE,
    last_backup_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Session type enum
CREATE TYPE session_type AS ENUM ('studying', 'review', 'mixed');

-- Study sessions table - tracks individual study sessions
CREATE TABLE study_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_pair_id VARCHAR(50) NOT NULL REFERENCES language_pairs(id) ON DELETE CASCADE,
    
    -- Session details
    session_type session_type NOT NULL,
    words_studied INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sessions
CREATE INDEX idx_user_sessions ON study_sessions(user_id);
CREATE INDEX idx_session_date ON study_sessions(started_at);

-- Database version tracking
CREATE TABLE schema_versions (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert initial schema version
INSERT INTO schema_versions (version, description) VALUES 
('2.0.0-postgres', 'PostgreSQL schema for Words Learning App');

-- Create materialized view for user statistics (for performance)
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(w.id) as total_words,
    COUNT(CASE WHEN w.status = 'studying' THEN 1 END) as studying_words,
    COUNT(CASE WHEN w.status = 'review_7' THEN 1 END) as review_7_words,
    COUNT(CASE WHEN w.status = 'review_30' THEN 1 END) as review_30_words,
    COUNT(CASE WHEN w.status = 'learned' THEN 1 END) as learned_words,
    COUNT(CASE WHEN w.status IN ('review_7', 'review_30') 
               AND (w.next_review IS NULL OR w.next_review <= CURRENT_TIMESTAMP) THEN 1 END) as due_for_review,
    MAX(w.last_studied) as last_activity
FROM users u
LEFT JOIN words w ON u.id = w.user_id
GROUP BY u.id, u.name;

-- Index for the materialized view
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Function to refresh user stats
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_stats;
END;
$$ LANGUAGE plpgsql;

-- Sample data for development/testing
INSERT INTO users (id, email, name, created_at) VALUES
('root-user', 'root@example.com', 'Root User', CURRENT_TIMESTAMP),
('kate-user', 'kate@example.com', 'Kate', CURRENT_TIMESTAMP),
('mike-user', 'mike@example.com', 'Mike', CURRENT_TIMESTAMP);

INSERT INTO language_pairs (id, user_id, name, from_language, to_language, is_active) VALUES
('root-user-default-pair', 'root-user', 'German-Russian', 'German', 'Russian', TRUE),
('kate-user-default-pair', 'kate-user', 'German-Russian', 'German', 'Russian', TRUE),
('mike-user-default-pair', 'mike-user', 'German-Russian', 'German', 'Russian', TRUE);

INSERT INTO user_settings (user_id) VALUES
('root-user'),
('kate-user'),
('mike-user');

-- Refresh the materialized view
SELECT refresh_user_stats();

-- Useful views for the API

-- View for word export
CREATE VIEW v_user_word_export AS
SELECT 
    u.email,
    u.name as user_name,
    lp.name as language_pair_name,
    lp.from_language,
    lp.to_language,
    w.word,
    w.translation,
    w.example,
    w.example_translation,
    w.status,
    w.correct_count,
    w.incorrect_count,
    w.date_added,
    w.last_studied,
    w.next_review
FROM words w
JOIN users u ON w.user_id = u.id
JOIN language_pairs lp ON w.language_pair_id = lp.id;

-- Function to get words due for review
CREATE OR REPLACE FUNCTION get_review_words(p_user_id VARCHAR(50), p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    id BIGINT,
    word VARCHAR(255),
    translation VARCHAR(255),
    example TEXT,
    example_translation TEXT,
    status word_status,
    correct_count INTEGER,
    incorrect_count INTEGER,
    language_pair_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.word,
        w.translation,
        w.example,
        w.example_translation,
        w.status,
        w.correct_count,
        w.incorrect_count,
        lp.name as language_pair_name
    FROM words w
    JOIN language_pairs lp ON w.language_pair_id = lp.id
    WHERE w.user_id = p_user_id 
        AND w.status IN ('review_7', 'review_30')
        AND (w.next_review IS NULL OR w.next_review <= CURRENT_TIMESTAMP)
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get study words
CREATE OR REPLACE FUNCTION get_study_words(p_user_id VARCHAR(50), p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    id BIGINT,
    word VARCHAR(255),
    translation VARCHAR(255),
    example TEXT,
    example_translation TEXT,
    status word_status,
    correct_count INTEGER,
    incorrect_count INTEGER,
    language_pair_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.word,
        w.translation,
        w.example,
        w.example_translation,
        w.status,
        w.correct_count,
        w.incorrect_count,
        lp.name as language_pair_name
    FROM words w
    JOIN language_pairs lp ON w.language_pair_id = lp.id
    WHERE w.user_id = p_user_id 
        AND w.status = 'studying'
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE language_pairs IS 'Language learning pairs (e.g., German-Russian)';
COMMENT ON TABLE words IS 'Vocabulary words with learning progress';
COMMENT ON TABLE word_attempts IS 'Detailed history of learning attempts';
COMMENT ON TABLE user_progress IS 'Overall learning statistics per user';
COMMENT ON TABLE user_settings IS 'User preferences and settings';
COMMENT ON TABLE study_sessions IS 'Individual study session tracking';
COMMENT ON MATERIALIZED VIEW user_stats IS 'Cached user statistics for performance';