# 🧪 Test Account Setup Guide - FluentFlow

**Purpose**: Create realistic test account for Google Play Store screenshots
**Time Required**: 2-3 hours
**Result**: Account with 50+ words, 20+ reviews, achievements, 7+ day streak

---

## 📋 Prerequisites

- ✅ Production app running: https://words-learning-server-copy-production.up.railway.app/
- ✅ Chrome browser (for DevTools screenshots)
- ✅ CSV file with German words (or manual entry)

---

## 🎯 Target State for Screenshots

### Account Stats (Ideal):
- **Total words**: 80-100
- **Words studying**: 30-40
- **Words under review**: 20-30
- **Mastered words**: 10-20
- **Study sessions**: 20-25
- **Review sessions**: 30-35
- **Total XP**: 1,500-2,000
- **Level**: 5-7
- **Achievements unlocked**: 5-8
- **Streak**: 7-14 days
- **Daily goal progress**: 70-100%

This creates a realistic, engaged user profile that demonstrates app features effectively.

---

## 📝 Step-by-Step Setup

### Step 1: Create Account (5 min)

1. **Go to production**:
   ```
   https://words-learning-server-copy-production.up.railway.app/
   ```

2. **Register new account**:
   - Email: `demo@fluentflow.app` (or your choice)
   - Password: `DemoPassword123!` (save securely!)
   - Confirm password
   - Click "Register"

3. **Verify login**:
   - Should redirect to dashboard
   - Check that username shows in header

---

### Step 2: Import German Words (15-30 min)

#### Option A: CSV Import (Recommended - 15 min)

1. **Prepare CSV file** with German words:
   ```csv
   german,english,example
   Hallo,Hello,Hallo! Wie geht es dir?
   Danke,Thank you,Danke für deine Hilfe
   Bitte,Please,Bitte sehr!
   Tschüss,Goodbye,Tschüss! Bis bald!
   Ja,Yes,Ja, das stimmt
   Nein,No,Nein, das ist falsch
   Guten Morgen,Good morning,Guten Morgen! Schön dich zu sehen
   Gute Nacht,Good night,Gute Nacht und süße Träume
   Entschuldigung,Excuse me,Entschuldigung, können Sie mir helfen?
   Wie geht es dir?,How are you?,Wie geht es dir heute?
   ... (add 70-90 more words)
   ```

2. **Use this ready-made list** (50 common German words):
   ```csv
   german,english,example
   der Apfel,apple,Ich esse einen Apfel
   das Buch,book,Ich lese ein Buch
   die Katze,cat,Die Katze ist süß
   der Hund,dog,Der Hund bellt laut
   das Haus,house,Das Haus ist groß
   die Schule,school,Ich gehe zur Schule
   der Freund,friend,Mein Freund heißt Max
   die Familie,family,Meine Familie ist wichtig
   das Wasser,water,Ich trinke Wasser
   das Essen,food,Das Essen schmeckt gut
   die Zeit,time,Die Zeit vergeht schnell
   der Tag,day,Heute ist ein schöner Tag
   die Nacht,night,Die Nacht ist dunkel
   das Jahr,year,Dieses Jahr ist toll
   der Monat,month,Nächster Monat ist Juli
   die Woche,week,Diese Woche arbeite ich viel
   der Lehrer,teacher,Der Lehrer erklärt die Lektion
   der Student,student,Der Student lernt fleißig
   die Arbeit,work,Die Arbeit ist anstrengend
   das Auto,car,Das Auto ist schnell
   der Zug,train,Der Zug fährt pünktlich ab
   das Flugzeug,airplane,Das Flugzeug fliegt hoch
   die Stadt,city,Die Stadt ist lebendig
   das Land,country,Deutschland ist ein schönes Land
   der Berg,mountain,Der Berg ist hoch
   das Meer,sea,Das Meer ist blau
   der Himmel,sky,Der Himmel ist klar
   die Sonne,sun,Die Sonne scheint hell
   der Mond,moon,Der Mond leuchtet nachts
   der Stern,star,Die Sterne funkeln
   die Blume,flower,Die Blume duftet schön
   der Baum,tree,Der Baum ist alt
   das Gras,grass,Das Gras ist grün
   die Farbe,color,Meine Lieblingsfarbe ist blau
   rot,red,Die Rose ist rot
   blau,blue,Der Himmel ist blau
   grün,green,Das Gras ist grün
   gelb,yellow,Die Sonne ist gelb
   schwarz,black,Die Nacht ist schwarz
   weiß,white,Der Schnee ist weiß
   groß,big,Das Haus ist groß
   klein,small,Die Maus ist klein
   gut,good,Das Wetter ist gut
   schlecht,bad,Das Essen ist schlecht
   schön,beautiful,Die Blume ist schön
   hässlich,ugly,Das Bild ist hässlich
   alt,old,Der Mann ist alt
   jung,young,Das Kind ist jung
   neu,new,Das Auto ist neu
   schnell,fast,Der Zug ist schnell
   ```

