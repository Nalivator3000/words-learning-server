# 🏪 Google Play Console Setup Guide - LexiBooster

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google account (Gmail)
- [ ] $25 USD for one-time registration fee
- [ ] Valid payment method (credit/debit card)
- [ ] Government-issued ID for verification
- [ ] All store listing materials ready (see GOOGLE_PLAY_LISTING.md)
- [ ] APK/AAB file ready (will be created with Bubblewrap)
- [ ] Privacy Policy published and accessible
- [ ] Terms of Service published and accessible

**Estimated Time:** 2-3 hours for initial setup + 2-3 days for verification

---

## 🚀 Step-by-Step Setup Process

### Phase 1: Create Google Play Developer Account (30 minutes)

#### Step 1.1: Register Developer Account

1. Go to: https://play.google.com/console/signup
2. Sign in with your Google account
3. Read and accept the **Google Play Developer Distribution Agreement**
4. Click "Continue to payment"

#### Step 1.2: Pay Registration Fee

1. **Fee**: $25 USD (one-time, lifetime access)
2. Enter payment details (credit/debit card)
3. Complete payment
4. Save receipt for records

#### Step 1.3: Complete Developer Profile

1. **Developer name**: `LexiBooster Team` or your name
2. **Email**: Your contact email (public, visible to users)
3. **Website** (optional but recommended):
   ```
   https://words-learning-server-copy-production.up.railway.app
   ```
4. **Phone number** (optional)

#### Step 1.4: Verify Identity

Google requires identity verification for all new developers:

