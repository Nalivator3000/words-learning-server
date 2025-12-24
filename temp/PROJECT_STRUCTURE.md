# Project Structure - Active Files
**Version:** 5.4.6
**Last Updated:** 2025-12-13

## Core Application Files

### Server
```
server-postgresql.js          # Main Express server (PostgreSQL + Google TTS)
package.json                  # Dependencies & scripts
railway.json                  # Railway deployment config
```

### Public Directory (Frontend)

#### Main HTML
```
public/
├── index.html               # Main app page (PWA)
├── privacy.html             # Privacy policy
├── terms.html               # Terms of service
└── srs-explanation.html     # SRS algorithm explanation
```

#### Core JavaScript Modules
```
public/
├── app.js                   # Main application controller (v5.4.6)
├── audio-manager.js         # TTS & audio playback (v5.4.6, Google TTS API)
├── api-database.js          # API client for backend
├── quiz.js                  # Quiz logic & UI
├── i18n.js                  # Internationalization system
├── language-manager.js      # Language pair management
├── user-manager.js          # User authentication & state
├── theme.js                 # Dark/light theme switching
├── toast.js                 # Toast notifications
└── onboarding.js           # First-time user onboarding
```

#### UI Components
```
public/
├── add-word-ui.js          # Add/import words interface
├── gamification.js         # XP, achievements, levels
├── achievements-ui.js      # Achievements display
├── leagues-ui.js           # League system UI
├── weekly-challenges-ui.js # Weekly challenges UI
├── personal-rating-ui.js   # Personal rating display
├── personal-insights-ui.js # Learning insights
├── friends-ui.js           # Social features
├── duels-ui.js            # Duel system UI
├── duel-gameplay.js       # Duel gameplay logic
├── profile-ui.js          # User profile
├── word-lists-ui.js       # Pre-made word lists
├── features-ui.js         # Feature showcase
├── survival-mode.js       # Survival quiz mode
└── auth-validation.js     # Form validation
```

#### Styling
```
public/
├── style.css              # Main stylesheet (Tailwind + custom)
├── gamification.css       # Gamification-specific styles
├── achievements-ui.css
├── leagues-ui.css
├── weekly-challenges-ui.css
├── personal-rating-ui.css
├── personal-insights-ui.css
├── friends-ui.css
├── duels-ui.css
├── duel-gameplay.css
├── profile-ui.css
├── word-lists-ui.css
├── features-ui.css
└── css/
    └── tailwind-input.css  # Tailwind source
```

#### PWA Configuration
```
public/
├── service-worker.js      # Service Worker (v5.4.6, network-first caching)
├── manifest.json          # PWA manifest
└── .well-known/
    └── assetlinks.json    # Android app verification
```

#### Translations
```
public/translations/
└── source-texts.json      # Unified translation system (en/ru/de)
```

#### Debug Tools (Keep)
```
public/
├── debug-test.html        # Debug utility
└── test.html             # Test page
```

---

## Database Schema

### PostgreSQL Tables
```sql
-- Core
users                      # User accounts (email, provider, preferences)
words                      # User's vocabulary
language_pairs             # Available language combinations
word_lists                 # Pre-made word lists
word_list_words            # Word list contents

-- Gamification
daily_goals                # Daily XP goals
user_points_transactions   # XP transaction log
user_achievements          # Unlocked achievements
user_leagues               # League memberships
weekly_challenges          # Weekly challenge instances
user_weekly_challenges     # User challenge progress

-- Social
friendships                # Friend connections
duels                      # Duel matches
duel_rounds                # Individual duel rounds

-- Word Sets
cefr_word_sets            # CEFR level word sets
thematic_word_sets        # Thematic word sets
```

---

## Configuration Files

```
.gitignore                # Git ignore rules
tailwind.config.js        # Tailwind CSS configuration
playwright.config.js      # E2E test configuration
package.json              # NPM dependencies
package-lock.json         # Locked dependency versions
railway.json              # Railway deployment settings
```

---

## Documentation (Essential)

### User Guides
```
README.md                 # Main project README
GOOGLE_TTS_SETUP.md      # Google Cloud TTS setup guide
I18N_README.md           # Translation system guide
TESTING_GUIDE.md         # Testing instructions
```

### Development
```
CHANGELOG.md             # Version history
VERSION.md               # Current version info
DEVELOPMENT_WORKFLOW.md  # Dev workflow guide
TROUBLESHOOTING.md       # Common issues & solutions
QUICK_REFERENCE.md       # Quick start guide
```

### Deployment
```
RAILWAY_DEPLOYMENT_GUIDE.md
ANDROID_RELEASE_README.md
GOOGLE_PLAY_SETUP_GUIDE.md
KEYSTORE_SETUP.md
```

---

## Utility Scripts (Active)

