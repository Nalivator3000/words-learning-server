# 🧪 Testing Guide - FluentFlow Pre-Release

## 🎯 Testing Objectives

Before Android release, we need to verify:
1. ✅ All core features work correctly
2. ✅ Mobile UX is optimized (touch targets, keyboard, responsiveness)
3. ✅ PWA functions offline
4. ✅ Performance meets targets (Lighthouse 90+)
5. ✅ No critical bugs or crashes
6. ✅ Security headers configured correctly

---

## 📱 PHASE 1: Manual Feature Testing

### 1.1 Authentication ✅
- [ ] **Register new account**
  - Go to registration page
  - Enter: email, password (min 8 chars), confirm password
  - Submit form
  - Verify: Redirects to dashboard, user is logged in
  - Check: JWT token stored in localStorage

- [ ] **Login existing account**
  - Logout first
  - Enter credentials
  - Submit
  - Verify: Dashboard loads with user data

- [ ] **Logout**
  - Click logout button
  - Verify: Redirects to login, localStorage cleared

- [ ] **Password validation**
  - Try weak password (< 8 chars)
  - Verify: Error message shown
  - Try mismatched passwords
  - Verify: Error shown

### 1.2 Import Words 📥
- [ ] **Manual word entry**
  - Click "Add Word" or "Import" → "Manual"
  - Enter: German word, English translation
  - Submit
  - Verify: Word appears in word list

- [ ] **CSV Import**
  - Prepare test CSV (10-20 words)
  - Click "Import" → "CSV"
  - Upload file
  - Verify: All words imported, shown in list
  - Check: No duplicates created

- [ ] **Batch import**
  - Import 50+ words at once
  - Verify: All imported successfully
  - Check: No performance issues

### 1.3 Study Mode 📚
- [ ] **Start study session**
  - Click "Study" button
  - Verify: Card shows German word
  - Click "Show Answer"
  - Verify: English translation revealed

- [ ] **Answer options**
  - Test: "Again", "Hard", "Good", "Easy" buttons
  - Verify: Each updates progress
  - Verify: Next card appears

- [ ] **Study session completion**
  - Complete 10+ cards
  - Verify: Session summary shown (XP gained, accuracy, time)
  - Verify: Words moved to review queue

- [ ] **Study with no new words**
  - Study all available words first
  - Try to start new study session
  - Verify: Message "No new words available"

### 1.4 SRS Review 🔄
- [ ] **Review due words**
  - Wait 24 hours OR manually adjust due dates in DB
  - Click "Review" button
  - Verify: Due words shown

- [ ] **Review intervals**
  - Answer "Easy" on a word
  - Check DB: interval should increase (e.g., 1d → 4d → 10d)
  - Answer "Again"
  - Check: interval resets to 1 day

- [ ] **Review completion**
  - Complete all due reviews
  - Verify: Congratulations message
  - Verify: XP awarded

### 1.5 Statistics 📊
- [ ] **Dashboard stats**
  - Navigate to Stats page
  - Verify: Total words, mastered words, due today
  - Verify: Streak counter accurate
  - Verify: Daily goal progress shown

- [ ] **Heatmap calendar**
  - Check: Last 30 days shown
  - Verify: Days with activity highlighted
  - Hover: Tooltip shows details (words learned, reviews)

- [ ] **Charts**
  - Verify: Retention rate chart renders
  - Verify: Words learned over time graph accurate
  - Verify: Review distribution chart shown

### 1.6 Gamification 🎮
- [ ] **XP System**
  - Complete study session
  - Verify: XP gained (shown in toast notification)
  - Check: XP bar updates on dashboard

- [ ] **Leveling**
  - Gain enough XP to level up
  - Verify: Level up animation/notification
  - Check: Level shown in profile

- [ ] **Achievements**
  - Trigger achievement (e.g., "First Word Learned")
  - Verify: Achievement unlocked notification
  - Navigate to Achievements page
  - Verify: Achievement badge displayed

- [ ] **Streaks**
  - Complete study/review on consecutive days
  - Verify: Streak counter increments
  - Miss a day (or manually adjust dates)
  - Verify: Streak resets to 0

### 1.7 Settings ⚙️
- [ ] **Dark Mode Toggle**
  - Click theme toggle
  - Verify: Entire app switches to dark theme
  - Verify: Preference saved (reload page, still dark)

- [ ] **Daily Goal**
  - Change daily word goal (e.g., from 10 to 20)
  - Verify: Dashboard reflects new goal
  - Study words
  - Verify: Progress bar accurate

- [ ] **Language Settings**
  - Change target language (if multi-language supported)
  - Verify: Interface updates

### 1.8 Offline Mode 🌐
- [ ] **Service Worker installed**
  - Open DevTools → Application → Service Workers
  - Verify: Service worker registered and active

- [ ] **Offline study**
  - Load app online (ensure data cached)
  - Disconnect network (DevTools → Network → Offline)
  - Navigate pages
  - Verify: App still works (static pages load)
  - Try study mode
  - Verify: Cached words available

