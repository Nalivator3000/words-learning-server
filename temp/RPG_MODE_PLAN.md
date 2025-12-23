# RPG Mode Implementation Plan

## Overview
RPG режим - это геймификация процесса обучения, где пользователь постепенно разблокирует новые упражнения, функции и контент по мере повышения уровня.

## Phase 1: Core Infrastructure

### 1.1 Database Schema
```sql
-- RPG mode user settings
CREATE TABLE rpg_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    unlocked_exercises TEXT[] DEFAULT ARRAY['multiple_choice'],
    unlocked_features TEXT[] DEFAULT ARRAY['home', 'study'],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- RPG level requirements
CREATE TABLE rpg_levels (
    level INTEGER PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    unlocks_exercises TEXT[],
    unlocks_features TEXT[],
    reward_message TEXT,
    UNIQUE(level)
);
```

### 1.2 Test User Creation
- **Username**: `rpg_tester`
- **Password**: `rpg123!test`
- **Email**: `rpg_test@lexibooster.com`
- **Language pair**: German - Russian (or any existing pair)
- **RPG mode**: Enabled by default
- **Starting level**: 1
- **Starting XP**: 0

### 1.3 RPG Configuration System
```javascript
// RPG level progression table
const RPG_LEVELS = {
    1: {
        xp_required: 0,
        unlocks_exercises: ['multiple_choice'],
        unlocks_features: ['home', 'study'],
        name: 'Beginner',
        description: 'Your journey begins'
    },
    2: {
        xp_required: 100,
        unlocks_exercises: ['reverse_multiple_choice'],
        unlocks_features: ['stats_basic'],
        name: 'Novice',
        description: 'Learning the basics'
    },
    3: {
        xp_required: 250,
        unlocks_exercises: ['word_building'],
        unlocks_features: ['review'],
        name: 'Apprentice',
        description: 'Building your skills'
    },
    4: {
        xp_required: 500,
        unlocks_exercises: ['typing'],
        unlocks_features: ['stats_full', 'achievements'],
        name: 'Adept',
        description: 'Mastering the fundamentals'
    },
    5: {
        xp_required: 1000,
        unlocks_exercises: ['complex'],
        unlocks_features: ['leaderboard', 'friends'],
        name: 'Expert',
        description: 'Becoming proficient'
    },
    6: {
        xp_required: 2000,
        unlocks_features: ['leagues', 'weekly_challenges'],
        name: 'Master',
        description: 'Competing with the best'
    },
    7: {
        xp_required: 4000,
        unlocks_features: ['duels', 'personal_rating'],
        name: 'Grandmaster',
        description: 'Elite level mastery'
    },
    8: {
        xp_required: 8000,
        unlocks_features: ['all'],
        name: 'Legend',
        description: 'All features unlocked'
    }
};
```

## Phase 2: Backend Implementation

### 2.1 RPG API Endpoints
```javascript
// GET /api/rpg/status/:userId
// Returns RPG mode status, level, XP, unlocked content

// POST /api/rpg/enable/:userId
// Enables RPG mode for user (admin only)

// POST /api/rpg/add-xp
// { userId, amount, source }
// Adds XP and checks for level ups

// GET /api/rpg/unlocks/:userId
// Returns all unlocked exercises and features

// GET /api/rpg/next-unlock/:userId
// Returns info about next level and what it unlocks
```

### 2.2 XP Award System Integration
Integrate XP awards into existing quiz completion:
- Award XP after each quiz completion
- Check for level up after XP award
- Show unlock notifications when leveling up
- Update user's unlocked content list

### 2.3 Access Control Middleware
```javascript
// Middleware to check if feature/exercise is unlocked
async function checkRPGAccess(req, res, next) {
    const { userId } = req.user;
    const { feature, exercise } = req.body;

    const rpgStatus = await getRPGStatus(userId);

    if (!rpgStatus.enabled) {
        return next(); // Not in RPG mode, allow all
    }

    if (feature && !rpgStatus.unlocked_features.includes(feature)) {
        return res.status(403).json({
            error: 'Feature locked',
            required_level: getRequiredLevel(feature)
        });
    }

    if (exercise && !rpgStatus.unlocked_exercises.includes(exercise)) {
        return res.status(403).json({
            error: 'Exercise locked',
            required_level: getRequiredLevel(exercise)
        });
    }

    next();
}
```

