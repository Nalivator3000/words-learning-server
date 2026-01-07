-- Script to delete all words for user 62 (English → Spanish learner)
-- This will allow them to import fresh Spanish translations

-- First, let's see what we have
SELECT
  uwp.language_pair_id,
  COUNT(*) as word_count,
  array_agg(DISTINCT uwp.status) as statuses
FROM user_word_progress uwp
WHERE uwp.user_id = 62
GROUP BY uwp.language_pair_id;

-- Now delete all words for user 62, language pair 66 (en→es)
-- UNCOMMENT THE FOLLOWING LINE TO EXECUTE:
-- DELETE FROM user_word_progress WHERE user_id = 62 AND language_pair_id = 66;

-- Verify deletion (should return 0)
-- SELECT COUNT(*) FROM user_word_progress WHERE user_id = 62 AND language_pair_id = 66;