- [ ] **Sync on reconnect**
  - Complete reviews offline
  - Reconnect network
  - Verify: Progress synced to server

---

## 📱 PHASE 2: Mobile UX Testing

### 2.1 Responsive Design
- [ ] **Test on multiple screen sizes**
  - DevTools → Responsive mode
  - Test: 360x640 (small phone)
  - Test: 375x667 (iPhone SE)
  - Test: 390x844 (iPhone 14)
  - Test: 412x915 (Pixel 7)
  - Verify: No horizontal scroll
  - Verify: All elements visible, not cut off

- [ ] **Touch targets**
  - Measure button sizes (DevTools → Inspect)
  - Verify: All buttons minimum 48x48px
  - Test: Tap buttons on mobile
  - Verify: Easy to tap, no mis-taps

### 2.2 Keyboard Behavior
- [ ] **Input fields**
  - Tap input field on mobile
  - Verify: Keyboard appears
  - Verify: Input field not hidden behind keyboard
  - Type text
  - Verify: Text visible while typing

- [ ] **Submit on Enter**
  - Type in input, press Enter
  - Verify: Form submits (not just desktop, test mobile too)

### 2.3 Gestures
- [ ] **Swipe gestures** (if implemented)
  - Test swipe left/right on flashcard
  - Verify: Card flips or shows next/previous

- [ ] **Pull to refresh**
  - Pull down on page
  - Verify: Doesn't trigger browser refresh (PWA should prevent)

### 2.4 Orientation
- [ ] **Portrait mode**
  - App forced to portrait (check manifest.json)
  - Rotate device to landscape
  - Verify: App stays portrait OR adapts gracefully

---

## 📱 PHASE 3: Performance Testing (Lighthouse)

### 3.1 Run Lighthouse Audit
```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select:
   - Device: Mobile
   - Categories: Performance, Accessibility, Best Practices, SEO, PWA
4. Click "Analyze page load"
```

### 3.2 Target Scores
- [ ] **Performance**: 90+ ⚡
  - First Contentful Paint (FCP): < 1.8s
  - Largest Contentful Paint (LCP): < 2.5s
  - Time to Interactive (TTI): < 3.8s
  - Total Blocking Time (TBT): < 200ms
  - Cumulative Layout Shift (CLS): < 0.1

- [ ] **Accessibility**: 90+ ♿
  - Color contrast: 4.5:1 minimum
  - All images have alt text
  - Buttons have accessible names
  - Form fields have labels

- [ ] **Best Practices**: 90+ ✅
  - HTTPS enabled
  - No console errors
  - Images sized correctly
  - No deprecated APIs

- [ ] **SEO**: 90+ 🔍
  - Meta description present
  - Page has <title>
  - Viewport meta tag correct
  - Font sizes legible

- [ ] **PWA**: 100 📱
  - Installable
  - Service Worker registered
  - Works offline
  - manifest.json valid

### 3.3 Performance Optimization Checks
- [ ] **Images**
  - All images optimized (use WebP or compressed PNG)
  - Lazy loading enabled: `<img loading="lazy">`
  - Proper sizes (no 2000px images scaled to 100px)

- [ ] **JavaScript**
  - Minified (check dist/ folder)
  - No large libraries (check bundle size)
  - Async/defer on non-critical scripts

- [ ] **CSS**
  - Minified
  - Critical CSS inlined (optional)
  - Remove unused CSS (PurgeCSS)

- [ ] **Caching**
  - Static assets cached (Service Worker)
  - Cache headers set (server-side)

---

## 📱 PHASE 4: Security Testing

### 4.1 Security Headers (Helmet.js)
```bash
# Check headers with curl
curl -I https://fluentflow.app
```

- [ ] **Expected headers**:
  - `Strict-Transport-Security: max-age=15552000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy: ...`

### 4.2 Rate Limiting
- [ ] **General rate limit**
  - Send 100+ requests rapidly
  - Verify: 429 Too Many Requests after limit

- [ ] **Auth rate limit**
  - Try login 5+ times with wrong password
  - Verify: Account locked or CAPTCHA required

### 4.3 Input Validation
- [ ] **XSS Prevention**
  - Try entering: `<script>alert('XSS')</script>` in word field
  - Verify: Sanitized, not executed

- [ ] **SQL Injection**
  - Try: `'; DROP TABLE users; --` in login
  - Verify: Treated as string, not SQL command

### 4.4 Authentication
- [ ] **JWT expiration**
  - Login, wait for token expiry (check JWT_EXPIRES_IN)
  - Try API request with expired token
  - Verify: 401 Unauthorized, redirect to login

- [ ] **Protected routes**
  - Logout, manually navigate to /dashboard
  - Verify: Redirected to login

---

## 📱 PHASE 5: Cross-Browser Testing

### 5.1 Chrome (Primary)
- [ ] Desktop: Latest Chrome
- [ ] Android: Chrome Mobile

### 5.2 Safari (iOS compatibility)
- [ ] iOS Safari (if available)
- [ ] Check: PWA installation on iOS

