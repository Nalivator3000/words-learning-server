# 🚀 Pre-Release Plan - LexyBooster v5.2.0

## Общая цель
Подготовка приложения к полноценному релизу с поддержкой всех платформ и качественным UX.

---

## 📱 Phase 1: Mobile Web UI Polish (Priority: CRITICAL)

### 1.1 Mobile Layout Finalization
- [ ] **Audit all screens on mobile**
  - Home screen
  - Study modes (multiple choice, word building, typing)
  - Review mode
  - Statistics & Progress
  - Settings
  - Word Lists
  - Achievements
  - Leaderboard

- [ ] **Fix remaining layout issues**
  - [ ] Ensure no horizontal scroll on any screen
  - [ ] Verify all buttons are thumb-reachable
  - [ ] Check tap target sizes (minimum 44x44px)
  - [ ] Test landscape mode on all screens
  - [ ] Verify safe area handling (notch, bottom bar)

- [ ] **Typography & Spacing**
  - [ ] Audit all font sizes for mobile readability
  - [ ] Ensure consistent spacing system
  - [ ] Check line heights for comfortable reading
  - [ ] Verify contrast ratios (WCAG AA standard)

### 1.2 Automated UI Testing Setup
- [ ] **Setup testing framework**
  - [ ] Choose framework (Playwright/Cypress recommended)
  - [ ] Install dependencies
  - [ ] Configure test environment

- [ ] **Create test suite for responsive design**
  - [ ] iPhone SE (375x667) - smallest modern phone
  - [ ] iPhone 12/13 Pro (390x844) - popular size
  - [ ] iPhone 14 Pro Max (430x932) - large phone
  - [ ] Galaxy S21 (360x800) - Android standard
  - [ ] iPad Mini (768x1024) - small tablet
  - [ ] iPad Pro (1024x1366) - large tablet

- [ ] **Visual regression tests**
  - [ ] Snapshot tests for all screens
  - [ ] Compare before/after screenshots
  - [ ] Automate on PR creation

- [ ] **Interaction tests**
  - [ ] Navigation flow tests
  - [ ] Quiz completion flow
  - [ ] Settings changes
  - [ ] Login/Register flow

### 1.3 Performance Optimization
- [ ] **Load time optimization**
  - [ ] Lazy load images
  - [ ] Code splitting
  - [ ] Bundle size analysis
  - [ ] Service worker optimization

- [ ] **Runtime performance**
  - [ ] Identify and fix janky animations
  - [ ] Optimize large list rendering
  - [ ] Reduce re-renders in React (if applicable)

---

## 🔐 Phase 2: Authentication Enhancement (Priority: HIGH)

### 2.1 Google OAuth Implementation
- [ ] **Setup Google Cloud Console**
  - [ ] Create OAuth 2.0 credentials
  - [ ] Configure authorized domains
  - [ ] Add redirect URIs

- [ ] **Frontend Integration**
  - [ ] Add Google Sign-In button
  - [ ] Implement OAuth flow
  - [ ] Handle tokens and user data
  - [ ] Store user session

- [ ] **Backend Integration**
  - [ ] Verify Google token on server
  - [ ] Create/link user account
  - [ ] Sync user data
  - [ ] Handle edge cases (existing email, etc.)

### 2.2 Apple Sign-In Implementation
- [ ] **Setup Apple Developer Account**
  - [ ] Create App ID
  - [ ] Enable Sign in with Apple capability
  - [ ] Create Service ID
  - [ ] Configure domains and redirect URLs

- [ ] **Frontend Integration**
  - [ ] Add Apple Sign-In button
  - [ ] Implement OAuth flow
  - [ ] Handle Apple's unique user ID
  - [ ] Handle privacy features (hide email)

- [ ] **Backend Integration**
  - [ ] Verify Apple token
  - [ ] Handle Apple's JWT tokens
  - [ ] Link Apple ID to user account
  - [ ] Handle email relay (@privaterelay.appleid.com)

### 2.3 Registration Flow Enhancement
- [ ] **Improve registration UX**
  - [ ] Add password strength indicator
  - [ ] Email validation in real-time
  - [ ] Terms of Service checkbox
  - [ ] Privacy Policy link

- [ ] **Email verification**
  - [ ] Send verification email
  - [ ] Verification link handling
  - [ ] Resend verification option
  - [ ] Unverified user limitations

- [ ] **Social registration benefits**
  - [ ] One-click registration
  - [ ] Auto-fill profile data
  - [ ] No password needed
  - [ ] Faster onboarding

---

## 📱 Phase 5: Android App Optimization (Priority: MEDIUM)

