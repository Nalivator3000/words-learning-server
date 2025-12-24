-- Create translation tables for all target languages

-- English translations (en→de: English speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_english (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_en TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_english_source ON target_translations_english(source_lang, source_word_id);

-- Romanian translations (ro→de: Romanian speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_romanian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_ro TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_romanian_source ON target_translations_romanian(source_lang, source_word_id);

-- Serbian translations (sr→de: Serbian speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_serbian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_sr TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_serbian_source ON target_translations_serbian(source_lang, source_word_id);

-- Ukrainian translations (uk→de: Ukrainian speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_ukrainian (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_uk TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_ukrainian_source ON target_translations_ukrainian(source_lang, source_word_id);

-- Turkish translations (tr→de: Turkish speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_turkish (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_tr TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_turkish_source ON target_translations_turkish(source_lang, source_word_id);

-- Arabic translations (ar→de: Arabic speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_arabic (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_ar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_arabic_source ON target_translations_arabic(source_lang, source_word_id);

-- Swahili translations (sw→de: Swahili speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_swahili (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_sw TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_swahili_source ON target_translations_swahili(source_lang, source_word_id);

-- Polish translations (pl→de: Polish speakers learning German)
CREATE TABLE IF NOT EXISTS target_translations_polish (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'de',
  source_word_id INTEGER NOT NULL REFERENCES source_words_german(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  example_pl TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_lang, source_word_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_polish_source ON target_translations_polish(source_lang, source_word_id);

-- Comment for documentation
COMMENT ON TABLE target_translations_english IS 'English translations for German source words (en→de language pair)';
COMMENT ON TABLE target_translations_romanian IS 'Romanian translations for German source words (ro→de language pair)';
COMMENT ON TABLE target_translations_serbian IS 'Serbian translations for German source words (sr→de language pair)';
COMMENT ON TABLE target_translations_ukrainian IS 'Ukrainian translations for German source words (uk→de language pair)';
COMMENT ON TABLE target_translations_turkish IS 'Turkish translations for German source words (tr→de language pair)';
COMMENT ON TABLE target_translations_arabic IS 'Arabic translations for German source words (ar→de language pair)';
COMMENT ON TABLE target_translations_swahili IS 'Swahili translations for German source words (sw→de language pair)';
COMMENT ON TABLE target_translations_polish IS 'Polish translations for German source words (pl→de language pair)';