### 5.3 Firefox
- [ ] Desktop: Latest Firefox
- [ ] Verify: All features work

### 5.4 Edge
- [ ] Desktop: Latest Edge (Chromium)

---

## 📱 PHASE 6: Database & API Testing

### 6.1 Database Integrity
- [ ] **User data**
  - Create user, add words, logout
  - Login again
  - Verify: All data persisted

- [ ] **Concurrent users**
  - Open 2 browser windows (different accounts)
  - Perform actions simultaneously
  - Verify: No data leakage between users

### 6.2 API Endpoints
Test all API routes manually or with Postman:

- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] `GET /api/words`
- [ ] `POST /api/words`
- [ ] `PUT /api/words/:id`
- [ ] `DELETE /api/words/:id`
- [ ] `POST /api/import/csv`
- [ ] `GET /api/review/due`
- [ ] `POST /api/review/submit`
- [ ] `GET /api/stats`
- [ ] `GET /api/achievements`

Verify:
- [ ] Correct responses (200, 201, 400, 401, 404)
- [ ] Proper error messages
- [ ] Rate limiting applied

---

## 📱 PHASE 7: Edge Cases & Error Handling

### 7.1 Empty States
- [ ] **No words**
  - New user with 0 words
  - Verify: "Import words to get started" message

- [ ] **No due reviews**
  - All reviews completed
  - Verify: "No reviews due, come back later!"

### 7.2 Network Errors
- [ ] **Slow connection**
  - DevTools → Network → Slow 3G
  - Navigate app
  - Verify: Loading states shown, no crashes

- [ ] **API timeout**
  - Simulate: server down or delayed response
  - Verify: Error toast shown, retry option

### 7.3 Large Data Sets
- [ ] **1000+ words**
  - Import large CSV (1000 words)
  - Verify: App doesn't freeze
  - Pagination works (if implemented)

### 7.4 Invalid Input
- [ ] **Empty fields**
  - Submit form with empty fields
  - Verify: Validation errors shown

- [ ] **Special characters**
  - Enter: German umlauts (ä, ö, ü, ß)
  - Verify: Saved and displayed correctly

---

## 📱 PHASE 8: Real Device Testing

### 8.1 Android Physical Device
- [ ] **Install TWA app** (after build)
  - `adb install app-release.apk`
  - Open app
  - Verify: Fullscreen (no address bar)

- [ ] **Test all features** on real device
  - Repeat all manual tests from Phase 1

- [ ] **Performance**
  - Check: Smooth animations, no lag
  - Monitor: Battery usage

### 8.2 Different Android Versions
- [ ] Android 10 (API 29)
- [ ] Android 11 (API 30)
- [ ] Android 12+ (API 31+)

---

## ✅ Pre-Launch Checklist

Before submitting to Google Play:

### Code Quality
- [ ] No console.error() in production
- [ ] No hardcoded secrets (check .env usage)
- [ ] All TODOs resolved or documented
- [ ] Code formatted (Prettier/ESLint)

### Documentation
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] README.md updated
- [ ] CHANGELOG.md created

### Assets
- [ ] Icons generated (all sizes)
- [ ] Feature graphic created
- [ ] Screenshots captured (8x)
- [ ] Logo SVG finalized

### Build
- [ ] Production build succeeds: `npm run build`
- [ ] dist/ folder contains minified files
- [ ] APK/AAB signed with production keystore

### Deployment
- [ ] App deployed to production domain (HTTPS)
- [ ] assetlinks.json accessible at /.well-known/assetlinks.json
- [ ] DNS configured correctly
- [ ] SSL certificate valid

### Google Play Console
- [ ] App listing complete (title, description, screenshots)
- [ ] Content rating submitted
- [ ] Pricing set to "Free"
- [ ] Target countries selected
- [ ] Privacy policy URL added

---

## 🐛 Bug Tracking Template

Use this template to document bugs found during testing:

```markdown
## Bug #[NUMBER]: [Short Description]

**Severity**: Critical / High / Medium / Low
**Status**: Open / In Progress / Fixed / Won't Fix

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. ...

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots/Logs**:
[Attach if applicable]

**Environment**:
- Device: [e.g., Pixel 7, iPhone 14]
- OS: [e.g., Android 13, iOS 16]
- Browser: [e.g., Chrome 120]

**Fix**:
[How it was fixed, or notes]
```

---

## 📊 Test Results Summary

After completing all tests:

```
Total Tests: [X]
Passed: [X]
Failed: [X]
Blocked: [X]

Critical Bugs: [X]
High Bugs: [X]
Medium Bugs: [X]
Low Bugs: [X]

Lighthouse Scores:
- Performance: [X]/100
- Accessibility: [X]/100
- Best Practices: [X]/100
- SEO: [X]/100
- PWA: [X]/100

Ready for Launch: ✅ / ❌
```

---

**Created**: 2025-10-24
**For**: FluentFlow Android Pre-Launch
**Status**: Ready to test 🧪
