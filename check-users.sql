-- Quick check: words by user
-- Run this in Railway PostgreSQL Data tab

-- 1. Check total users and their word counts
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(w.id) as total_words
FROM users u
LEFT JOIN words w ON w.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY u.id
LIMIT 10;

-- 2. Check for orphaned words (without user_id)
SELECT
    COUNT(*) as orphaned_words_count
FROM words
WHERE user_id IS NULL;

-- 3. Check words per language pair
SELECT
    lp.id as pair_id,
    lp.user_id,
    u.name as user_name,
    lp.name as pair_name,
    COUNT(w.id) as words_count
FROM language_pairs lp
LEFT JOIN words w ON w.language_pair_id = lp.id AND w.user_id = lp.user_id
LEFT JOIN users u ON u.id = lp.user_id
GROUP BY lp.id, lp.user_id, u.name, lp.name
ORDER BY lp.user_id, lp.id
LIMIT 20;
