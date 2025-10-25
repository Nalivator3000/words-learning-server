-- ========================================
-- FluentFlow Test Data Seeding Script
-- ========================================
-- Purpose: Populate database with realistic test data for screenshots
-- Time: ~30 seconds to execute
-- Result: Test account with 50 words, reviews, achievements, 7-day streak
--
-- USAGE:
-- 1. Connect to Railway PostgreSQL
-- 2. Run this script
-- 3. Login with: demo@fluentflow.app / DemoPassword123!
-- ========================================

-- Clean up existing test data (optional)
-- DELETE FROM user_achievements WHERE user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app');
-- DELETE FROM words WHERE user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app');
-- DELETE FROM users WHERE email = 'demo@fluentflow.app';

-- ========================================
-- 1. CREATE TEST USER
-- ========================================
INSERT INTO users (email, password, username, created_at, last_activity_date, current_streak, longest_streak, xp, level)
VALUES (
  'demo@fluentflow.app',
  '$2a$10$XYZ...', -- Replace with actual bcrypt hash of 'DemoPassword123!'
  'Demo User',
  NOW() - INTERVAL '14 days',
  CURRENT_DATE,
  7,
  10,
  1650,
  6
)
ON CONFLICT (email) DO UPDATE
SET
  last_activity_date = CURRENT_DATE,
  current_streak = 7,
  longest_streak = GREATEST(users.longest_streak, 10),
  xp = 1650,
  level = 6;

-- ========================================
-- 2. INSERT GERMAN WORDS (50 common words)
-- ========================================
INSERT INTO words (user_id, german, english, example, created_at, difficulty, next_review_date, review_count, status)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  german,
  english,
  example,
  NOW() - INTERVAL '1 day' * (ROW_NUMBER() OVER () / 5),
  CASE
    WHEN RANDOM() < 0.5 THEN 2  -- Good
    WHEN RANDOM() < 0.8 THEN 3  -- Easy
    WHEN RANDOM() < 0.95 THEN 1 -- Hard
    ELSE 0                       -- Again
  END,
  CASE
    WHEN ROW_NUMBER() OVER () <= 20 THEN NOW() - INTERVAL '1 hour'  -- Due for review
    WHEN ROW_NUMBER() OVER () <= 35 THEN NOW() + INTERVAL '1 day'   -- Review tomorrow
    WHEN ROW_NUMBER() OVER () <= 45 THEN NOW() + INTERVAL '3 days'  -- Review in 3 days
    ELSE NOW() + INTERVAL '7 days'                                   -- Review in a week
  END,
  FLOOR(RANDOM() * 5)::INT,
  CASE
    WHEN ROW_NUMBER() OVER () <= 12 THEN 'mastered'
    WHEN ROW_NUMBER() OVER () <= 40 THEN 'review'
    ELSE 'learning'
  END