## Phase 3: Frontend Implementation

### 3.1 RPG Status Display
**Location**: Header or dedicated RPG panel

**Components**:
- Current level badge
- XP progress bar to next level
- Level name/title display
- "Next unlock at level X" indicator

### 3.2 Locked Content UI
**Study Page** (Level 1):
```
┌─────────────────────────────────┐
│ 📚 Choose Exercise Type         │
├─────────────────────────────────┤
│ ✅ Multiple Choice (Native→Target) │  <- UNLOCKED
│ 🔒 Reverse Multiple Choice      │  <- Reach level 2
│ 🔒 Word Building               │  <- Reach level 3
│ 🔒 Typing                      │  <- Reach level 4
│ 🔒 Complex Mode                │  <- Reach level 5
└─────────────────────────────────┘
```

**Navigation Buttons**:
```
┌──────────────────────────────────────┐
│ ✅ Home                              │
│ ✅ Study                             │
│ 🔒 Review (Level 3)                  │
│ 🔒 Stats (Level 2)                   │
│ 🔒 Achievements (Level 4)            │
│ 🔒 Leaderboard (Level 5)             │
│ 🔒 Friends (Level 5)                 │
│ 🔒 Leagues (Level 6)                 │
│ 🔒 Challenges (Level 6)              │
│ 🔒 Duels (Level 7)                   │
└──────────────────────────────────────┘
```

### 3.3 Level Up Animation
```javascript
function showLevelUpModal(newLevel, unlocks) {
    // Animated modal with:
    // - Level up badge animation
    // - New level name/title
    // - List of newly unlocked content
    // - Confetti/celebration effect
    // - "Continue" button
}
```

### 3.4 RPG Dashboard Widget
```html
<div class="rpg-progress-widget">
    <div class="rpg-level-badge">
        <span class="level-number">5</span>
        <span class="level-name">Expert</span>
    </div>

    <div class="xp-progress">
        <div class="xp-bar" style="width: 60%"></div>
        <span class="xp-text">600 / 1000 XP</span>
    </div>

    <div class="next-unlock">
        <span>🎁 Next unlock at level 6:</span>
        <span>Leagues & Weekly Challenges</span>
    </div>
</div>
```

## Phase 4: User Experience

### 4.1 First Login Experience (Level 1)
1. Welcome modal explaining RPG mode
2. Show only available content (Multiple Choice + Home/Study)
3. Highlight locked features with "Level up to unlock" tooltips
4. Tutorial arrows pointing to available actions

### 4.2 Progression Flow
```
Level 1 → Complete quizzes → Earn XP → Level 2
    ↓                              ↓
Multiple Choice              Reverse Multiple + Stats unlocked
    ↓                              ↓
Continue learning           New options available
    ↓                              ↓
Level 3 → Word Building + Review unlocked
    ↓
... and so on
```

### 4.3 Motivation Features
- Daily XP goals tied to RPG progression
- "Days until next level" estimate
- Unlock preview: "3 more exercises to unlock!"
- Achievement badges for reaching certain levels

## Phase 5: Implementation Steps

### Step 1: Database Setup
- [ ] Create `rpg_users` table
- [ ] Create `rpg_levels` table
- [ ] Seed `rpg_levels` with progression data
- [ ] Create test user `rpg_tester`
- [ ] Insert RPG user record for test user

### Step 2: Backend API
- [ ] Implement RPG status endpoint
- [ ] Implement XP award system
- [ ] Implement level up logic
- [ ] Implement access control middleware
- [ ] Add RPG checks to quiz completion
- [ ] Add RPG checks to feature access

### Step 3: Frontend Core
- [ ] Create RPG status component
- [ ] Add level/XP display to header
- [ ] Implement locked content UI
- [ ] Create lock icons and tooltips
- [ ] Add level requirements to navigation