### 5.1 Current APK Audit
- [ ] **Review existing TWA setup**
  - [ ] Check twa-manifest.json
  - [ ] Verify assetlinks.json
  - [ ] Test deep linking
  - [ ] Verify offline functionality

- [ ] **Performance analysis**
  - [ ] App size (current: lexybooster-v5.1.3.aab)
  - [ ] Load time measurement
  - [ ] Memory usage profiling
  - [ ] Battery consumption test

### 5.2 Android-Specific Features
- [ ] **TWA enhancements**
  - [ ] Add custom splash screen
  - [ ] Implement status bar theming
  - [ ] Add shortcuts (app shortcuts)
  - [ ] Enable share target

- [ ] **Notifications**
  - [ ] Daily reminder notifications
  - [ ] Streak reminder
  - [ ] Achievement unlocked notifications
  - [ ] Push notification infrastructure

- [ ] **Offline mode**
  - [ ] Cache all essential resources
  - [ ] Offline quiz capability
  - [ ] Sync when online
  - [ ] Offline indicator

### 5.3 Play Store Optimization
- [ ] **Update store listing**
  - [ ] New screenshots (mobile-optimized UI)
  - [ ] Update feature graphic
  - [ ] Improve description (SEO)
  - [ ] Add video preview

- [ ] **Compliance**
  - [ ] Update privacy policy
  - [ ] Data safety section
  - [ ] Permissions justification
  - [ ] Content rating review

- [ ] **Testing**
  - [ ] Internal testing track
  - [ ] Closed testing with beta users
  - [ ] Open testing (if needed)
  - [ ] Pre-launch report review

### 5.4 Build & Release Process
- [ ] **Automated builds**
  - [ ] GitHub Actions workflow
  - [ ] Version bumping automation
  - [ ] Changelog generation
  - [ ] APK/AAB signing

- [ ] **Quality checks**
  - [ ] Lint checks
  - [ ] Bundle size limits
  - [ ] Lighthouse CI scores
  - [ ] Security scanning

---

## 🍎 Phase 6: iOS App Development (Priority: LOW)

### 6.1 Apple Developer Setup
- [ ] **Developer account**
  - [ ] Enroll in Apple Developer Program ($99/year)
  - [ ] Configure certificates
  - [ ] Create App ID
  - [ ] Setup provisioning profiles

- [ ] **App Store Connect**
  - [ ] Create app entry
  - [ ] Configure app metadata
  - [ ] Upload screenshots
  - [ ] Set pricing & availability

### 6.2 iOS App Development
- [ ] **Choose approach**
  - [ ] Option A: Native Swift/SwiftUI wrapper (best performance)
  - [ ] Option B: Capacitor/Ionic (cross-platform, faster)
  - [ ] Option C: PWA + Add to Home Screen (simplest, limited)

- [ ] **Implementation (if wrapper chosen)**
  - [ ] Setup Xcode project
  - [ ] Integrate WebView
  - [ ] Bridge native features
  - [ ] Handle iOS-specific UI

- [ ] **iOS-specific features**
  - [ ] Sign in with Apple (required if other social logins)
  - [ ] Face ID/Touch ID support
  - [ ] Haptic feedback
  - [ ] Widget support
  - [ ] Siri Shortcuts

### 6.3 iOS Testing
- [ ] **Device testing**
  - [ ] iPhone SE (smallest screen)
  - [ ] iPhone 14 Pro (notch)
  - [ ] iPhone 14 Pro Max (large screen)
  - [ ] iPad support (if applicable)

- [ ] **iOS version support**
  - [ ] iOS 15.0+ minimum
  - [ ] iOS 16 features
  - [ ] iOS 17 compatibility

- [ ] **TestFlight**
  - [ ] Internal testing
  - [ ] External beta testing
  - [ ] Collect feedback
  - [ ] Iterate based on feedback

### 6.4 App Store Submission
- [ ] **Prepare assets**
  - [ ] App icon (1024x1024)
  - [ ] Screenshots (all required sizes)
  - [ ] App preview video (optional)
  - [ ] Promotional text

- [ ] **Compliance**
  - [ ] Privacy nutrition label
  - [ ] App Review Guidelines compliance
  - [ ] Content rights verification
  - [ ] Export compliance

- [ ] **Submit for review**
  - [ ] Complete metadata
  - [ ] Submit binary
  - [ ] Respond to review feedback
  - [ ] Publish on approval

---

## 📚 Phase 3: Word Sets & Extended Languages (Priority: HIGH)