3. **Save as** `german_words.csv`

4. **Import to FluentFlow**:
   - Click "Import" or "Add Words"
   - Select "CSV Import"
   - Upload `german_words.csv`
   - Verify: All words appear in word list

#### Option B: Manual Entry (30 min)

If CSV import not working:
1. Click "Add Word" button
2. Enter German word, English translation, example
3. Click "Save"
4. Repeat 50-100 times (tedious but works!)

---

### Step 3: Complete Study Sessions (1-2 hours)

**Goal**: Study 30-40 words to populate "Currently Studying" section

1. **Click "Study" button**
   - Should show new words
   - Default: 10 words per session

2. **Study first session** (10 words):
   - Read German word
   - Click "Show Answer"
   - Rate difficulty: "Easy", "Good", "Hard", or "Again"
   - Tip: Vary difficulty for realistic stats
     - 50% "Good"
     - 30% "Easy"
     - 15% "Hard"
     - 5% "Again"

3. **Complete 3-4 study sessions**:
   - Session 1: 10 words
   - Session 2: 10 words
   - Session 3: 10 words
   - Session 4: 5-10 words
   - **Total**: 30-40 words studied

4. **Check stats after each session**:
   - XP should increase
   - "Words Studying" count should grow
   - Achievements may unlock

---

### Step 4: Complete Review Sessions (30-60 min)

**Goal**: Generate SRS review data and improve retention stats

**Important**: Reviews only available after 24 hours OR you can manually adjust due dates in database (advanced).

#### Option A: Wait 24 Hours (Realistic)
1. Study words on Day 1
2. Wait until Day 2
3. Click "Review" button
4. Review due words (should be 10-20)
5. Repeat on Days 3, 4, 5, 6, 7

#### Option B: Manual Database Adjustment (Advanced)
If you have access to Railway PostgreSQL:
```sql
-- Set some words as due for review NOW
UPDATE words
SET next_review_date = NOW() - INTERVAL '1 day'
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app')
LIMIT 20;
```

**Review Process**:
1. Click "Review"
2. See word, recall answer
3. Click "Show Answer"
4. Rate how well you remembered:
   - "Again" (0): Didn't remember
   - "Hard" (1): Barely remembered
   - "Good" (2): Remembered well
   - "Easy" (3): Very easy
5. Complete 20-30 reviews

---

### Step 5: Unlock Achievements (15-30 min)

**Target**: Unlock 5-8 achievements for screenshots