### Step 4: Frontend Features
- [ ] Lock/unlock exercise buttons based on level
- [ ] Lock/unlock navigation items based on level
- [ ] Show "Locked" overlays on inaccessible features
- [ ] Implement level up modal/animation
- [ ] Add XP progress bar

### Step 5: Testing
- [ ] Test progression from level 1 to 8
- [ ] Test XP award after quiz completion
- [ ] Test locked content blocking
- [ ] Test unlock notifications
- [ ] Test with non-RPG users (should have full access)
- [ ] Test RPG dashboard widgets

### Step 6: Polish
- [ ] Add unlock animations
- [ ] Add celebration effects for level ups
- [ ] Add sound effects (optional)
- [ ] Add "Next unlock preview" panel
- [ ] Add RPG mode toggle (for admin)

## Phase 6: Future Enhancements

### 6.1 RPG Plus Features
- Custom skill trees
- Multiple progression paths
- Prestige system (reset level for bonuses)
- Special challenges to unlock secret content
- RPG-specific achievements

### 6.2 Social Features
- Compare levels with friends
- Level-based matchmaking for duels
- Level requirements for leagues
- "Mentor" system (high level helps low level)

### 6.3 Monetization (Optional)
- XP boosters
- Level skip tokens
- Cosmetic level badges
- Early access to locked features

## Technical Notes

### XP Calculation
```javascript
// Base XP per quiz
const BASE_XP = {
    multiple_choice: 5,
    reverse_multiple_choice: 5,
    word_building: 8,
    typing: 10,
    complex: 15
};

// Bonus XP modifiers
const BONUS_MODIFIERS = {
    perfect_score: 1.5,      // 100% correct
    streak_bonus: 0.1,       // +10% per day streak (max 50%)
    first_time_word: 0.2     // +20% for first time seeing word
};

// Final XP = BASE_XP * (1 + bonuses) * difficulty_multiplier
```

### Level Calculation
```javascript
function calculateLevel(totalXP) {
    let level = 1;
    for (let i = 2; i <= 8; i++) {
        if (totalXP >= RPG_LEVELS[i].xp_required) {
            level = i;
        } else {
            break;
        }
    }
    return level;
}

function getXPForNextLevel(currentLevel) {
    if (currentLevel >= 8) return null; // Max level
    return RPG_LEVELS[currentLevel + 1].xp_required;
}
```

### Access Control Logic
```javascript
function hasAccess(userLevel, requiredFeature) {
    for (let level = 1; level <= userLevel; level++) {
        const unlocks = RPG_LEVELS[level].unlocks_features || [];
        if (unlocks.includes(requiredFeature)) {
            return true;
        }
    }
    return false;
}
```

## Success Metrics

### Engagement Metrics
- Average time to reach each level
- Retention rate of RPG vs non-RPG users
- Daily active users (RPG mode)
- Completion rate of unlocked exercises

### Progression Metrics
- XP earned per day
- Quizzes completed per level
- Time spent on platform per level
- Drop-off points (which level do users stop?)

### Feature Adoption
- Usage of newly unlocked features
- Most popular exercises at each level
- Unlock anticipation (do users grind to unlock?)

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Enable for `rpg_tester` user only
- Test all 8 levels manually
- Fix bugs and polish UX

### Phase 2: Beta Testing (Week 2-3)
- Enable for 10-20 beta users
- Collect feedback
- Adjust XP requirements and unlock order

### Phase 3: Opt-in Launch (Week 4)
- Add "Enable RPG Mode" option in settings
- Announce feature to all users
- Monitor adoption and engagement

### Phase 4: Full Launch (Week 5+)
- Make RPG mode default for new users
- Offer conversion for existing users
- Iterate based on metrics

## Notes
- RPG mode should be **optional** - existing users keep full access
- New users should be **asked** if they want RPG mode or full access
- XP requirements can be **adjusted** based on user feedback
- Unlock order can be **changed** if certain exercises are more valuable
- Consider **seasonal events** with bonus XP
- Add **daily login bonuses** to encourage consistency
