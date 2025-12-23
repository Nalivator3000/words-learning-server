# 📸 Manual Screenshots Guide for Google Play Store

## Quick Start (5 minutes setup)

### 1. Open Production App
```
URL: https://words-learning-server-copy-production.up.railway.app
Login: demo@fluentflow.app
Password: DemoPassword123!
```

### 2. Set Language to English
1. Click ⚙️ Settings button (top right)
2. Click "Settings" in dropdown
3. Select **"English"** from "UI Language" dropdown
4. Go back to Home

### 3. Setup Chrome DevTools for Screenshots
1. Open Chrome Developer Tools (`F12`)
2. Click "Toggle Device Toolbar" (`Ctrl+Shift+M`)
3. In device toolbar, select "Responsive"
4. Set dimensions to: **1080 x 2400**
5. Set DPR (Device Pixel Ratio) to: **2.0** or **3.0**

---

## 📸 8 Required Screenshots

### Screenshot 1: Home Dashboard
**File:** `01-home-dashboard.png`
**Location:** Home page (main screen after login)
**What to show:**
- ✅ User stats (Level, XP, streak)
- ✅ Word counts (Studying, Review, Learned)
- ✅ Quick action buttons
- ✅ Daily goals (if visible)

**Steps:**
1. Login and go to Home section
2. Make sure all stats are visible
3. Right-click → "Capture screenshot" or use browser screenshot tool

---

### Screenshot 2: Study Mode
**File:** `02-study-mode.png`
**Location:** Study → Multiple Choice
**What to show:**
- ✅ Study question with word
- ✅ Multiple choice options
- ✅ Progress bar
- ✅ Clean, simple UI

**Steps:**
1. Click "Study" button
2. Click "Multiple Choice" mode
3. Take screenshot of first question (BEFORE answering)

---

### Screenshot 3: Review Section
**File:** `03-review-section.png`
**Location:** Review page
**What to show:**
- ✅ Review words list
- ✅ Due dates (7 days, 30 days)
- ✅ SRS information

**Steps:**
1. Go back to Home
2. Click "Review" button
3. Take screenshot of review section

---

### Screenshot 4: Statistics
**File:** `04-statistics.png`
**Location:** Statistics page
**What to show:**
- ✅ Progress charts
- ✅ Learning analytics
- ✅ Study time tracking

**Steps:**
1. Click "Statistics" button
2. Wait for charts to load (~2 seconds)
3. Scroll to show main chart
4. Take screenshot

---

###  Screenshot 5: Leaderboard
**File:** `05-leaderboard.png`
**Location:** Leaderboard section
**What to show:**
- ✅ Global rankings
- ✅ User positions
- ✅ XP scores

**Steps:**
1. Click "🏆 Рейтинг" (Leaderboard) button
2. Wait for leaderboard to load
3. Take screenshot

---

### Screenshot 6: Gamification
**File:** `06-achievements.png`
**Location:** Statistics → Gamification section
**What to show:**
- ✅ Achievements/badges
- ✅ XP progress
- ✅ Streak information

**Steps:**
1. Go to Statistics page
2. Scroll down to "Gamification" section
3. Show achievements and badges
4. Take screenshot

---

### Screenshot 7: Dark Mode
**File:** `07-dark-mode.png`
**Location:** Any page in dark mode
**What to show:**
- ✅ Dark theme UI
- ✅ Good contrast
- ✅ Home or Study page recommended

**Steps:**
1. Click 🌙 theme toggle button (top right)
2. Go to Home or Study section
3. Take screenshot
4. **Toggle back to light mode** for remaining screenshots

---

### Screenshot 8: Settings
**File:** `08-settings.png`
**Location:** Settings page
**What to show:**
- ✅ UI Language selector (showing English selected)
- ✅ Language Pairs
- ✅ Study settings

**Steps:**
1. Toggle theme back to light mode
2. Click ⚙️ Settings → Settings
3. Make sure "English" is selected in dropdown
4. Take screenshot

---

## 🔍 Screenshot Quality Checklist

Before saving each screenshot, verify:

- [ ] Resolution: **1080 x 2400px** (verify in DevTools)
- [ ] Language: **English** (all UI text in English)
- [ ] No sensitive data visible (only demo account)
- [ ] Clean UI (no debug messages, no errors)
- [ ] High quality (PNG format, not compressed)
- [ ] File size: 100-500 KB per screenshot

---

## 📁 Save Screenshots

Save all screenshots to:
```
public/store-assets/screenshots/
```

File naming:
- `01-home-dashboard.png`
- `02-study-mode.png`
- `03-review-section.png`
- `04-statistics.png`
- `05-leaderboard.png`
- `06-achievements.png`
- `07-dark-mode.png`
- `08-settings.png`

---

## ⚡ Pro Tips

1. **Clear Cache**: If UI looks broken, clear browser cache (Ctrl+Shift+Delete)
2. **Zoom**: Make sure browser zoom is 100% (Ctrl+0)
3. **Hide DevTools**: Take screenshots with DevTools hidden for cleaner UI
4. **Consistent Timing**: Wait 2-3 seconds after navigation for animations to complete
5. **Test on Phone**: After screenshots, test actual URL on Android phone to verify

---

## ✅ After Screenshots

1. Review all 8 screenshots
2. Verify dimensions using image viewer or DevTools
3. Upload to Google Play Console
4. Update `PRE_LAUNCH_CHECKLIST.md` → Phase 2: 100% ✅

---

## 🤖 Alternative: Automated Screenshots

If you want to try automated screenshots (may need debugging):

```bash
npm install --save-dev puppeteer
node generate-screenshots-production.js
```

**Note:** Automated version may need selector adjustments for navigation.
Manual screenshots are recommended for first release.