### Testing & Validation
```
check-site.js            # Health check script
test-api-endpoints.js    # API testing
test-production.js       # Production verification
test-validation.js       # Data validation
```

### Database Management
```
list-users.js           # List all database users
```

### Icon Generation
```
generate-icons.js       # Generate PWA icons
generate-screenshots.js # Generate app screenshots
generate-feature-graphic.js
```

### Translation Tools
```
generate-translation-lists.js
check-i18n-coverage.js
```

### Build Tools
```
update-version.js       # Version bumping utility
```

---

## Scripts Directory (Active)

### Screenshot Generation
```
scripts/
├── generate-screenshots.js
├── generate-screenshots-simple.js
└── build-aab.js       # Android AAB build
```

### Translation Management
```
scripts/
├── check-active-keys.js
├── check-ui-keys.js
├── auto-translate.js
└── mass-translate.js
```

---

## Test Suite

```
tests/e2e/
├── mobile-layout.spec.js     # Mobile UI tests
├── new-features.spec.js      # Feature tests
└── onboarding.spec.js        # Onboarding flow tests
```

---

## Third-Party Integrations

### Google Cloud
- **Google Cloud TTS API** - High-quality text-to-speech
  - Service Account authentication
  - Neural2 voices
  - MP3 audio caching in `audio-cache/`

### Railway
- **Deployment Platform**
  - PostgreSQL database hosting
  - Environment variables
  - Custom domain (lexybooster.com)

### Google Play
- **Android App Distribution**
  - TWA (Trusted Web Activity)
  - APK/AAB builds

---

## Environment Variables (Required)

```bash
# Database
DATABASE_URL=postgresql://...

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS_JSON="{...}"  # Service Account JSON

# Session
SESSION_SECRET=...

# Server
PORT=3001  # Default port
```

---

## Key Features

### Audio System (v5.4.6)
- **Mobile:** Always uses Google Cloud TTS API (Neural2 voices)
- **Desktop:** Uses browser Web Speech API (filtered quality voices)
- **Caching:** MP3 files cached in `audio-cache/` directory
- **Fallback:** Graceful degradation if API unavailable

### Service Worker (v5.4.6)
- **Strategy:** Network-first for JS/CSS/HTML
- **Query Params:** Strips `?v=X.X.X` from cache keys
- **Offline:** Falls back to cached versions when offline
- **Auto-update:** Checks for updates every 10 seconds

### PWA Features
- Offline support
- Add to home screen
- Push notifications (planned)
- Fast loading with caching

---

## File Naming Conventions

### Version Queries
All JS/CSS files use version query params for cache busting:
```html
<script src="app.js?v=5.4.6"></script>
<script src="audio-manager.js?v=5.4.6"></script>
```

### Service Worker Versioning
```javascript
const CACHE_VERSION = 'v5.4.6';
const CACHE_NAME = `words-learning-${CACHE_VERSION}`;
```

---

## Dependencies (Key Packages)

### Backend
```json
"express": "^4.18.2"
"pg": "^8.11.3"              // PostgreSQL client
"@google-cloud/text-to-speech": "^5.0.3"
"express-session": "^1.17.3"
"passport": "^0.6.0"
"dotenv": "^16.3.1"
```

### Frontend (Via CDN)
- Tailwind CSS
- Google Fonts
- PWA utilities

### Development
```json
"playwright": "^1.40.0"       // E2E testing
"tailwindcss": "^3.3.5"       // CSS framework
```

---

## Build Process

### Development
```bash
npm start                    # Start dev server (port 3001)
```

### Production
```bash
# Railway auto-deploys from develop branch
git push origin develop      # Triggers deployment
```

### Android Build
```bash
npm run build:aab           # Generate AAB for Play Store
```

### Testing
```bash
npm test                    # Run Playwright tests
npm run test:e2e:mobile     # Mobile-specific tests
```

---

## Deployment Flow

```
Local Development
    ↓ (git push origin develop)
Railway CI/CD
    ↓ (auto-deploy)
Production Server
    └─ lexybooster.com
```

### Railway Services
- **Web Service:** Express server
- **PostgreSQL:** Database (shared)
- **Environment:** Production variables

---

## Important Notes

### Audio Cache
- Directory: `audio-cache/`
- Format: `{MD5_hash}.mp3`
- Never expires (persistent cache)
- Not in git (ignored)

### Service Worker Updates
- Auto-checks every 10 seconds
- Shows update banner with countdown
- Forces reload after 3 seconds
- Clears old caches on activation

### Mobile Detection
```javascript
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
```

---

**See also:**
- [PROJECT_CLEANUP_PLAN.md](./PROJECT_CLEANUP_PLAN.md) - Cleanup strategy for old files
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [GOOGLE_TTS_SETUP.md](./GOOGLE_TTS_SETUP.md) - TTS setup guide
