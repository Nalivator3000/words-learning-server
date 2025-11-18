-- Fix AUTO-PROMOTION for existing words
-- This script updates all words to their correct reviewCycle and status based on their current points

-- Progressive thresholds for each stage:
-- Stage 0: 20 points   → review_1   (1 day)
-- Stage 1: 35 points   → review_3   (3 days)
-- Stage 2: 50 points   → review_7   (7 days)
-- Stage 3: 65 points   → review_14  (14 days)
-- Stage 4: 80 points   → review_30  (30 days)
-- Stage 5: 90 points   → review_60  (60 days)
-- Stage 6: 100 points  → mastered

-- Update words with 100 points to mastered
UPDATE words
SET status = 'mastered',
    reviewCycle = 6,
    nextReviewDate = NULL,
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 100
  AND status != 'mastered';

-- Update words with 90-99 points to review_60 (cycle 5)
UPDATE words
SET status = 'review_60',
    reviewCycle = 5,
    nextReviewDate = CURRENT_TIMESTAMP + INTERVAL '60 days',
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 90 AND correctCount < 100
  AND (reviewCycle < 5 OR status = 'studying');

-- Update words with 80-89 points to review_30 (cycle 4)
UPDATE words
SET status = 'review_30',
    reviewCycle = 4,
    nextReviewDate = CURRENT_TIMESTAMP + INTERVAL '30 days',
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 80 AND correctCount < 90
  AND (reviewCycle < 4 OR status = 'studying');

-- Update words with 65-79 points to review_14 (cycle 3)
UPDATE words
SET status = 'review_14',
    reviewCycle = 3,
    nextReviewDate = CURRENT_TIMESTAMP + INTERVAL '14 days',
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 65 AND correctCount < 80
  AND (reviewCycle < 3 OR status = 'studying');

-- Update words with 50-64 points to review_7 (cycle 2)
UPDATE words
SET status = 'review_7',
    reviewCycle = 2,
    nextReviewDate = CURRENT_TIMESTAMP + INTERVAL '7 days',
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 50 AND correctCount < 65
  AND (reviewCycle < 2 OR status = 'studying');

-- Update words with 35-49 points to review_3 (cycle 1)
UPDATE words
SET status = 'review_3',
    reviewCycle = 1,
    nextReviewDate = CURRENT_TIMESTAMP + INTERVAL '3 days',
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 35 AND correctCount < 50
  AND (reviewCycle < 1 OR status = 'studying');

-- Update words with 20-34 points to review_1 (cycle 0)
UPDATE words
SET status = 'review_1',
    reviewCycle = 0,
    nextReviewDate = CURRENT_TIMESTAMP + INTERVAL '1 day',
    updatedAt = CURRENT_TIMESTAMP
WHERE correctCount >= 20 AND correctCount < 35
  AND (reviewCycle < 0 OR status = 'studying' OR reviewCycle IS NULL);

-- Display summary of changes
SELECT
    'Summary of updates' as info,
    COUNT(CASE WHEN status = 'mastered' THEN 1 END) as mastered_words,
    COUNT(CASE WHEN status = 'review_60' THEN 1 END) as review_60_words,
    COUNT(CASE WHEN status = 'review_30' THEN 1 END) as review_30_words,
    COUNT(CASE WHEN status = 'review_14' THEN 1 END) as review_14_words,
    COUNT(CASE WHEN status = 'review_7' THEN 1 END) as review_7_words,
    COUNT(CASE WHEN status = 'review_3' THEN 1 END) as review_3_words,
    COUNT(CASE WHEN status = 'review_1' THEN 1 END) as review_1_words,
    COUNT(CASE WHEN status = 'studying' THEN 1 END) as studying_words
FROM words;
