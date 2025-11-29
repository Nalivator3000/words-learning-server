-- Update daily goals from 5 to 20 for all existing users
-- This migration updates the words_goal for users who still have the old default value of 5

UPDATE user_gamification
SET words_goal = 20
WHERE words_goal = 5;

-- Show results
SELECT
    COUNT(*) as updated_users,
    'Updated words_goal from 5 to 20' as description
FROM user_gamification
WHERE words_goal = 20;