FROM (VALUES
  ('der Apfel', 'apple', 'Ich esse einen Apfel'),
  ('das Buch', 'book', 'Ich lese ein Buch'),
  ('die Katze', 'cat', 'Die Katze ist süß'),
  ('der Hund', 'dog', 'Der Hund bellt laut'),
  ('das Haus', 'house', 'Das Haus ist groß'),
  ('die Schule', 'school', 'Ich gehe zur Schule'),
  ('der Freund', 'friend', 'Mein Freund heißt Max'),
  ('die Familie', 'family', 'Meine Familie ist wichtig'),
  ('das Wasser', 'water', 'Ich trinke Wasser'),
  ('das Essen', 'food', 'Das Essen schmeckt gut'),
  ('die Zeit', 'time', 'Die Zeit vergeht schnell'),
  ('der Tag', 'day', 'Heute ist ein schöner Tag'),
  ('die Nacht', 'night', 'Die Nacht ist dunkel'),
  ('das Jahr', 'year', 'Dieses Jahr ist toll'),
  ('der Monat', 'month', 'Nächster Monat ist Juli'),
  ('die Woche', 'week', 'Diese Woche arbeite ich viel'),
  ('der Lehrer', 'teacher', 'Der Lehrer erklärt die Lektion'),
  ('der Student', 'student', 'Der Student lernt fleißig'),
  ('die Arbeit', 'work', 'Die Arbeit ist anstrengend'),
  ('das Auto', 'car', 'Das Auto ist schnell'),
  ('der Zug', 'train', 'Der Zug fährt pünktlich ab'),
  ('das Flugzeug', 'airplane', 'Das Flugzeug fliegt hoch'),
  ('die Stadt', 'city', 'Die Stadt ist lebendig'),
  ('das Land', 'country', 'Deutschland ist ein schönes Land'),
  ('der Berg', 'mountain', 'Der Berg ist hoch'),
  ('das Meer', 'sea', 'Das Meer ist blau'),
  ('der Himmel', 'sky', 'Der Himmel ist klar'),
  ('die Sonne', 'sun', 'Die Sonne scheint hell'),
  ('der Mond', 'moon', 'Der Mond leuchtet nachts'),
  ('der Stern', 'star', 'Die Sterne funkeln'),
  ('die Blume', 'flower', 'Die Blume duftet schön'),
  ('der Baum', 'tree', 'Der Baum ist alt'),
  ('das Gras', 'grass', 'Das Gras ist grün'),
  ('die Farbe', 'color', 'Meine Lieblingsfarbe ist blau'),
  ('rot', 'red', 'Die Rose ist rot'),
  ('blau', 'blue', 'Der Himmel ist blau'),
  ('grün', 'green', 'Das Gras ist grün'),
  ('gelb', 'yellow', 'Die Sonne ist gelb'),
  ('schwarz', 'black', 'Die Nacht ist schwarz'),
  ('weiß', 'white', 'Der Schnee ist weiß'),
  ('groß', 'big', 'Das Haus ist groß'),
  ('klein', 'small', 'Die Maus ist klein'),
  ('gut', 'good', 'Das Wetter ist gut'),
  ('schlecht', 'bad', 'Das Essen ist schlecht'),
  ('schön', 'beautiful', 'Die Blume ist schön'),
  ('hässlich', 'ugly', 'Das Bild ist hässlich'),
  ('alt', 'old', 'Der Mann ist alt'),
  ('jung', 'young', 'Das Kind ist jung'),
  ('neu', 'new', 'Das Auto ist neu'),
  ('schnell', 'fast', 'Der Zug ist schnell')
) AS word_data(german, english, example);

-- ========================================
-- 3. CREATE DAILY ACTIVITY (7-day streak)
-- ========================================
INSERT INTO daily_activity (user_id, date, words_learned, reviews_completed, xp_earned, study_time_minutes)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  CURRENT_DATE - INTERVAL '1 day' * series,
  5 + FLOOR(RANDOM() * 8)::INT,  -- 5-12 words learned per day
  10 + FLOOR(RANDOM() * 15)::INT, -- 10-24 reviews per day
  80 + FLOOR(RANDOM() * 100)::INT, -- 80-180 XP per day
  15 + FLOOR(RANDOM() * 30)::INT   -- 15-44 minutes study time
FROM generate_series(0, 6) AS series;

-- ========================================
-- 4. CREATE STUDY SESSIONS
-- ========================================
INSERT INTO study_sessions (user_id, session_date, words_studied, correct_answers, accuracy, xp_earned, duration_seconds)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  NOW() - INTERVAL '1 day' * (series / 3),
  10,
  7 + FLOOR(RANDOM() * 3)::INT,  -- 7-9 correct out of 10
  0.70 + RANDOM() * 0.25,         -- 70-95% accuracy
  100,
  300 + FLOOR(RANDOM() * 300)::INT -- 5-10 minutes per session
FROM generate_series(0, 14) AS series;

-- ========================================
-- 5. CREATE REVIEW SESSIONS
-- ========================================
INSERT INTO review_sessions (user_id, session_date, reviews_completed, correct_reviews, accuracy, xp_earned, duration_seconds)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  NOW() - INTERVAL '12 hours' * series,
  15,
  12 + FLOOR(RANDOM() * 3)::INT,  -- 12-14 correct out of 15
  0.80 + RANDOM() * 0.18,          -- 80-98% accuracy
  75,
  450 + FLOOR(RANDOM() * 250)::INT -- 7-11 minutes per session
