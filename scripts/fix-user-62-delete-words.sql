-- SQL Script to delete all words for user 62 (English → Spanish)
-- This fixes the issue where Russian translations appear in quiz instead of Spanish

-- 1. Check current state (run this first)
SELECT
  uwp.language_pair_id,
  COUNT(*) as word_count,
  array_agg(DISTINCT uwp.status) as statuses
FROM user_word_progress uwp
WHERE uwp.user_id = 62
GROUP BY uwp.language_pair_id;

-- 2. Check translation languages for pair 66
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN tt_ru.translation IS NOT NULL AND tt_es.translation IS NULL THEN 1 END) as russian_only,
  COUNT(CASE WHEN tt_es.translation IS NOT NULL AND tt_ru.translation IS NULL THEN 1 END) as spanish_only,
  COUNT(CASE WHEN tt_es.translation IS NOT NULL AND tt_ru.translation IS NOT NULL THEN 1 END) as both
FROM user_word_progress uwp
LEFT JOIN target_translations_spanish_from_en tt_es ON tt_es.source_word_id = uwp.source_word_id
LEFT JOIN target_translations_russian_from_en tt_ru ON tt_ru.source_word_id = uwp.source_word_id
WHERE uwp.user_id = 62 AND uwp.language_pair_id = 66;

-- 3. DELETE ALL WORDS for user 62, language pair 66
-- UNCOMMENT AND RUN THIS AFTER CHECKING THE ABOVE:
-- DELETE FROM user_word_progress WHERE user_id = 62 AND language_pair_id = 66;

-- 4. Verify deletion (should return 0)
-- SELECT COUNT(*) FROM user_word_progress WHERE user_id = 62 AND language_pair_id = 66;
