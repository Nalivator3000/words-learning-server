# 📸 Screenshot Instructions - Google Play Store

## 🎯 Quick Info

**Resolution Required:** 1080 x 2400 pixels (9:16 portrait)
**Quantity Required:** Minimum 2, Recommended 8
**Format:** PNG or JPG
**Max File Size:** 8 MB each
**Save Location:** `public/store-assets/screenshots/`

---

## 🔐 Step 1: Login to Production

### URL & Credentials
```
URL:      https://words-learning-server-copy-production.up.railway.app/
Email:    demo@fluentflow.app
Password: DemoPassword123!
```

### Verification Checklist
- [ ] Login successful
- [ ] 50 German words visible
- [ ] All features accessible (Study, Review, Stats)

---

## 🖥️ Step 2: Setup Chrome DevTools

### Open DevTools
1. Press **F12** (or Ctrl+Shift+I / Cmd+Option+I)
2. Click "Toggle device toolbar" icon (or press **Ctrl+Shift+M**)

### Configure Device Emulation
1. In the device toolbar, select **"Responsive"**
2. Set dimensions to: **1080 x 2400**
3. Set device pixel ratio (DPR): **3** (for crisp screenshots)
4. Zoom: Set to **100%**

### Screenshot Setup
1. Click "..." (more options) in DevTools
2. Select "Capture screenshot" OR
3. Use keyboard shortcut: **Ctrl+Shift+P** → type "screenshot" → select "Capture screenshot"

**Pro Tip:** For full-page screenshots, use "Capture full size screenshot"

---

## 📸 Step 3: Capture 8 Screens

### Screenshot 1: Home/Dashboard
**Filename:** `01-home-dashboard.png`

**What to Show:**
- Main navigation (Home button active)
- User stats widget (XP, Level, Streak)
- Study progress overview
- Recent activity
- Quick action buttons

**How to Capture:**
1. After login, you're on the home screen
2. Make sure streak/XP/level are visible
3. Capture screenshot
4. Save as `01-home-dashboard.png`

---

### Screenshot 2: Study Mode
**Filename:** `02-study-mode.png`

**What to Show:**
- German word card (e.g., "der Apfel")
- Translation options or input field
- Progress bar (e.g., "Card 5 of 50")
- Study mode UI

**How to Capture:**
1. Click "Study" or "Start Learning"
2. Select German → English language pair
3. Word card should appear
4. Capture screenshot
5. Save as `02-study-mode.png`

---

### Screenshot 3: SRS Review
**Filename:** `03-srs-review.png`

**What to Show:**
- Review interface
- Due words count
- Spaced repetition progress
- Review card UI

**How to Capture:**
1. Navigate to "Review" section
2. Start review session
3. Review card should show
4. Capture screenshot
5. Save as `03-srs-review.png`

**Note:** If no words are due, you may need to:
- Study some words first
- Or show the "No reviews due" screen (also acceptable)

---

### Screenshot 4: Statistics
**Filename:** `04-statistics.png`

**What to Show:**
- Learning statistics charts
- Progress graphs (line/bar charts)
- Study heatmap (calendar view)
- Performance metrics

**How to Capture:**
1. Click "Stats" or "Statistics" tab
2. Make sure graphs/charts are visible
3. Scroll to show best data
4. Capture screenshot
5. Save as `04-statistics.png`

---

### Screenshot 5: Achievements
**Filename:** `05-achievements.png`

**What to Show:**
- Achievement badges (locked/unlocked)
- Progress toward achievements
- XP/level system
- Gamification elements

**How to Capture:**
1. Navigate to "Achievements" or "Profile" → "Achievements"
2. Show achievement grid
3. Capture screenshot
4. Save as `05-achievements.png`

