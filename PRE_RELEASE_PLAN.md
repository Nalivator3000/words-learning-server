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

## 📱 Phase 3: Android App Optimization (Priority: HIGH)

### 3.1 Current APK Audit
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

### 3.2 Android-Specific Features
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

### 3.3 Play Store Optimization
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

### 3.4 Build & Release Process
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

## 🍎 Phase 4: iOS App Development (Priority: MEDIUM)

### 4.1 Apple Developer Setup
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

### 4.2 iOS App Development
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

### 4.3 iOS Testing
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

### 4.4 App Store Submission
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

## 📊 Phase 5: Quality Assurance (Ongoing)

### 5.1 Manual Testing Checklist
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

### 5.2 User Acceptance Testing
- [ ] **Beta testing program**
  - [ ] Recruit 10-20 beta testers
  - [ ] Provide testing guidelines
  - [ ] Collect structured feedback
  - [ ] Track bugs and feature requests

- [ ] **Feedback incorporation**
  - [ ] Prioritize critical issues
  - [ ] Quick wins for UX improvements
  - [ ] Log future enhancements

### 5.3 Performance Benchmarks
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

### Week 5-6: Android Optimization
- Audit current Android app
- Implement Android-specific features
- Update Play Store listing
- Internal testing

### Week 7-8: iOS Development
- Setup Apple Developer account
- Develop iOS app (wrapper or native)
- TestFlight beta testing
- Prepare App Store submission

### Week 9-10: Final QA & Launch
- Comprehensive manual testing
- Beta user feedback incorporation
- Performance optimization
- Soft launch preparation

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

- **Phase 1 (Mobile UI)** is **CRITICAL** - blocks everything else
- **Phase 2 (Auth)** is **HIGH** - needed for user retention
- **Phase 3 (Android)** can start after Phase 1 completion
- **Phase 4 (iOS)** can be parallel to Phase 3
- Keep updating this plan as priorities shift

**Last Updated**: 2025-12-06
**Next Review**: After Phase 1 completion

---

## 📚 Phase 6: Word Sets System & Multi-Language Support (Priority: HIGH)

### 6.1 Word Sets by Levels (CEFR Standard)
- [ ] **Define level structure**
  - [ ] A1 (Beginner) - 500-750 most common words
  - [ ] A2 (Elementary) - 1000-1500 words
  - [ ] B1 (Intermediate) - 2000-3000 words
  - [ ] B2 (Upper Intermediate) - 4000-5000 words
  - [ ] C1 (Advanced) - 5000+ words
  - [ ] C2 (Proficiency) - 8000+ specialized words

- [ ] **Level selection UI**
  - [ ] Level selector on word import page
  - [ ] Visual progress indicators per level
  - [ ] Level completion badges
  - [ ] Graduation to next level mechanism

- [ ] **Word set metadata**
  - [ ] Frequency ranking
  - [ ] Difficulty score
  - [ ] Usage context tags
  - [ ] Audio availability indicator

### 6.2 Thematic Word Sets
- [ ] **Define theme categories**
  - [ ] 🍕 Food & Dining
  - [ ] 🏠 Home & Family
  - [ ] 💼 Work & Office
  - [ ] ✈️ Travel & Tourism
  - [ ] 🏥 Health & Medicine
  - [ ] 🎓 Education
  - [ ] 🎨 Hobbies & Entertainment
  - [ ] 🛒 Shopping
  - [ ] 🌍 Nature & Environment
  - [ ] 💬 Communication & Social
  - [ ] 🏛️ Culture & History
  - [ ] 💻 Technology
  - [ ] ⚖️ Law & Politics
  - [ ] 💰 Finance & Economy
  - [ ] 🔬 Science

- [ ] **Theme selection interface**
  - [ ] Grid view with theme icons
  - [ ] Theme description & word count
  - [ ] Difficulty level per theme
  - [ ] Mix-and-match themes for custom sets

- [ ] **Theme-based study modes**
  - [ ] Thematic quizzes
  - [ ] Context sentences from theme
  - [ ] Real-world scenarios
  - [ ] Theme completion tracking

### 6.3 Extended Language Support

#### Arabic (العربية) Support
- [ ] **Frontend integration**
  - [ ] RTL (Right-to-Left) layout support
  - [ ] Arabic font optimization
  - [ ] Keyboard input handling

- [ ] **TTS & Audio**
  - [ ] Add Arabic voices to AudioManager
  - [ ] Test pronunciation quality

- [ ] **Content**
  - [ ] Arabic word sets (MSA - Modern Standard Arabic)

#### Romanian (Română) Support
- [ ] **Character support** - Diacritics: ă, â, î, ș, ț
- [ ] **TTS & Audio** - Romanian voices
- [ ] **Content** - Romanian word sets by level

#### Serbian (Српски / Srpski) Support
- [ ] **Script support** - Cyrillic (Српски) + Latin (Srpski)
- [ ] **TTS & Audio** - Serbian voices
- [ ] **Content** - Serbian word sets (both scripts)

#### Polish (Polski) Support
- [ ] **Character support** - Polish diacritics: ą, ć, ę, ł, ń, ó, ś, ź, ż
- [ ] **TTS & Audio** - Polish voices
- [ ] **Content** - Polish word sets

#### Turkish (Türkçe) Support
- [ ] **Character support** - Turkish alphabet: ç, ğ, ı, İ, ö, ş, ü
- [ ] **TTS & Audio** - Turkish voices
- [ ] **Content** - Turkish word sets

### 6.4 Implementation Plan
**Week 11-12: Word Sets System**
- Design & implement level/theme selection UI
- Create database schema for word sets
- Import initial German-Russian sets (A1-B2)

**Week 13: Languages Part 1**
- Add Arabic, Romanian, Serbian support

**Week 14: Languages Part 2**
- Add Polish, Turkish support
- Create starter word sets for all languages

---

**Phase 6 Added**: 2025-12-06