FROM generate_series(0, 19) AS series;

-- ========================================
-- 6. UNLOCK ACHIEVEMENTS
-- ========================================
-- Note: Replace achievement IDs with actual IDs from your achievements table
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  achievement_id,
  unlocked_at,
  100
FROM (VALUES
  (1, NOW() - INTERVAL '13 days'),  -- First Word Learned
  (2, NOW() - INTERVAL '12 days'),  -- Getting Started (10 words)
  (3, NOW() - INTERVAL '8 days'),   -- Word Master (50 words)
  (4, NOW() - INTERVAL '4 days'),   -- Daily Dedication (3-day streak)
  (5, NOW() - INTERVAL '1 day'),    -- Week Warrior (7-day streak)
  (6, NOW() - INTERVAL '3 days'),   -- XP Hunter (1000 XP)
  (7, NOW() - INTERVAL '2 days')    -- Level Up (Level 5)
) AS achievements(achievement_id, unlocked_at)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- ========================================
-- 7. SET DAILY GOAL PROGRESS
-- ========================================
INSERT INTO daily_goals (user_id, date, goal_type, goal_value, current_progress, completed)
VALUES (
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  CURRENT_DATE,
  'words_learned',
  20,
  14,  -- 70% complete (14/20)
  false
)
ON CONFLICT (user_id, date, goal_type) DO UPDATE
SET current_progress = 14, completed = false;

-- ========================================
-- 8. GENERATE XP LOG ENTRIES
-- ========================================
INSERT INTO xp_log (user_id, xp_gained, source, created_at)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  xp_amount,
  source_type,
  NOW() - INTERVAL '1 hour' * series
FROM (VALUES
  (100, 'study_session'),
  (75, 'review_session'),
  (50, 'achievement_unlock'),
  (100, 'study_session'),
  (75, 'review_session'),
  (100, 'study_session'),
  (50, 'daily_streak'),
  (75, 'review_session'),
  (100, 'study_session'),
  (50, 'achievement_unlock')
) AS xp_data(xp_amount, source_type),
generate_series(1, 10) AS series;

-- ========================================
-- 9. UPDATE USER STATISTICS
-- ========================================
UPDATE users
SET
  total_words = (SELECT COUNT(*) FROM words WHERE user_id = users.id AND email = 'demo@fluentflow.app'),
  words_mastered = (SELECT COUNT(*) FROM words WHERE user_id = users.id AND status = 'mastered'),
  total_study_sessions = 15,
  total_review_sessions = 20,
  total_xp = 1650,
  level = 6,
  last_activity_date = CURRENT_DATE,
  current_streak = 7,
  longest_streak = 10
WHERE email = 'demo@fluentflow.app';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify data was created successfully:

-- Check user stats
SELECT
  email,
  username,
  level,
  xp,
  current_streak,
  longest_streak,
  total_words,
  words_mastered
FROM users
WHERE email = 'demo@fluentflow.app';

-- Check word distribution
SELECT
  status,
  COUNT(*) as count
FROM words
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app')
GROUP BY status;

-- Check achievements
SELECT
  COUNT(*) as achievements_unlocked
FROM user_achievements
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app');

-- Check daily activity (should show 7 days)
SELECT
  date,
  words_learned,
  reviews_completed,
  xp_earned
FROM daily_activity
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app')
ORDER BY date DESC
LIMIT 7;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- After running this script, the demo account should have:
-- ✅ 50 German words (12 mastered, 28 under review, 10 learning)
-- ✅ 1,650 XP (Level 6)
-- ✅ 7-day streak (10 longest)
-- ✅ 15 study sessions completed
-- ✅ 20 review sessions completed
-- ✅ 7 achievements unlocked
-- ✅ Daily goal: 14/20 words (70% complete)
-- ✅ 7 days of activity data (for heatmap)
--
-- 🎉 Perfect for Google Play Store screenshots!
-- ========================================
