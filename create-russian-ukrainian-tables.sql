-- Create Russian source words table
CREATE TABLE IF NOT EXISTS source_words_russian (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Ukrainian source words table
CREATE TABLE IF NOT EXISTS source_words_ukrainian (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample Russian words (A1 level)
INSERT INTO source_words_russian (word, level) VALUES
('привет', 'A1'), ('да', 'A1'), ('нет', 'A1'), ('спасибо', 'A1'), ('хорошо', 'A1'),
('день', 'A1'), ('ночь', 'A1'), ('я', 'A1'), ('ты', 'A1'), ('быть', 'A1')
ON CONFLICT (word) DO NOTHING;

-- Insert sample Ukrainian words (A1 level)
INSERT INTO source_words_ukrainian (word, level) VALUES
('привіт', 'A1'), ('так', 'A1'), ('ні', 'A1'), ('дякую', 'A1'), ('добре', 'A1'),
('день', 'A1'), ('ніч', 'A1'), ('я', 'A1'), ('ти', 'A1'), ('бути', 'A1')
ON CONFLICT (word) DO NOTHING;

-- Show results
SELECT 'Russian words:' as status, COUNT(*) as count FROM source_words_russian
UNION ALL
SELECT 'Ukrainian words:' as status, COUNT(*) as count FROM source_words_ukrainian;
