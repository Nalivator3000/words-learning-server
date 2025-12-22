-- Fix language pair codes: convert full names to ISO codes
-- This fixes the issue where language pairs use full names (German, Russian)
-- instead of ISO codes (de, ru)

UPDATE language_pairs
SET from_lang = CASE from_lang
    WHEN 'German' THEN 'de'
    WHEN 'Russian' THEN 'ru'
    WHEN 'English' THEN 'en'
    WHEN 'Spanish' THEN 'es'
    WHEN 'French' THEN 'fr'
    WHEN 'Italian' THEN 'it'
    WHEN 'Portuguese' THEN 'pt'
    WHEN 'Polish' THEN 'pl'
    WHEN 'Arabic' THEN 'ar'
    WHEN 'Turkish' THEN 'tr'
    WHEN 'Romanian' THEN 'ro'
    WHEN 'Serbian' THEN 'sr'
    WHEN 'Ukrainian' THEN 'uk'
    WHEN 'Swahili' THEN 'sw'
    ELSE from_lang  -- Keep if already in correct format
END,
to_lang = CASE to_lang
    WHEN 'German' THEN 'de'
    WHEN 'Russian' THEN 'ru'
    WHEN 'English' THEN 'en'
    WHEN 'Spanish' THEN 'es'
    WHEN 'French' THEN 'fr'
    WHEN 'Italian' THEN 'it'
    WHEN 'Portuguese' THEN 'pt'
    WHEN 'Polish' THEN 'pl'
    WHEN 'Arabic' THEN 'ar'
    WHEN 'Turkish' THEN 'tr'
    WHEN 'Romanian' THEN 'ro'
    WHEN 'Serbian' THEN 'sr'
    WHEN 'Ukrainian' THEN 'uk'
    WHEN 'Swahili' THEN 'sw'
    ELSE to_lang  -- Keep if already in correct format
END
WHERE from_lang IN ('German', 'Russian', 'English', 'Spanish', 'French', 'Italian', 'Portuguese', 'Polish', 'Arabic', 'Turkish', 'Romanian', 'Serbian', 'Ukrainian', 'Swahili')
   OR to_lang IN ('German', 'Russian', 'English', 'Spanish', 'French', 'Italian', 'Portuguese', 'Polish', 'Arabic', 'Turkish', 'Romanian', 'Serbian', 'Ukrainian', 'Swahili');

-- Verify the fix
SELECT id, user_id, name, from_lang, to_lang, is_active
FROM language_pairs
ORDER BY user_id, id;