### 3.1 CEFR-Based Word Sets
- [ ] **Level-based word sets (A1-C2)**
  - [ ] A1: Beginner (500-1000 words)
  - [ ] A2: Elementary (1000-1500 words)
  - [ ] B1: Intermediate (1500-2000 words)
  - [ ] B2: Upper-Intermediate (2000-3000 words)
  - [ ] C1: Advanced (3000-4000 words)
  - [ ] C2: Proficient (4000+ words)

- [ ] **Database schema for word sets**
  ```sql
  CREATE TABLE word_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    language_pair VARCHAR(10),
    level VARCHAR(5), -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
    theme VARCHAR(100),
    word_count INTEGER,
    is_official BOOLEAN DEFAULT true,
    created_at TIMESTAMP
  );

  CREATE TABLE word_set_items (
    id SERIAL PRIMARY KEY,
    word_set_id INTEGER REFERENCES word_sets(id),
    word_id INTEGER REFERENCES words(id),
    order_index INTEGER
  );
  ```

### 3.2 Thematic Word Sets (15+ Themes)
- [ ] **Common themes**
  - [ ] Travel & Tourism
  - [ ] Business & Work
  - [ ] Food & Cooking
  - [ ] Health & Medicine
  - [ ] Technology & Internet
  - [ ] Education & School
  - [ ] Sports & Fitness
  - [ ] Family & Relationships
  - [ ] Weather & Nature
  - [ ] Shopping & Money
  - [ ] Arts & Culture
  - [ ] Transportation
  - [ ] Home & Living
  - [ ] Emotions & Feelings
  - [ ] Time & Calendar

### 3.3 Extended Language Support (5 New Languages)
- [ ] **Arabic (ar)**
  - [ ] RTL (Right-to-Left) layout support
  - [ ] Arabic script rendering
  - [ ] Diacritics handling (optional)
  - [ ] High-quality TTS voices (Google, Microsoft)
  - [ ] Word database import (5000+ common words)

- [ ] **Romanian (ro)**
  - [ ] Diacritics support (ă, â, î, ș, ț)
  - [ ] Romanian TTS voices
  - [ ] Word database import (5000+ common words)

- [ ] **Serbian (sr)**
  - [ ] Dual-script support (Cyrillic + Latin)
  - [ ] Script toggle option
  - [ ] Serbian TTS voices (both scripts)
  - [ ] Word database import (5000+ common words)

- [ ] **Polish (pl)**
  - [ ] Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
  - [ ] Polish TTS voices
  - [ ] Word database import (5000+ common words)

- [ ] **Turkish (tr)**
  - [ ] Turkish-specific characters (ğ, ı, ö, ü, ş, ç)
  - [ ] Turkish TTS voices
  - [ ] Word database import (5000+ common words)

### 3.4 Manual Word Addition (Priority: HIGH)
- [ ] **Smart word input system**
  - [ ] User enters word in target language
  - [ ] Auto-fetch translation suggestions from translation API
  - [ ] Display multiple translation options with context
  - [ ] Allow user to select one or multiple translations
  - [ ] Allow user to enter custom translation manually
  - [ ] Save word to user's personal word list

- [ ] **Translation suggestions features**
  - [ ] Integration with translation API (Google Translate/DeepL)
  - [ ] Show word frequency/commonality indicator
  - [ ] Display usage examples for each translation option
  - [ ] Show word gender (for gendered languages)
  - [ ] Display plural forms when relevant
  - [ ] Detect and handle phrases (multi-word expressions)

- [ ] **Word validation & enhancement**
  - [ ] Check if word already exists in user's list
  - [ ] Suggest CEFR level automatically
  - [ ] Allow user to assign word to custom categories/tags
  - [ ] Optional: Add personal notes/mnemonics
  - [ ] Optional: Add custom pronunciation hints

### 3.5 Import & Management Tools
- [ ] **Word set import tools**
  - [ ] CSV/Excel import for word sets
  - [ ] Validation & deduplication
  - [ ] Bulk assignment to levels/themes
  - [ ] Preview before import

- [ ] **User word set features**
  - [ ] Browse word sets by level
  - [ ] Browse word sets by theme
  - [ ] Filter by language pair
  - [ ] Add/remove word sets from study plan
  - [ ] Track progress per word set
  - [ ] Manage personal word list (manually added words)
  - [ ] Export personal word list to CSV

---

## 📊 Phase 4: Quality Assurance (Ongoing)

### 4.1 Manual Testing Checklist
- [ ] **Core flows**
  - [ ] Registration & Login
  - [ ] Study quiz completion
  - [ ] Review quiz completion
  - [ ] Progress tracking
  - [ ] Settings changes persist

