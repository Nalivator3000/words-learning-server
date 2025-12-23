# 📸 Screenshots Guide for Google Play Store

## 🎯 Requirements

**Size**: 1080x2400px (9:16 aspect ratio)
**Format**: PNG or JPEG
**Minimum**: 2 screenshots
**Recommended**: 8 screenshots
**Max file size**: 8 MB per screenshot

---

## 📱 Required Screenshots (Priority Order)

### 1. **Home Screen / Dashboard** (MUST HAVE)
- Show: Main navigation, study cards, streak counter, daily goal
- Purpose: First impression, show app layout
- User state: Logged in, some progress visible

### 2. **Study Mode in Action** (MUST HAVE)
- Show: Flashcard with German word, translation options, progress bar
- Purpose: Demonstrate core learning functionality
- User state: Mid-study session, showing word flip animation

### 3. **SRS Review Screen**
- Show: Review card with difficulty buttons, interval display
- Purpose: Demonstrate spaced repetition feature
- User state: Active review session

### 4. **Statistics Dashboard**
- Show: Charts, heatmap calendar, learning streaks, retention rate
- Purpose: Show progress tracking capabilities
- User state: User with 30+ days of data

### 5. **Achievements & Gamification**
- Show: Achievement badges, XP bar, level progress, leaderboard
- Purpose: Highlight gamification features
- User state: Multiple achievements unlocked

### 6. **Dark Mode**
- Show: Same screen as #1 but in dark mode
- Purpose: Showcase dark theme support
- User state: Dark mode enabled

### 7. **Import Words / Add Words**
- Show: CSV import interface or manual word entry form
- Purpose: Show how users add content
- User state: Import dialog open

### 8. **Settings / Profile**
- Show: User profile, settings options, customization
- Purpose: Show app customization
- User state: Settings screen open

---

## 🛠️ How to Create Screenshots

### Option A: Chrome DevTools (Recommended)

1. **Open app in Chrome**: `http://localhost:3001`
2. **Open DevTools**: F12 or Ctrl+Shift+I
3. **Toggle device toolbar**: Ctrl+Shift+M
4. **Set custom device**:
   - Width: 1080px
   - Height: 2400px
   - Device pixel ratio: 3
5. **Navigate to screen** you want to capture
6. **Take screenshot**:
   - DevTools Menu (⋮) → "Capture screenshot"
   - Or Ctrl+Shift+P → "Capture screenshot"
7. **Save as**: `screenshot-{number}-{name}.png`

### Option B: Puppeteer Automation (Advanced)

Run the automated screenshot script:
```bash
npm run generate:screenshots
```

This will automatically navigate to each screen and capture screenshots.

---

## 📝 Screenshot Checklist

Before taking screenshots, prepare the app:

### Database Setup
- [ ] Create test user: `test@fluentflow.app`
- [ ] Import 50-100 German words
- [ ] Complete 20+ study sessions
- [ ] Review 30+ cards (to show SRS data)
- [ ] Unlock 3-5 achievements
- [ ] Build 7+ day streak
- [ ] Generate realistic statistics

### UI Preparation
- [ ] Clear any error messages
- [ ] Close any debugging tools
- [ ] Set appealing theme colors
- [ ] Ensure no placeholder text (Lorem ipsum)
- [ ] Check that all icons/images load
- [ ] Verify text is readable on all backgrounds

### Capture Settings
- [ ] Hide browser chrome (address bar, bookmarks)
- [ ] Use production build (minified, optimized)
- [ ] Clear console errors
- [ ] Disable dev tools overlays
- [ ] Use realistic data (no "test", "foo", "bar")

---

## 🎨 Screenshot Naming Convention

Save screenshots as:
```
screenshot-01-home-dashboard.png
screenshot-02-study-mode.png
screenshot-03-srs-review.png
screenshot-04-statistics.png
screenshot-05-achievements.png
screenshot-06-dark-mode.png
screenshot-07-import-words.png
screenshot-08-settings.png
```

---

## ✅ Quality Checklist

For each screenshot:
- [ ] Exactly 1080x2400px
- [ ] PNG format with high quality
- [ ] File size < 2 MB
- [ ] No blurry text
- [ ] No cut-off UI elements
- [ ] Readable font sizes
- [ ] Proper color contrast
- [ ] No personal data visible (if using real account)
- [ ] Consistent branding (colors, fonts)
- [ ] No development/debug overlays

---

## 🚀 Upload to Google Play

After creating all screenshots:

1. Go to **Google Play Console**
2. Navigate to **Store Listing** → **Graphics**
3. Scroll to **Phone screenshots**
4. Upload screenshots in order (1-8)
5. Add optional captions for each:
   - Screenshot 1: "Track your learning journey"
   - Screenshot 2: "Master vocabulary with flashcards"
   - Screenshot 3: "Spaced repetition for long-term memory"
   - Screenshot 4: "Detailed progress analytics"
   - Screenshot 5: "Unlock achievements and compete"
   - Screenshot 6: "Beautiful dark mode"
   - Screenshot 7: "Import words easily"
   - Screenshot 8: "Customize your experience"

---

## 📐 Alternative: Manual Screenshots on Real Device

If you have an Android device:

1. **Deploy app** to production or test URL
2. **Open app** on Android device (1080x2400 screen)
3. **Take screenshots**: Power + Volume Down
4. **Transfer to PC**
5. **Verify dimensions**: Should already be 1080x2400 on most devices

---

## 🎯 Pro Tips

1. **Use real data**: Screenshots with realistic content perform better
2. **Show value**: Each screenshot should demonstrate a key feature
3. **Consistency**: Use same test account across all screenshots
4. **Localization**: Create separate screenshots for each language (later)
5. **Update regularly**: Update screenshots when UI changes
6. **A/B testing**: Try different screenshot orders to optimize conversions

---

**Created**: 2025-10-24
**For**: FluentFlow Android Release
**Status**: Ready to capture 📸
