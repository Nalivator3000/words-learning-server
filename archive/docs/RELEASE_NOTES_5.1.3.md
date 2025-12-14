# LexyBooster v5.1.3 Release Notes

## 🎯 Overview
This update brings several improvements to the learning experience, including enhanced daily goal tracking, auto-play audio feature, and improved UI for light theme users.

## ✨ New Features

### 🎤 Auto-Play Audio
- **New Setting:** Toggle auto-play for word pronunciation after quiz answers
- Automatically pronounce the correct word after completing any exercise
- Works across all exercise types (Multiple Choice, Typing, Word Building)
- Intelligent language detection based on exercise type
- Can be enabled/disabled in Settings → Audio Settings

### 📊 Enhanced Daily Goal System
- **Increased Default Goal:** Daily word goal increased from 5 to 20 words
- **Improved Tracking:** Daily goals now trigger on:
  - Learning new words
  - Words advancing from studying to review stage
  - Words moving to higher review cycles (7 days → 30 days)
  - Words becoming mastered
- Better motivation through comprehensive progress tracking

## 🎨 UI/UX Improvements

### 🌐 Navigation Reorganization
- **Removed:** Separate "Review" section from navigation menu
- **Moved:** Review information now integrated into Statistics page
- Review counts (7-day and 30-day) displayed with visual badges
- "Start Review" button accessible directly from Statistics
- Cleaner, more streamlined navigation experience

### 🌞 Light Theme Color Fixes
- **Fixed:** White text on white background in daily goals header
- **Fixed:** Low contrast achievement cards in light mode
- **Improved:** Card backgrounds now use opaque white (95% opacity)
- **Enhanced:** Border colors changed from white to black for better visibility
- **Better readability:** Text colors adjusted to dark grays (#2c3e50, #6c757d)
- **Consistent styling:** Tab buttons, progress bars, and labels all optimized for light theme

## 🔧 Technical Improvements

### Version Updates
- **Web App:** v5.1.3
- **Android App:** v5.1.3 (versionCode 1003)
- Updated TWA manifest configurations
- Updated Android app shortcuts to match navigation changes

### Translation Updates
- Added new translation keys: `audio_settings`, `auto_play_words`, `auto_play_description`
- Added `startReview`, `review_7days`, `review_30days` translations
- Fixed missing translation bug that showed `[startReview]` placeholder
- Full multi-language support (English, Russian, German)

## 📱 Android App Updates
- Updated app shortcuts: Replaced "Review Words" with "Statistics"
- Synchronized version numbers with web application
- All web features now available in Android TWA app

## 🐛 Bug Fixes
- Fixed translation placeholder appearing as `[startReview]`
- Resolved light theme visibility issues with achievement cards
- Fixed daily goals header text color in light mode
- Corrected progress bar contrast in light theme

## 📦 Files Changed
- `server-postgresql.js` - Daily goal tracking logic
- `public/app.js` - Auto-play feature and navigation updates
- `public/quiz.js` - Auto-play integration
- `public/index.html` - UI restructuring
- `public/style.css` - Review info box styles
- `public/gamification.css` - Light theme fixes
- `public/achievements-ui.css` - Light theme color improvements
- `public/translations/source-texts.json` - New translation keys
- `twa-manifest.json` - Android app configuration
- `package.json` - Version bump

## 🎮 User Experience
This release focuses on making learning more engaging and accessible:
- **More Motivating Goals:** 20 words/day encourages consistent practice
- **Better Feedback:** Auto-play helps reinforce correct pronunciation
- **Cleaner Interface:** Streamlined navigation reduces cognitive load
- **Improved Accessibility:** Light theme now fully readable and professional

## 🚀 How to Update

### For Web Users
- Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
- Changes apply automatically

### For Android Users
- Update will be available on Google Play Store shortly
- Version 5.1.3 will auto-update based on your Play Store settings

## 📝 Commits Included
- `fde6eca` - Daily goal system enhancements
- `c520aec` - Auto-play audio feature
- `af407d9` - Navigation restructuring (Review → Statistics)
- `03f11df` - Light theme color fixes

---

**Build Date:** November 29, 2025
**Build Type:** Production Release
**AAB Size:** 4.2 MB
**Minimum Android:** API 24 (Android 7.0)
**Target Android:** API 36 (Android 14+)