1. Upload government-issued ID (passport, driver's license, etc.)
2. Wait 2-3 days for verification email
3. Check spam folder if not received
4. Cannot publish apps until verified ✅

**⏰ WAIT:** Identity verification takes 2-3 business days. Continue with app preparation while waiting.

---

### Phase 2: Create New App Listing (1 hour)

#### Step 2.1: Create App

1. Go to Google Play Console: https://play.google.com/console
2. Click "Create app"
3. Fill in basic details:

**App Details:**
```
App name: LexiBooster
Default language: English (United States)
App or game: App
Free or paid: Free
```

4. Declare if app is designed for children: **No**
5. Accept developer program policies
6. Click "Create app"

#### Step 2.2: Set Up Store Listing

Navigate to: **Grow → Store presence → Main store listing**

**App name:**
```
LexiBooster: Language Learning & SRS
```
(37 characters, max 50)

**Short description:**
```
Master languages with spaced repetition, gamification & streak tracking.
```
(72 characters, max 80)

**Full description:**
```
(Copy from GOOGLE_PLAY_LISTING.md - Full Description section)
```
(~3,200 characters, max 4,000)

**App icon:**
- Upload: `public/icons/icon-512x512.png`
- Format: 512x512px PNG
- ✅ Already created

**Feature graphic:**
- Upload: `public/store-assets/feature-graphic.png`
- Format: 1024x500px PNG
- ✅ Already created (or create if missing)

**Screenshots:**
Upload 2-8 screenshots (1080x2400px):
1. `01-home-dashboard.png` ✅
2. `02-study-mode.png`
3. `03-review-section.png`
4. `04-statistics.png`
5. `05-leaderboard.png`
6. `06-achievements.png`
7. `07-dark-mode.png`
8. `08-settings.png`

**Video (optional):**
- YouTube URL if you have a promo video
- Skip for first release

**Click "Save"**

---

#### Step 2.3: Categorization & Tags

Navigate to: **Store settings → Store listing**

**App category:**
```
Primary: Education
```

**Tags (up to 5):**
```
1. language learning
2. vocabulary
3. flashcards
4. spaced repetition
5. education
```

**Click "Save"**

---

#### Step 2.4: Contact Details

Navigate to: **Store settings → Store listing contact details**

**Email:**
```
(Your email - required, public)
```

**Website:**
```
https://words-learning-server-copy-production.up.railway.app
```

**Phone:** (optional, leave blank)

**Click "Save"**

---

### Phase 3: Content Rating (15 minutes)

Navigate to: **Policy → App content → Content ratings**

Click "Start questionnaire"

#### IARC Questionnaire Answers for LexiBooster:

**Section 1: General Questions**

1. **What is your email address?**
   - Enter your email

2. **What category best describes your app?**
   - Select: **Education, Reference, or News**

3. **Does your app contain any of the following?**

   - Violence: **No**
   - Sexual content: **No**
   - Profanity or crude humor: **No**
   - Drug, alcohol, or tobacco use: **No**
   - Gambling simulation: **No**
   - Location sharing: **No**
   - User interaction features: **Yes**
     - ✅ Check: "Users can interact" (leaderboard, sharing achievements)
     - ❌ Uncheck: "Unrestricted web access"
   - Realistic depiction of weapons: **No**
   - Horror or scary content: **No**

**Section 2: Privacy & Data Collection**

1. **Does your app share location data?**: **No**
2. **Does your app allow users to create content?**: **No**
   - (Users create word lists, but it's personal data, not UGC)
3. **Does your app require users to log in?**: **Yes**
4. **Does your app access internet?**: **Yes**
   - For: Sync and leaderboards

**Section 3: Additional Questions**

- All: **No** (violence, drugs, gambling, etc.)

**Result:**
- Expected Rating: **Everyone (3+)** or **Everyone 10+**
- All regions: ESRB Everyone, PEGI 3, etc.

**Click "Submit" → "Apply rating"**

---

### Phase 4: Privacy Policy & Data Safety (20 minutes)

#### Step 4.1: Privacy Policy

Navigate to: **Policy → App content → Privacy policy**

**Privacy policy URL:**
```
https://words-learning-server-copy-production.up.railway.app/privacy.html
```

**Click "Save"**

#### Step 4.2: Data Safety

Navigate to: **Policy → App content → Data safety**

This section requires detailed answers about data collection.

**For LexiBooster:**

1. **Does your app collect or share any of the required user data types?**
   - Yes

2. **Data types collected:**

   **Personal info:**
   - ✅ Name (for user profile)
   - ✅ Email address (for authentication)
   - ❌ Other identifiers

   **App activity:**
   - ✅ App interactions (study progress, quiz results)
   - ❌ Other actions

   **App info and performance:**
   - ✅ Crash logs (Firebase/error tracking if used)

3. **Is all of the user data collected by your app encrypted in transit?**
   - **Yes** (HTTPS)

4. **Do you provide a way for users to request that their data be deleted?**
   - **Yes** (Account deletion feature or manual request)

5. **Data usage and handling:**

   For each data type, specify:
   - **Collection**: Yes
   - **Sharing**: No (unless using third-party analytics)
   - **Optional/Required**: Required
   - **Purpose**:
     - Account management
     - App functionality
     - Personalization
     - Analytics (if applicable)

**Click "Save" after each section**

---

### Phase 5: Upload App Bundle (30 minutes)

Navigate to: **Release → Production → Create new release**

#### Step 5.1: Prepare AAB/APK

You'll need an Android App Bundle (.aab) or APK file.

**For TWA (Trusted Web Activity):**

1. Install Bubblewrap CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. Initialize TWA:
   ```bash
   bubblewrap init --manifest https://words-learning-server-copy-production.up.railway.app/manifest.json
   ```

3. Build APK:
   ```bash
   bubblewrap build
   ```

4. (Optional) Build AAB for Play Store:
   ```bash
   bubblewrap build --skipPwaValidation
   ```

**See separate guide:** `TWA_BUILD_GUIDE.md` (to be created)

#### Step 5.2: Upload Bundle

1. Click "Upload" in app bundles section
2. Select your `.aab` or `.apk` file
3. Wait for upload and processing
4. Google will validate:
   - File integrity
   - Signing certificate
   - Permissions
   - Target SDK version

#### Step 5.3: Release Notes

**Release name:**
```
Initial Release - v1.0.0
```

**Release notes:**
```
🎉 Welcome to LexiBooster!

LexiBooster is now available on Google Play! Master any language with:

✨ Features:
• Spaced Repetition System (SRS) for optimal learning
• 5 study modes: Multiple Choice, Typing, Word Building, Survival, Complex
• Gamification: XP, levels, achievements, badges, streaks
• Global and weekly leaderboards
• Detailed analytics and progress tracking
• Dark mode for comfortable study
• Offline mode - learn anywhere
• 6 UI languages: English, Russian, German, Spanish, French, Italian

🚀 Start your language learning journey today!

No ads. No subscriptions. Free forever.
```

**Click "Save"**

---

### Phase 6: Set Up Pricing & Distribution (10 minutes)

Navigate to: **Release → Production → Countries/regions**

#### Step 6.1: Select Countries

**Recommended for first release:**
- ✅ All countries (201 countries)
- OR select specific regions:
  - United States
  - United Kingdom
  - Canada
  - Germany
  - France
  - Spain
  - Russia
  - (Add more as needed)

**Click "Add countries/regions" → "Select all" → "Add"**

#### Step 6.2: Pricing

**App price:**
```
Free
```

**In-app products:**
```
None (for initial release)
```

**Distributed as:**
```
Free app
```

**Click "Save"**

---

### Phase 7: Review & Submit (15 minutes)

#### Step 7.1: Pre-Launch Report (Optional but Recommended)

Google offers free automated testing:

Navigate to: **Release → Testing → Pre-launch report**

1. Enable pre-launch report
2. Google will test on 10-20 devices
3. Receive report in 1-2 hours with:
   - Crashes
   - Performance issues
   - Accessibility warnings
   - Security vulnerabilities

**Recommended**: Wait for pre-launch report before production release

#### Step 7.2: Final Review Checklist

Before submitting, ensure all sections are complete:

- [ ] Store listing (title, description, icon, screenshots)
- [ ] Content rating (IARC questionnaire complete)
- [ ] Privacy policy URL added
- [ ] Data safety form completed
- [ ] App bundle uploaded
- [ ] Release notes written
- [ ] Countries selected
- [ ] Pricing set (free)
- [ ] App content declarations (ads, target audience)

Navigate to: **Dashboard → View release** to see missing items

#### Step 7.3: Submit for Review

1. Navigate to: **Release → Production → Review release**
2. Review all information carefully
3. Click "Start rollout to Production"
4. Confirm submission

**⏰ Review Time:** Google typically reviews apps within 3-7 days

---

## 📊 Post-Submission: What Happens Next?

### Day 1-7: Review Process

1. **Under review** status appears
2. Google's automated and manual review
3. Checks for:
   - Policy violations
   - Malware
   - Deceptive behavior
   - Copyrighted content
   - Functionality issues

**Possible outcomes:**
- ✅ **Approved**: App goes live within hours
- ⚠️ **Needs info**: Google requests clarification
- ❌ **Rejected**: Policy violation (rare for education apps)

### If Approved ✅

1. **App goes live** on Google Play Store
2. You'll receive email confirmation
3. Search for "LexiBooster" on Play Store
4. Share the link:
   ```
   https://play.google.com/store/apps/details?id=com.LexiBooster.app
   ```

### If Rejected ❌

1. Read rejection email carefully
2. Common reasons:
   - Privacy policy issues
   - Misleading descriptions
   - Missing permissions declarations
   - Content rating inaccuracies
3. Fix issues and resubmit
4. Appeal if you believe it's a mistake

---

## 🎯 First Week After Launch

### Day 1: Launch Day
- [ ] Monitor crashes in Play Console
- [ ] Check reviews and respond
- [ ] Share app link on social media
- [ ] Post on r/languagelearning (Reddit)
- [ ] Email friends/beta testers

### Day 2-7: Active Monitoring
- [ ] Daily: Check crash reports
- [ ] Daily: Respond to reviews (especially negative ones)
- [ ] Track: Install numbers, retention rate
- [ ] Fix: Any critical bugs ASAP

### Week 1 Metrics to Track:
- Total installs
- Daily active users (DAU)
- Crash-free rate (target: 99%+)
- Average rating (target: 4.0+)
- Day 1 retention (target: 40%+)
- Day 7 retention (target: 20%+)

---

## 🔧 Common Issues & Solutions

### Issue 1: "App not compliant with target API level"

**Solution:**
- Ensure your app targets API level 33 (Android 13) or higher
- Update `build.gradle` or Bubblewrap config
- Rebuild and upload new version

### Issue 2: "Privacy policy URL not accessible"

**Solution:**
- Ensure privacy.html is publicly accessible
- Check HTTPS works (no SSL errors)
- Privacy policy must be on same domain as app or subdomain

### Issue 3: "Screenshots don't match app content"

**Solution:**
- Use actual app screenshots (not mockups)
- Show real content (not Lorem Ipsum)
- Ensure resolution is 1080x2400px

### Issue 4: "App bundle signature mismatch"

**Solution:**
- Use same signing key for all uploads
- Store keystore file safely (you cannot recover it!)
- Never share or commit keystore to Git

---

## 📝 Important Reminders

1. **Save your keystore file!**
   - You cannot update your app without it
   - Store in 2-3 secure locations
   - Password protect it

2. **Package name is permanent**
   - Once set, you cannot change it
   - Choose carefully: `com.LexiBooster.app`

3. **$25 fee is one-time**
   - You can publish unlimited apps
   - No annual renewal

4. **Review process is unpredictable**
   - Can take 1 hour to 7 days
   - Plan accordingly for launch dates

5. **App updates are easier**
   - After first approval, updates are faster
   - Usually approved within 24-48 hours

---

## 🎉 Congratulations!

Once your app is live, you've successfully:
- ✅ Created a Google Play Developer account
- ✅ Published your first Android app
- ✅ Made LexiBooster available to billions of Android users worldwide

**Next steps:**
- Monitor metrics and reviews
- Plan v1.1 update with user feedback
- Market your app to reach more users

---

## 📞 Support & Resources

**Google Play Console:**
- Dashboard: https://play.google.com/console
- Help Center: https://support.google.com/googleplay/android-developer
- Policy Center: https://play.google.com/about/developer-content-policy/

**LexiBooster Resources:**
- Repository: https://github.com/Nalivator3000/words-learning-server
- Privacy Policy: https://words-learning-server-copy-production.up.railway.app/privacy.html
- Terms: https://words-learning-server-copy-production.up.railway.app/terms.html

**Community:**
- Reddit: r/androiddev
- Stack Overflow: [google-play-console] tag

---

**Created**: 2025-10-25
**Status**: Ready for use when Google Play account is created
**Estimated total time**: 4-6 hours (excluding review wait time)