**Common Achievements** (check your app's achievement system):
1. **First Word Learned** - Study 1 word ✅
2. **Getting Started** - Study 10 words ✅
3. **Word Master** - Study 50 words (continue studying)
4. **Daily Dedication** - Maintain 3-day streak
5. **Week Warrior** - Maintain 7-day streak (requires 7 days)
6. **Perfect Review** - Complete review session with 100% accuracy
7. **XP Hunter** - Earn 1000 XP
8. **Level Up** - Reach level 5

**How to unlock quickly**:
- Study more words (quick XP)
- Review with high accuracy
- Complete daily goals
- Maintain streak (login daily)

---

### Step 6: Build Streak (7 days OR manual)

**Goal**: Show 7+ day streak in screenshots

#### Option A: 7-Day Streak (Realistic)
1. Day 1: Study 10 words
2. Day 2: Review + Study 5 words
3. Day 3: Review + Study 5 words
4. Day 4: Review
5. Day 5: Review + Study 5 words
6. Day 6: Review
7. Day 7: Review + Study 5 words

**Result**: 7-day streak, varied activity

#### Option B: Manual Database (Advanced)
```sql
-- Create fake streak data
INSERT INTO daily_activity (user_id, date, words_learned, reviews_completed)
SELECT
  (SELECT id FROM users WHERE email = 'demo@fluentflow.app'),
  CURRENT_DATE - INTERVAL '1 day' * generate_series,
  FLOOR(RANDOM() * 10 + 5),
  FLOOR(RANDOM() * 15 + 10)
FROM generate_series(0, 6);

-- Update user streak
UPDATE users
SET current_streak = 7,
    longest_streak = 7,
    last_activity_date = CURRENT_DATE
WHERE email = 'demo@fluentflow.app';
```

---

### Step 7: Adjust Settings for Screenshots (5 min)

**Make UI look appealing**:

1. **Set Daily Goal**:
   - Go to Settings
   - Set daily word goal: 15-20 words
   - Ensure partially complete (70-90%) for screenshots

2. **Theme**:
   - Keep light mode for Screenshots 1-7
   - Switch to dark mode for Screenshot 8

3. **Profile Name** (if applicable):
   - Use friendly name: "Alex" or "Demo User"
   - Not "test" or "asdf123"

4. **Complete Onboarding**:
   - If onboarding tour not completed, go through it
   - Dismiss any first-time tooltips

---

## ✅ Verification Checklist

Before capturing screenshots, verify:

### Dashboard Stats:
- [ ] **Total Words**: 50-100 ✅
- [ ] **Words Studying**: 30-40 ✅
- [ ] **Words Under Review**: 20-30 ✅
- [ ] **Mastered Words**: 5-15 ✅
- [ ] **Streak**: 7+ days ✅

### Activity Stats:
- [ ] **Study Sessions**: 15-25 ✅
- [ ] **Review Sessions**: 20-35 ✅
- [ ] **Total XP**: 1,000-2,000 ✅
- [ ] **Level**: 5-8 ✅
- [ ] **Daily Goal**: 70-90% complete ✅

### Achievements:
- [ ] **5+ achievements unlocked** ✅
- [ ] Achievement badges visible
- [ ] XP progress bar showing

### Data Quality:
- [ ] No "test" or placeholder data
- [ ] Realistic German words (not "foo", "bar")
- [ ] Example sentences present
- [ ] Varied difficulty ratings
- [ ] No errors or broken UI

---

## 🎨 Screenshot Checklist

After setup, you're ready to capture:

1. ✅ **Home/Dashboard** - Shows stats, streak, daily goal
2. ✅ **Study Mode** - Word card with "Show Answer" button
3. ✅ **SRS Review** - Review card with difficulty buttons
4. ✅ **Statistics** - Charts, heatmap calendar, retention rate
5. ✅ **Achievements** - Unlocked badges, XP bar
6. ✅ **Leaderboard** - Global rankings (if available)
7. ✅ **Dark Mode** - Same view as #1 but dark theme
8. ✅ **Settings/Profile** - User settings, preferences

---

## 🐛 Troubleshooting

### Problem: No words appear after import
**Solution**:
- Check CSV format (german,english,example header)
- Verify file uploaded successfully
- Check browser console for errors
- Try manual word entry as fallback

### Problem: Reviews not showing
**Solution**:
- Words need 24 hours before first review
- OR use SQL to manually set `next_review_date` to NOW()
- Ensure you've studied words first (can't review unstudied words)

