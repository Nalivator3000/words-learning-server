-- Fix language pair codes: convert full names to ISO codes
-- This fixes the issue where language pairs use full names (German, Russian)
-- instead of ISO codes (de, ru)
-- Handles both capitalized (German) and lowercase (german) variants

UPDATE language_pairs
SET from_lang = CASE LOWER(from_lang)
    WHEN 'german' THEN 'de'
    WHEN 'russian' THEN 'ru'
    WHEN 'english' THEN 'en'
    WHEN 'spanish' THEN 'es'
    WHEN 'french' THEN 'fr'
    WHEN 'italian' THEN 'it'
    WHEN 'portuguese' THEN 'pt'
    WHEN 'polish' THEN 'pl'
    WHEN 'arabic' THEN 'ar'
    WHEN 'turkish' THEN 'tr'
    WHEN 'romanian' THEN 'ro'
    WHEN 'serbian' THEN 'sr'
    WHEN 'ukrainian' THEN 'uk'
    WHEN 'swahili' THEN 'sw'
    WHEN 'chinese' THEN 'zh'
    WHEN 'japanese' THEN 'ja'
    WHEN 'korean' THEN 'ko'
    WHEN 'hindi' THEN 'hi'
    ELSE from_lang  -- Keep if already in correct format
END,
to_lang = CASE LOWER(to_lang)
    WHEN 'german' THEN 'de'
    WHEN 'russian' THEN 'ru'
    WHEN 'english' THEN 'en'
    WHEN 'spanish' THEN 'es'
    WHEN 'french' THEN 'fr'
    WHEN 'italian' THEN 'it'
    WHEN 'portuguese' THEN 'pt'
    WHEN 'polish' THEN 'pl'
    WHEN 'arabic' THEN 'ar'
    WHEN 'turkish' THEN 'tr'
    WHEN 'romanian' THEN 'ro'
    WHEN 'serbian' THEN 'sr'
    WHEN 'ukrainian' THEN 'uk'
    WHEN 'swahili' THEN 'sw'
    WHEN 'chinese' THEN 'zh'
    WHEN 'japanese' THEN 'ja'
    WHEN 'korean' THEN 'ko'
    WHEN 'hindi' THEN 'hi'
    ELSE to_lang  -- Keep if already in correct format
END
WHERE LOWER(from_lang) IN ('german', 'russian', 'english', 'spanish', 'french', 'italian', 'portuguese', 'polish', 'arabic', 'turkish', 'romanian', 'serbian', 'ukrainian', 'swahili', 'chinese', 'japanese', 'korean', 'hindi')
   OR LOWER(to_lang) IN ('german', 'russian', 'english', 'spanish', 'french', 'italian', 'portuguese', 'polish', 'arabic', 'turkish', 'romanian', 'serbian', 'ukrainian', 'swahili', 'chinese', 'japanese', 'korean', 'hindi');

-- Verify the fix
SELECT id, user_id, name, from_lang, to_lang, is_active
FROM language_pairs
ORDER BY user_id, id;
