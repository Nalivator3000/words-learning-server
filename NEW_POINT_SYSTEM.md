# New Progressive Point & XP System

## Overview
The new system uses **progressive thresholds** instead of resetting to 0 after each cycle. Words accumulate points from 0 to 100 across all review stages, making progress feel more rewarding and continuous.

## Points & XP (Equal Values)

### Points Earned Per Exercise Type
- **Multiple Choice** (4 options): **2 points/XP**
- **Word Building** (assemble letters): **4 points/XP**
- **Typing** (write the word): **7 points/XP**

**XP = Points earned** (they are the same value)

## Progressive Thresholds System

Words progress through 7 stages with cumulative point thresholds:

| Stage | Threshold | Points Needed | Review Interval | Description |
|-------|-----------|---------------|-----------------|-------------|
| 1 | 20 points | 20 | 1 day | Initial learning (most effort) |
| 2 | 35 points | +15 | 3 days | Early consolidation |
| 3 | 50 points | +15 | 7 days | Short-term memory |
| 4 | 65 points | +15 | 14 days | Medium-term memory |
| 5 | 80 points | +15 | 30 days | Long-term memory |
| 6 | 90 points | +10 | 60 days | Near mastery |
| 7 | 100 points | +10 | 120 days | **Mastered** |

### Key Features

1. **Progressive Difficulty**: Early stages require more points (20 for stage 1), later stages require fewer points (10 for last two stages)

2. **No Reset**: Points accumulate continuously - users don't lose progress when advancing to the next review stage

3. **Clear Goals**: At any point, users know exactly how many points they need to reach the next milestone

4. **Faster Initial Progress**: With 20 points for the first stage:
   - 10 multiple choice = 20 points ✓
   - 5 word building = 20 points ✓
   - 3 typing exercises = 21 points ✓

5. **Mastery at 100 Points**: After completing all 7 review cycles and reaching 100 points total, the word is marked as **"mastered"**

## Example Progress Journey

### Scenario: Learning the word "Hallo"

**Stage 1 - Initial Learning (0 → 20 points)**
- Answer 5 multiple choice questions: 5 × 2 = 10 points
- Build the word 2 times: 2 × 4 = 8 points
- Type it once: 1 × 7 = 7 points
- **Total: 25 points** → Advances to Review (1 day)
- **XP Earned: 25 XP**

**Stage 2 - Review after 1 day (25 → 35 points)**
- Need 10 more points to reach 35
- Answer 3 multiple choice: 3 × 2 = 6 points
- Build once: 4 points
- **Total: 35 points** → Advances to Review (3 days)
- **XP Earned: 10 XP**

**Stage 3 - Review after 3 days (35 → 50 points)**
- Need 15 more points
- Type it twice: 2 × 7 = 14 points
- Answer 1 multiple choice: 2 points
- **Total: 51 points** → Advances to Review (7 days)
- **XP Earned: 16 XP**

...and so on until reaching 100 points and mastery.

## Comparison: Old vs New System

### Old System
- **Points per exercise**: 6 (MC), 15 (WB), 30 (Typing)
- **Threshold**: Always 100 points per cycle
- **Progress**: Reset to 0 after each review cycle
- **Total effort**: 700 points (100 × 7 cycles)

### New System
- **Points per exercise**: 2 (MC), 4 (WB), 7 (Typing)
- **Thresholds**: Progressive (20, 35, 50, 65, 80, 90, 100)
- **Progress**: Cumulative, never resets
- **Total effort**: 100 points across all cycles
- **XP = Points**: Simpler, more transparent

## Benefits

1. **More Rewarding**: Progress never resets, always moving forward
2. **Clear Milestones**: Users see exactly how far they've come (e.g., "45/50 points")
3. **Fair Difficulty**: Early stages (new words) require more effort, later stages (familiar words) require less
4. **Faster Progression**: Reach first milestone with just 10 multiple choice questions
5. **Transparent XP**: XP earned = points earned, no confusion
6. **Psychological Win**: Always building up, never starting over

## Implementation Notes

### Server-Side Changes
- Updated `pointsMap` in [server-postgresql.js:10978-10987](server-postgresql.js#L10978-L10987)
- Updated `xpMap` to match points [server-postgresql.js:11075-11084](server-postgresql.js#L11075-L11084)
- Added `stageThresholds` array [server-postgresql.js:11019](server-postgresql.js#L11019)
- Modified SRS logic to use progressive thresholds [server-postgresql.js:11024-11055](server-postgresql.js#L11024-L11055)

### Status Progression
1. `studying` → Accumulate points to threshold
2. `review_N` → Wait N days, then test
3. If pass → Advance `reviewCycle`, back to `studying`
4. If fail → Stay in `studying`, keep points
5. At cycle 7 + 100 points → `mastered`

### Bonus XP
- **Mastering a word**: +50 XP bonus (on top of the points that got you to 100)
- **Total XP per word**: ~150 XP (100 from exercises + 50 bonus)
