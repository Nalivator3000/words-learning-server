-- Migration: Universal Vocabulary Architecture
-- Created: 2025-12-21
-- Purpose: Create separate tables for source words (study language) and target translations

-- ============================================
-- 1. SOURCE WORDS TABLES (Study Languages)
-- ============================================

-- German words (source/study language)
CREATE TABLE IF NOT EXISTS source_words_german (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL, -- A1, A2, B1, B2, C1, C2
  pos VARCHAR(50), -- part of speech: noun, verb, adjective, etc.
  gender VARCHAR(1), -- m, f, n (for nouns)
  example_de TEXT NOT NULL, -- example in German
  theme VARCHAR(100), -- greetings, food, business, etc.
  metadata JSONB, -- additional data (formality, frequency, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_german_word UNIQUE(word, level)
);

-- English words (source/study language)
CREATE TABLE IF NOT EXISTS source_words_english (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,
  pos VARCHAR(50),
  example_en TEXT NOT NULL,
  theme VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_english_word UNIQUE(word, level)
);

-- Spanish words (source/study language)
CREATE TABLE IF NOT EXISTS source_words_spanish (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,
  pos VARCHAR(50),
  gender VARCHAR(1),
  example_es TEXT NOT NULL,
  theme VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_spanish_word UNIQUE(word, level)
);

-- French words (source/study language)
CREATE TABLE IF NOT EXISTS source_words_french (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,
  pos VARCHAR(50),
  gender VARCHAR(1),
  example_fr TEXT NOT NULL,
  theme VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_french_word UNIQUE(word, level)
);

-- Russian words (source/study language)
CREATE TABLE IF NOT EXISTS source_words_russian (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,
  pos VARCHAR(50),
  gender VARCHAR(1),
  example_ru TEXT NOT NULL,
  theme VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_russian_word UNIQUE(word, level)
);

-- Italian words (source/study language)
CREATE TABLE IF NOT EXISTS source_words_italian (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,
  pos VARCHAR(50),
  gender VARCHAR(1),
  example_it TEXT NOT NULL,
  theme VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_italian_word UNIQUE(word, level)
);

-- ============================================
-- 2. TARGET TRANSLATIONS TABLES
-- ============================================

-- Translations to Russian (target language)
CREATE TABLE IF NOT EXISTS target_translations_russian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL, -- 'de', 'en', 'es', 'fr', 'it'
  source_word_id INTEGER NOT NULL, -- ID from source_words_{lang}
  translation VARCHAR(255) NOT NULL,
  example_ru TEXT, -- localized example (optional)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_russian_translation UNIQUE(source_lang, source_word_id)
);

-- Translations to English (target language)
CREATE TABLE IF NOT EXISTS target_translations_english (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example_en TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_english_translation UNIQUE(source_lang, source_word_id)
);

-- Translations to Spanish (target language)
CREATE TABLE IF NOT EXISTS target_translations_spanish (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example_es TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_spanish_translation UNIQUE(source_lang, source_word_id)
);

-- Translations to German (target language)
CREATE TABLE IF NOT EXISTS target_translations_german (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example_de TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_german_translation UNIQUE(source_lang, source_word_id)
);

-- Translations to French (target language)
CREATE TABLE IF NOT EXISTS target_translations_french (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example_fr TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_french_translation UNIQUE(source_lang, source_word_id)
);

-- Translations to Italian (target language)
CREATE TABLE IF NOT EXISTS target_translations_italian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL,
  source_word_id INTEGER NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example_it TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_italian_translation UNIQUE(source_lang, source_word_id)
);

-- ============================================
-- 3. UNIVERSAL COLLECTIONS
-- ============================================

-- Collections (language-agnostic structure)
CREATE TABLE IF NOT EXISTS universal_collections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_lang VARCHAR(10) NOT NULL, -- 'de', 'en', 'es', 'fr', 'ru', 'it'
  level VARCHAR(10),
  theme VARCHAR(100),
  is_public BOOLEAN DEFAULT true,
  created_by INTEGER, -- user_id (optional)
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Collection words (links collections to source words)
CREATE TABLE IF NOT EXISTS universal_collection_words (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES universal_collections(id) ON DELETE CASCADE,
  source_word_id INTEGER NOT NULL, -- ID from source_words_{source_lang}
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_collection_word UNIQUE(collection_id, source_word_id)
);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

-- Source words indexes
CREATE INDEX IF NOT EXISTS idx_german_level ON source_words_german(level);
CREATE INDEX IF NOT EXISTS idx_german_theme ON source_words_german(theme);
CREATE INDEX IF NOT EXISTS idx_german_word ON source_words_german(word);

CREATE INDEX IF NOT EXISTS idx_english_level ON source_words_english(level);
CREATE INDEX IF NOT EXISTS idx_english_theme ON source_words_english(theme);
CREATE INDEX IF NOT EXISTS idx_english_word ON source_words_english(word);

CREATE INDEX IF NOT EXISTS idx_spanish_level ON source_words_spanish(level);
CREATE INDEX IF NOT EXISTS idx_spanish_theme ON source_words_spanish(theme);

CREATE INDEX IF NOT EXISTS idx_french_level ON source_words_french(level);
CREATE INDEX IF NOT EXISTS idx_french_theme ON source_words_french(theme);

CREATE INDEX IF NOT EXISTS idx_russian_level ON source_words_russian(level);
CREATE INDEX IF NOT EXISTS idx_russian_theme ON source_words_russian(theme);

CREATE INDEX IF NOT EXISTS idx_italian_level ON source_words_italian(level);
CREATE INDEX IF NOT EXISTS idx_italian_theme ON source_words_italian(theme);

-- Translation indexes
CREATE INDEX IF NOT EXISTS idx_russian_trans_source ON target_translations_russian(source_lang, source_word_id);
CREATE INDEX IF NOT EXISTS idx_english_trans_source ON target_translations_english(source_lang, source_word_id);
CREATE INDEX IF NOT EXISTS idx_spanish_trans_source ON target_translations_spanish(source_lang, source_word_id);
CREATE INDEX IF NOT EXISTS idx_german_trans_source ON target_translations_german(source_lang, source_word_id);
CREATE INDEX IF NOT EXISTS idx_french_trans_source ON target_translations_french(source_lang, source_word_id);
CREATE INDEX IF NOT EXISTS idx_italian_trans_source ON target_translations_italian(source_lang, source_word_id);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collections_source_lang ON universal_collections(source_lang);
CREATE INDEX IF NOT EXISTS idx_collections_level ON universal_collections(level);
CREATE INDEX IF NOT EXISTS idx_collections_theme ON universal_collections(theme);
CREATE INDEX IF NOT EXISTS idx_collection_words_collection ON universal_collection_words(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_words_source ON universal_collection_words(source_word_id);

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE source_words_german IS 'German vocabulary for learning (source language)';
COMMENT ON TABLE target_translations_russian IS 'Russian translations for any source language';
COMMENT ON TABLE universal_collections IS 'Language-agnostic collections structure';
COMMENT ON TABLE universal_collection_words IS 'Links collections to source words';
