-- Add daily XP goal and daily tasks goal to user_profiles
-- These goals are calculated based on daily_goal_minutes:
-- daily_xp_goal = daily_goal_minutes * 10
-- daily_tasks_goal = daily_goal_minutes * 10
-- daily_word_goal is fixed at 5 words/day for all users

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS daily_xp_goal INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS daily_tasks_goal INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS daily_word_goal INTEGER DEFAULT 5;

-- Update existing users to have goals based on their current daily_goal_minutes
UPDATE user_profiles
SET
    daily_xp_goal = COALESCE(daily_goal_minutes, 15) * 10,
    daily_tasks_goal = COALESCE(daily_goal_minutes, 15) * 10,
    daily_word_goal = 5
WHERE daily_xp_goal IS NULL OR daily_tasks_goal IS NULL OR daily_word_goal IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.daily_goal_minutes IS 'Daily study time goal in minutes (5, 10, 15, 20, 30)';
COMMENT ON COLUMN user_profiles.daily_xp_goal IS 'Daily XP/experience goal (calculated as daily_goal_minutes * 10)';
COMMENT ON COLUMN user_profiles.daily_tasks_goal IS 'Daily tasks/challenges goal (calculated as daily_goal_minutes * 10)';
COMMENT ON COLUMN user_profiles.daily_word_goal IS 'Daily word learning goal (fixed at 5 words for all users)';
