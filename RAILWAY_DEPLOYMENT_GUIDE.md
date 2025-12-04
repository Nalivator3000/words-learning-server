# 🚂 Railway Deployment Guide - LexyBooster v5.1.4

## ✅ Pre-Deployment Checklist

- [x] All code committed and pushed to GitHub
- [x] Version bumped to 5.1.4 in package.json
- [x] Service Worker version updated to v5.1.4
- [x] Android AAB built: `lexybooster-v5.1.4.aab`
- [x] Migration scripts created and tested
- [x] Mobile UI optimizations completed
- [x] Voice selection unified across all platforms

## 🚀 Deployment Steps

### Step 1: Deploy to Railway

1. **Connect to Railway Dashboard**
   - Go to [railway.app](https://railway.app)
   - Open your LexyBooster project

2. **Trigger Deployment**
   - Railway will auto-deploy from the `develop` branch
   - OR manually trigger: Settings → Deploy from develop
   - Wait for deployment to complete (usually 2-3 minutes)

3. **Verify Deployment**
   - Check deployment logs for errors
   - Ensure build succeeds
   - Note: The app will restart automatically

### Step 2: Run Database Migrations

**CRITICAL:** Run these scripts immediately after deployment succeeds.

Open Railway Console (click on your service → "Console" tab) and run:

```bash
# 1. Update ALL daily goals from 5 to 20
node update-daily-goals.js
```

Expected output:
```
✅ Updated 35 records:
   37 records: 5 → 20 words
   (Any custom user settings preserved)
```

```bash
# 2. Update TODAY's goals specifically
node update-today-goals.js
```

Expected output:
```
✅ Updated 2 goal(s) for today:
   User 5: 0/20 words
   User X: Y/20 words
```

### Step 3: Verify Changes

Run diagnostic scripts in Railway Console:

```bash
# Check daily goals are updated
node check-user-goals.js
```

Expected output:
```
📊 Goals for today:
  User ID: 5
    📚 Words: 0/20 ✅
    ⭐ XP: 0/50
    ⏳ In progress
```

```bash
# Check review words are detected
node check-review-words.js
```

Expected output:
```
📊 Words by status:
  review_1: 139 words
  review_3: 22 words
  review_7: 2 words
  review_14: 1 words
  Total: 164 review words ✅
```

### Step 4: Test Frontend

1. **Open your app** (your Railway URL)

2. **Hard refresh browser**
   - Windows: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
   - Or clear Service Worker cache manually

3. **Test Mobile Navigation**
   - Bottom navigation bar visible with 5 buttons
   - Theme toggle in navigation (🌙/☀️)
   - No clipping or overlap with browser UI

4. **Verify Dashboard**
   - Daily Goals should show: "Words Learned 0 / 20"
   - Not "0 / 5" ❌

5. **Verify Statistics → Review Section**
   - Should show 7 stages with real counts:
     - 🌱 1 day: 139
     - 🌿 3 days: 22
     - 🌳 7 days: 2
     - 🎋 14 days: 1
     - 🏆 30 days: 0
     - ⭐ 60 days: 0
     - 👑 120 days: 0
   - Not all zeros ❌

6. **Verify Review Badges**
   - Go to Statistics → Review words
   - Each word should have colored badge:
     - Example: 🌱 1 day (green)
     - Example: 🌿 3 days (blue)

7. **Verify Quiz Layout (Mobile)**
   - Start any quiz on mobile device
   - Progress bar and "Question X of 10" clearly visible
   - No empty space below buttons
   - Buttons not clipped at bottom
   - Feedback text wraps properly (no overflow)
   - Layout doesn't "jump" when buttons appear/disappear

8. **Verify Voice Quality**
   - Test pronunciation on both web and mobile
   - Should use same high-quality local voices
   - No "terrible" cloud voices on mobile

### Step 5: Mobile App Update

**For Web Users:**
- Hard refresh will load new version immediately

**For Android TWA App Users:**
- App will auto-update within 24 hours
- To force update:
  1. Force stop app: Settings → Apps → LexyBooster → Force Stop
  2. Clear cache (optional): Settings → Apps → LexyBooster → Clear Cache
  3. Reopen app

**Upload to Google Play Store:**
1. Go to Google Play Console
2. Upload `lexybooster-v5.1.4.aab`
3. Use release notes from `PLAY_STORE_RELEASE_NOTES_5.1.4.txt`
4. Submit for review

## 🐛 Troubleshooting

### Problem: Daily goals still show "0/5"

**Causes:**
1. Migration script not run
2. Browser cache not cleared
3. API endpoint still has old code

**Solutions:**
```bash
# Railway Console:
node check-user-goals.js  # Check current state
node update-today-goals.js  # Update if needed

# Browser:
Ctrl+F5 (hard refresh)
```

### Problem: Review section shows all zeros

**Causes:**
1. Server still running old code
2. API endpoint not returning detailed counts
3. Frontend cache not cleared

**Solutions:**
```bash
# Railway Console:
node check-review-words.js  # Verify DB has review words

# Verify API:
curl "https://your-app.railway.app/api/words/counts?userId=5&languagePairId=7"
# Should return: {"review_1": 139, "review_3": 22, ...}

# Browser:
Ctrl+F5 (hard refresh)
Clear Service Worker:
  DevTools → Application → Service Workers → Unregister
```

### Problem: Progress bar still invisible

**Causes:**
1. CSS cache not cleared
2. Old Service Worker active

**Solutions:**
```bash
# Browser:
1. Hard refresh: Ctrl+F5
2. Check Network tab: style.css?v=5.1.3
3. Clear Service Worker if needed
```

### Problem: "No such file" when running scripts

**Cause:** Scripts not deployed to Railway

**Solution:**
```bash
# Push to GitHub first:
git add update-daily-goals.js update-today-goals.js check-*.js
git commit -m "Add migration scripts"
git push

# Wait for Railway to redeploy
# Then run scripts
```

## 📊 Expected Results After Deployment

| Feature | Before | After |
|---------|--------|-------|
| Daily Goals | 0/5 words | 0/20 words ✅ |
| Review Stages | 2 stages (7d, 30d) | 7 stages (1d, 3d, 7d, 14d, 30d, 60d, 120d) ✅ |
| Review Counts | All zeros | Real counts (164 total) ✅ |
| Review Badges | None | Color-coded stage badges ✅ |
| Progress Bar | Invisible | Clearly visible with glow ✅ |
| Mobile Navigation | Top bar (hidden) | Bottom bar with 5 buttons ✅ |
| Mobile Quiz Layout | Clipped/jumping | Stable with no empty space ✅ |
| Voice Quality | Different mobile/web | Unified local voices ✅ |
| Theme Toggle | Header only | Header + Nav with single icon ✅ |
| Service Worker | v5.2.4 | v5.1.4 ✅ |

## ✅ Success Criteria

Deployment is successful when:

- ✅ Daily goals show "X / 20" (not 5)
- ✅ Review section shows 7 stages with correct counts
- ✅ Review badges appear on word cards
- ✅ Progress bar visible in quiz (dark theme)
- ✅ Mobile navigation at bottom with 5 buttons
- ✅ Mobile quiz layout stable (no clipping or jumping)
- ✅ Voice quality same on mobile and web
- ✅ Theme toggle shows single icon (🌙 or ☀️)
- ✅ No console errors
- ✅ Service Worker version is v5.1.4
- ✅ All CSS/JS files load with ?v=5.1.4

## 📝 Post-Deployment Notes

### Database State
After migration, you should see:
```
words_goal = 20: ~72 records (all updated)
words_goal = 10: 1 record (custom user setting, preserved)
words_goal = 5: 0 records ✅
```

### API Endpoints to Test
```bash
# Daily goals
GET /api/gamification/daily-goals/:userId
# Should return: {"words_goal": 20}

# Review counts
GET /api/words/counts?userId=5&languagePairId=7
# Should return: {"review_1": 139, "review_3": 22, ...}
```

### Files Modified in This Release

**Server:**
- `server-postgresql.js` - Lines 2731, 10827-10863

**Frontend:**
- `public/index.html` - Lines 514-547 (review grid)
- `public/app.js` - Lines 740-757 (review stats), 859-880 (badges)
- `public/style.css` - Lines 611-625 (dark theme), 1554-1579 (z-index)
- `public/translations/source-texts.json` - Added 5 new keys

**Migration Scripts:**
- `update-daily-goals.js` - Update all records
- `update-today-goals.js` - Update today's records
- `check-user-goals.js` - Verify goals state
- `check-review-words.js` - Verify review words

**Documentation:**
- `DEPLOYMENT_SUMMARY_v5.1.3.md`
- `CACHE_BUSTING_SOLUTION.md`
- `RAILWAY_DEPLOYMENT_GUIDE.md` (this file)

## 🎉 You're Ready!

All code is pushed to GitHub. Railway will auto-deploy from the `develop` branch.

**Next Actions:**
1. ✅ Check Railway dashboard for deployment completion
2. ✅ Run migration scripts in Railway Console
3. ✅ Verify changes in browser (hard refresh!)
4. ✅ Upload AAB to Google Play Store

---

**Version:** 5.1.4
**Build Date:** December 4, 2025
**Deployment Target:** Railway
**Branch:** develop
**Major Features:**
- Mobile UI optimization (bottom navigation, stable quiz layout)
- Unified voice selection (local voices for all platforms)
- Enhanced theme toggle (dual buttons, single icon display)

Good luck with the deployment! 🚀