- [ ] **Edge cases**
  - [ ] Slow network
  - [ ] Offline mode
  - [ ] App backgrounding
  - [ ] Low battery mode
  - [ ] Accessibility features

### 4.2 User Acceptance Testing
- [ ] **Beta testing program**
  - [ ] Recruit 10-20 beta testers
  - [ ] Provide testing guidelines
  - [ ] Collect structured feedback
  - [ ] Track bugs and feature requests

- [ ] **Feedback incorporation**
  - [ ] Prioritize critical issues
  - [ ] Quick wins for UX improvements
  - [ ] Log future enhancements

### 4.3 Performance Benchmarks
- [ ] **Define metrics**
  - [ ] Load time < 3s on 3G
  - [ ] Time to Interactive < 5s
  - [ ] Lighthouse score > 90
  - [ ] Bundle size < 500KB (gzipped)

- [ ] **Monitoring**
  - [ ] Setup analytics (Google Analytics/Plausible)
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring (Web Vitals)

---

## 🗓️ Estimated Timeline

### Week 1-2: Mobile UI Polish + Testing Setup
- Complete mobile layout audit
- Fix all layout issues
- Setup automated testing framework
- Create initial test suite

### Week 3-4: Authentication Enhancement
- Implement Google OAuth
- Implement Apple Sign-In
- Enhance registration flow
- Test auth flows thoroughly

### Week 5-7: Word Sets & Extended Languages
- Implement CEFR word sets (A1-C2)
- Create 15+ thematic word sets
- Add support for 5 new languages (Arabic, Romanian, Serbian, Polish, Turkish)
- Build word set management UI
- Import word databases

### Week 8-9: Quality Assurance
- Comprehensive manual testing
- Beta testing program
- Performance benchmarking
- Bug fixes and optimizations

### Week 10-12: Android Optimization (Optional)
- Audit current Android app
- Implement Android-specific features
- Update Play Store listing
- Internal testing and release

### Week 13-15: iOS Development (Optional)
- Setup Apple Developer account
- Develop iOS app (wrapper or native)
- TestFlight beta testing
- Prepare App Store submission

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] Lighthouse score > 90 on all pages
- [ ] 0 critical accessibility issues
- [ ] Load time < 3s on 3G
- [ ] Bundle size < 500KB gzipped
- [ ] Crash-free rate > 99.5%

### User Metrics
- [ ] Beta tester satisfaction > 4.5/5
- [ ] App Store rating > 4.5/5
- [ ] Play Store rating > 4.5/5
- [ ] User retention (Day 7) > 40%
- [ ] Quiz completion rate > 70%

### Business Metrics
- [ ] 100+ active users in first month
- [ ] 500+ app installs (combined iOS + Android)
- [ ] 1000+ registered users
- [ ] Positive reviews > 80%

---

## 🚨 Risk Mitigation

### Technical Risks
- **Risk**: Browser compatibility issues on iOS
  - *Mitigation*: Test on real iOS devices early

- **Risk**: App Store rejection (iOS)
  - *Mitigation*: Study guidelines thoroughly, ensure compliance

- **Risk**: Performance degradation on low-end devices
  - *Mitigation*: Test on budget Android phones, optimize aggressively

### Business Risks
- **Risk**: Low user adoption
  - *Mitigation*: Marketing plan, soft launch, iterate based on feedback

- **Risk**: High churn rate
  - *Mitigation*: Strong onboarding, gamification, push notifications

---

## 📝 Notes

### Priority Order
- **Phase 1 (Mobile UI)** is **CRITICAL** - must complete first, blocks everything else
- **Phase 2 (Auth)** is **HIGH** - essential for user retention and security
- **Phase 3 (Word Sets & Languages)** is **HIGH** - core content expansion for growth
- **Phase 4 (QA)** is **HIGH** - continuous throughout all phases, intensifies before launch
- **Phase 5 (Android)** is **MEDIUM** - optional for initial web release, can defer
- **Phase 6 (iOS)** is **LOW** - optional for initial release, lowest priority

### Development Philosophy
- Focus on **web platform first** - PWA works on all devices
- **Android and iOS native apps are optional** enhancements, not requirements
- They should always be the **last two items** in any release plan
- Web version must be excellent before investing in native apps
- Native apps add distribution, not core functionality

### Execution Strategy
- Complete Phases 1-4 for **minimum viable release**
- Launch web version to gather user feedback
- Only proceed to Phases 5-6 if there's proven demand and resources
- Keep updating this plan as priorities shift

**Last Updated**: 2025-12-06
**Next Review**: After Phase 1 completion
