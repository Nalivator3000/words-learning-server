-- External Database Schema for Words Learning App
-- This replaces the local IndexedDB with a persistent server-side database

-- Users table - stores user account information
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Language pairs table - defines language combinations for learning
CREATE TABLE language_pairs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    from_language VARCHAR(50) NOT NULL, -- Language being learned (e.g., "German")
    to_language VARCHAR(50) NOT NULL,   -- Native language (e.g., "Russian")
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_language_pairs (user_id)
);

-- Words table - stores all vocabulary words and their learning progress
CREATE TABLE words (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    language_pair_id VARCHAR(50) NOT NULL,
    
    -- Word data
    word VARCHAR(255) NOT NULL,
    translation VARCHAR(255) NOT NULL,
    example TEXT,
    example_translation TEXT,
    
    -- Learning progress
    status ENUM('studying', 'review_7', 'review_30', 'learned') DEFAULT 'studying',
    correct_count INT DEFAULT 0,
    incorrect_count INT DEFAULT 0,
    review_attempts INT DEFAULT 0,
    
    -- Timestamps
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_studied TIMESTAMP NULL,
    next_review TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_pair_id) REFERENCES language_pairs(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_words (user_id),
    INDEX idx_language_pair_words (language_pair_id),
    INDEX idx_status (status),
    INDEX idx_next_review (next_review),
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_language_status (user_id, language_pair_id, status)
);

-- Word attempts table - detailed history of learning attempts
CREATE TABLE word_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word_id BIGINT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    
    -- Attempt details
    is_correct BOOLEAN NOT NULL,
    quiz_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'typing', 'audio', etc.
    response_time_ms INT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_word_attempts (word_id),
    INDEX idx_user_attempts (user_id),
    INDEX idx_attempt_date (created_at)
);

-- User progress table - stores overall learning statistics
CREATE TABLE user_progress (
    user_id VARCHAR(50) NOT NULL,
    language_pair_id VARCHAR(50) NOT NULL,
    
    -- Statistics
    total_words_added INT DEFAULT 0,
    words_learned INT DEFAULT 0,
    total_study_sessions INT DEFAULT 0,
    total_study_time_minutes INT DEFAULT 0,
    current_streak_days INT DEFAULT 0,
    longest_streak_days INT DEFAULT 0,
    
    -- Last activity
    last_study_date DATE,
    
    -- Timestamps
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Primary key and foreign keys
    PRIMARY KEY (user_id, language_pair_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_pair_id) REFERENCES language_pairs(id) ON DELETE CASCADE
);

-- User settings table - stores user preferences
CREATE TABLE user_settings (
    user_id VARCHAR(50) PRIMARY KEY,
    
    -- UI preferences
    ui_language VARCHAR(10) DEFAULT 'ru',
    lesson_size INT DEFAULT 10,
    
    -- Learning preferences
    auto_play_audio BOOLEAN DEFAULT TRUE,
    show_example_sentences BOOLEAN DEFAULT TRUE,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    
    -- Notification preferences
    daily_reminder BOOLEAN DEFAULT TRUE,
    reminder_time TIME DEFAULT '19:00:00',
    
    -- Backup preferences
    auto_backup BOOLEAN DEFAULT TRUE,
    last_backup_date TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Study sessions table - tracks individual study sessions
CREATE TABLE study_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    language_pair_id VARCHAR(50) NOT NULL,
    
    -- Session details
    session_type ENUM('studying', 'review', 'mixed') NOT NULL,
    words_studied INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_answers INT DEFAULT 0,
    duration_minutes INT DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_pair_id) REFERENCES language_pairs(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_sessions (user_id),
    INDEX idx_session_date (started_at)
);

-- Data migration helper views
-- These views help with migrating from the current IndexedDB structure

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

-- Performance optimization: Create indexes for common queries
CREATE INDEX idx_words_review_due ON words (user_id, status, next_review) 
WHERE status IN ('review_7', 'review_30') AND next_review IS NOT NULL;

CREATE INDEX idx_words_studying ON words (user_id, language_pair_id) 
WHERE status = 'studying';

-- Database version tracking
CREATE TABLE schema_versions (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert initial schema version
INSERT INTO schema_versions (version, description) VALUES 
('1.0.0', 'Initial database schema for Words Learning App');

-- Sample data for development/testing (optional)
INSERT INTO users (id, email, name, password_hash) VALUES
('root-user', 'root@example.com', 'Root User', '$2a$10$example_hash'),
('kate-user', 'kate@example.com', 'Kate', '$2a$10$example_hash'),
('mike-user', 'mike@example.com', 'Mike', '$2a$10$example_hash');

INSERT INTO language_pairs (id, user_id, name, from_language, to_language, is_active) VALUES
('default-pair', 'root-user', 'German-Russian', 'German', 'Russian', TRUE),
('kate-pair', 'kate-user', 'German-Russian', 'German', 'Russian', TRUE),
('mike-pair', 'mike-user', 'German-Russian', 'German', 'Russian', TRUE);