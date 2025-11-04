# Changelog

All notable changes to LexyBooster will be documented in this file.

## [5.1.0] - 2025-11-04

### 🎨 Rebranding
- **LexiBooster → LexyBooster** - Complete rebrand across entire app
  - 115 replacements in 18 files
  - Updated app name, manifest, translations
  - New package name: `lexybooster-server`

### 🌍 Internationalization (i18n)
- **Universal app** - Removed all German-specific references
  - App now works with any language pair
  - No hardcoded "German Words Learning" text
  - Universal dashboard and welcome messages

### ✨ New Features
- **Daily Challenges UI** - Complete implementation
  - 3 challenges per day (Easy/Medium/Hard)
  - Progress bars and difficulty badges
  - Claim rewards functionality
  - Dark mode + responsive design

- **Streak Freeze UI** - Complete implementation
  - View active freezes
  - Use freeze manually
  - Claim free weekly freeze
  - Freeze history (last 10)
  - Glassmorphism design

- **Bug Reports UI** - Complete implementation
  - Report bugs with detailed form
  - Severity levels (Low/Medium/High/Critical)
  - Character counter (2000 max)
  - View submitted reports with status badges
  - Auto-collect technical context (User Agent, URL)

### 🔧 Improvements
- **Mobile UX fixes:**
  - Disabled XP popup notifications during exercises
  - Fixed translation loading on production
  - Removed duplicate navigation button text
  - Disabled auto-focus keyboard in word building
  - Hide letter tiles after answer to prevent scrolling

- **Translation system:**
  - 54 new translation keys added
  - 100% coverage for all 6 languages
  - English fallback for all keys
  - Fixed `/translations` folder serving on production

### 📊 Developer Experience
- **Documentation:**
  - TESTING-CHECKLIST.md (323 lines)
  - TODO-SUMMARY.md (480 lines)
  - BACKLOG.md (product backlog)
  - GOOGLE_OAUTH_PLAN.md (OAuth implementation plan)
  - GOOGLE_CLOUD_SETUP.md (setup guide)

- **Automation scripts:**
  - scripts/rename-to-lexybooster.js
  - scripts/universalize-app.js
  - scripts/test-features-api.js
  - scripts/add-new-ui-keys.js

### 🐛 Bug Fixes
- Fixed translation keys showing as [key_name] on production
- Fixed duplicate text in navigation buttons
- Fixed mobile keyboard auto-opening issues
- Fixed "Next" button visibility on mobile

### 📦 Dependencies
- Added passport, passport-google-oauth20, express-session
- Added connect-pg-simple for session management
- 14 new packages, 0 vulnerabilities

---

## [5.0.0] - 2025-10-25

### 🌍 Major i18n Migration
- Complete migration to centralized i18n system
- 626 translation keys across 6 languages
- 100% JavaScript migration (53 strings)
- 95% HTML migration (80+ data-i18n attributes)
- 20+ automation scripts

### 🎮 Gamification Backend
- Daily Challenges system (9 templates)
- Weekly Challenges system
- Streak Freeze system
- Leagues system (7 leagues)
- Personal insights API
- Bug reports API

### 🎨 Design System
- Dark mode implementation
- Glassmorphism effects
- Toast notifications
- PWA support with service worker
- Onboarding tour (8 steps)

---

## Version History

- **5.1.0** (2025-11-04) - LexyBooster rebrand + New UI features
- **5.0.0** (2025-10-25) - i18n migration + Gamification backend
- **4.x.x** - TTS improvements + PostgreSQL migration
- **3.x.x** - Gamification foundation
- **2.x.x** - Multi-user support
- **1.x.x** - Initial release

---

## Upcoming Features (Backlog)

- Google OAuth authentication
- Weekly Challenges UI
- Leagues/Rating UI
- Personal Insights UI
- SuperMemo 2 SRS algorithm
- Social features (groups, sharing)
- AI-powered recommendations