### Problem: Achievements not unlocking
**Solution**:
- Check achievement requirements in app
- Ensure you meet criteria (e.g., 50 words for "Word Master")
- Try logging out and back in (refresh achievement state)
- Check database: `SELECT * FROM user_achievements WHERE user_id = ?`

### Problem: Streak shows 0
**Solution**:
- Streak requires daily activity (study OR review)
- Activity must be on consecutive days
- Check `last_activity_date` in users table
- Use SQL to manually set streak (see Step 6, Option B)

---

## 🚀 Quick Setup (Database Method - Advanced)

If you have direct database access, run this script to populate test data instantly:

```sql
-- 1. Create test user (if not exists)
INSERT INTO users (email, password_hash, created_at, last_activity_date, current_streak, longest_streak)
VALUES ('demo@fluentflow.app', 'hashed_password_here', NOW(), CURRENT_DATE, 7, 10);

-- 2. Get user ID
SET @user_id = (SELECT id FROM users WHERE email = 'demo@fluentflow.app');

-- 3. Insert 50 German words
-- (Use bulk INSERT with words from Step 2)

-- 4. Create study sessions
INSERT INTO study_sessions (user_id, words_studied, accuracy, xp_earned, created_at)
SELECT @user_id, 10, 0.75 + RANDOM() * 0.2, 100, NOW() - INTERVAL '1 day' * generate_series
FROM generate_series(0, 4);

-- 5. Create review sessions
INSERT INTO review_sessions (user_id, reviews_completed, accuracy, created_at)
SELECT @user_id, 15, 0.80 + RANDOM() * 0.15, NOW() - INTERVAL '12 hours' * generate_series
FROM generate_series(0, 9);

-- 6. Award achievements
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
VALUES
  (@user_id, 1, NOW() - INTERVAL '6 days'),  -- First Word
  (@user_id, 2, NOW() - INTERVAL '5 days'),  -- Getting Started
  (@user_id, 3, NOW() - INTERVAL '3 days'),  -- Word Master
  (@user_id, 4, NOW() - INTERVAL '2 days'),  -- Daily Dedication
  (@user_id, 5, NOW());                      -- Week Warrior

-- 7. Set user XP and level
UPDATE users
SET xp = 1500, level = 6
WHERE id = @user_id;
```

**Time saved**: 2-3 hours → 5 minutes! ⚡

---

## 📊 Expected Results

After completing setup:

### Dashboard View:
```
┌─────────────────────────────────────┐
│  FluentFlow                    ⚙️   │
├─────────────────────────────────────┤
│  🔥 Streak: 7 days                  │
│  📊 Daily Goal: 14/20 words (70%)   │
│                                     │
│  📚 Your Stats                      │
│  Total Words: 85                    │
│  Studying: 35  │  Review: 28       │
│  Mastered: 12  │  XP: 1,650        │
│                                     │
│  🎯 Level 6  [████████░░] 65%      │
│                                     │
│  🏆 Achievements (6/12 unlocked)    │
│  [Badge] [Badge] [Badge] [Badge]    │
│                                     │
│  📈 Activity Heatmap                │
│  [Calendar with 7 days active]      │
└─────────────────────────────────────┘
```

**Perfect for screenshots!** ✨

---

## ⏭️ Next Steps

After test account is ready:

1. **Capture Screenshots** - Follow [SCREENSHOTS_GUIDE.md](SCREENSHOTS_GUIDE.md)
2. **Review Quality** - Check dimensions, clarity, consistency
3. **Upload to Google Play** - Use in store listing

---

**Time Required**: 2-3 hours (manual) OR 5 min (database script)
**Result**: Production-ready test account for Google Play Store screenshots

🎯 **Ready to create amazing screenshots!**
