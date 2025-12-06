-- Fix word stages based on correctCount (points)
-- SRS thresholds: 20 → 35 → 50 → 65 → 80 → 90 → 100
-- Intervals: 1, 3, 7, 14, 30, 60, 120 days

-- First, let's see the current state
SELECT 
    status, 
    COUNT(*) as count,
    AVG(correctcount) as avg_points,
    MIN(correctcount) as min_points,
    MAX(correctcount) as max_points
FROM words 
WHERE user_id = 1
GROUP BY status
ORDER BY status;

-- Show words that might be in wrong stage
SELECT id, word, correctcount, status, reviewcycle, nextreviewdate
FROM words
WHERE user_id = 1
AND (
    -- Words with 20+ points still in studying
    (correctcount >= 20 AND status = 'studying')
    OR
    -- Words in review_7 or review_30 but should be in different stage
    (correctcount >= 35 AND status = 'review_1')
    OR (correctcount >= 50 AND status IN ('review_1', 'review_3'))
    OR (correctcount >= 65 AND status IN ('review_1', 'review_3', 'review_7'))
    OR (correctcount >= 80 AND status IN ('review_1', 'review_3', 'review_7', 'review_14'))
    OR (correctcount >= 90 AND status IN ('review_1', 'review_3', 'review_7', 'review_14', 'review_30'))
    OR (correctcount >= 100 AND status != 'mastered')
)
ORDER BY correctcount DESC
LIMIT 50;