**Note:** Demo account may have few unlocked achievements (that's OK!)

---

### Screenshot 6: Leaderboard
**Filename:** `06-leaderboard.png`

**What to Show:**
- Global rankings
- User positions
- Top performers
- Competitive elements

**How to Capture:**
1. Navigate to "Leaderboard" or "Rankings"
2. Show top users list
3. Capture screenshot
4. Save as `06-leaderboard.png`

**Note:** If leaderboard is empty, show "No rankings yet" screen

---

### Screenshot 7: Dark Mode
**Filename:** `07-dark-mode.png`

**What to Show:**
- Any main screen in dark theme
- Dark mode aesthetics
- UI consistency in dark mode

**How to Capture:**
1. Toggle dark mode (usually in Settings or top-right)
2. Navigate to any main screen (Home, Study, or Stats)
3. Capture screenshot showing dark theme
4. Save as `07-dark-mode.png`

---

### Screenshot 8: Settings/Profile
**Filename:** `08-settings-profile.png`

**What to Show:**
- User profile information
- Settings options
- Customization features
- Account details

**How to Capture:**
1. Click profile icon or "Settings"
2. Show user details (name, email, stats)
3. Show settings options (theme, notifications, etc.)
4. Capture screenshot
5. Save as `08-settings-profile.png`

---

## 📋 Screenshot Checklist

After capturing all 8 screenshots, verify:

### File Checklist
- [ ] `01-home-dashboard.png` (1080x2400)
- [ ] `02-study-mode.png` (1080x2400)
- [ ] `03-srs-review.png` (1080x2400)
- [ ] `04-statistics.png` (1080x2400)
- [ ] `05-achievements.png` (1080x2400)
- [ ] `06-leaderboard.png` (1080x2400)
- [ ] `07-dark-mode.png` (1080x2400)
- [ ] `08-settings-profile.png` (1080x2400)

### Quality Checklist
- [ ] All screenshots are 1080 x 2400 pixels
- [ ] No personal/test data visible (except demo account)
- [ ] UI looks clean and professional
- [ ] Text is readable
- [ ] No error messages or bugs visible
- [ ] Each file under 8 MB

### Location Checklist
- [ ] All files saved to `public/store-assets/screenshots/`
- [ ] Filenames match exactly (lowercase, hyphens)

---

## 🎨 Pro Tips

### Making Screenshots Look Professional

1. **Clear UI State**
   - No loading spinners
   - No half-loaded images
   - Complete data displayed

2. **Realistic Data**
   - Use the 50 German words from demo account
   - Show actual progress (even if minimal)
   - Don't fake metrics

3. **Consistent Branding**
   - Keep same color scheme across screenshots
   - Use same device/browser for all
   - Maintain visual consistency

4. **Highlight Features**
   - Choose screens that show app's strengths
   - Display unique features (SRS, gamification)
   - Show value proposition

---

## 🚨 Common Issues & Solutions

### Issue 1: Wrong Resolution
**Problem:** Screenshots are not 1080x2400

**Solution:**
1. Check DevTools device dimensions
2. Make sure zoom is at 100%
3. Use "Capture screenshot" not "Print Screen"

### Issue 2: UI Cut Off
**Problem:** Some UI elements are cropped

**Solution:**
1. Scroll to show important content
2. Use "Capture full size screenshot" for long pages
3. Adjust viewport to fit content

### Issue 3: Blurry Screenshots
**Problem:** Text looks fuzzy

**Solution:**
1. Set DPR to 3 in DevTools
2. Ensure browser zoom is 100%
3. Use PNG format (not JPG with low quality)

### Issue 4: Empty Data
**Problem:** No words/stats showing

**Solution:**
1. Verify logged in as demo@fluentflow.app
2. Check database has 50 words (it does!)
3. Refresh page if needed
4. Try studying a few words to generate data

---

## ✅ Step 4: Verify & Upload

### Local Verification
```bash
# Check screenshots exist
ls -la public/store-assets/screenshots/

# Check file sizes
du -h public/store-assets/screenshots/*

# Count screenshots (should be 8)
ls public/store-assets/screenshots/ | wc -l
```

### Git Commit
```bash
git add public/store-assets/screenshots/
git commit -m "📸 SCREENSHOTS: Add 8 Google Play Store screenshots (1080x2400)"
git push
```

### Update Checklist
After screenshots are done:
1. Open [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md)
2. Mark screenshots as complete ✅
3. Update Phase 2: 75% → 100% 🎉

---

## 📞 Need Help?

If you encounter issues:
1. Check [SCREENSHOTS_GUIDE.md](SCREENSHOTS_GUIDE.md) for more details
2. Verify demo account works: login again
3. Try different browser (Chrome recommended)
4. Check Railway logs if app not responding

---

## 🎉 After Screenshots

Once all 8 screenshots are captured:
- ✅ Phase 2 (Store Assets) = **100% COMPLETE**
- 🚀 Ready for Phase 3 (Testing)
- 📦 Ready for Google Play submission (when TWA is built)

**Great job! You're one step closer to launch! 🚀**

---

**Created:** 2025-10-25
**Production URL:** https://words-learning-server-copy-production.up.railway.app/
**Demo Account:** demo@fluentflow.app / DemoPassword123!
