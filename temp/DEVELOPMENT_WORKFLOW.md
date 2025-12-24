# 🔧 Development Workflow - LexyBooster

**Last Updated**: 2025-11-06
**Version**: 5.1.0+
**Status**: Active Development

---

## ⚠️ Critical Development Policies

### 1. Manual Testing Policy

**All manual testing is performed separately from the development flow.**

- ✅ **DO**: Focus on implementation, integration, and code quality
- ✅ **DO**: Write code, create features, fix bugs
- ✅ **DO**: Run automated tests (if available)
- ✅ **DO**: Commit and push changes when implementation is complete
- ❌ **DON'T**: Include manual testing steps in task planning
- ❌ **DON'T**: Wait for manual testing results during development
- ❌ **DON'T**: Block development on user testing feedback
- ❌ **DON'T**: Pause implementation for QA cycles

**Rationale**: Manual testing happens asynchronously by QA/product team. Development velocity should not be blocked by testing cycles.

---

## 🎯 Current Development Mode

### Feature Access Control

New features are deployed with **limited access** (whitelisted users only):

**Whitelisted Users** ([user-manager.js:380-410](public/user-manager.js)):
- User ID: `1` (Demo user)
- Usernames: `demo`, `test`, `admin` (case-insensitive)

**How it works**:
```javascript
hasGamificationAccess() {
    const allowedUsers = [1]; // Demo user
    const allowedUsernames = ['demo', 'test', 'admin'];
    return allowedUsers.includes(this.currentUser.id) ||
           allowedUsernames.includes(this.currentUser.username.toLowerCase());
}
```

**Features with limited access**:
- Weekly Challenges UI
- Leagues & Leaderboards UI
- Personal Rating UI
- Daily Challenges UI
- Streak Freeze UI
- Bug Reports UI

---

## 🚀 Deployment Pipeline

### Auto-Deploy from `develop` branch

**Production**: https://words-learning-server-copy-production.up.railway.app/
- Railway auto-deploys on push to `develop`
- Changes go live within 2-5 minutes
- No manual deployment steps required

**Workflow**:
1. Develop feature locally
2. Commit to `develop` branch
3. Push to GitHub
4. Railway auto-deploys
5. Test on production (for whitelisted users)
6. Collect feedback asynchronously
7. Iterate on next feature

---

## 📋 Development Checklist (Per Feature)

### Before Starting:
- [ ] Read feature requirements
- [ ] Check if backend API exists
- [ ] Plan UI/UX approach
- [ ] Identify files to modify

### During Development:
- [ ] Implement backend (if needed)
- [ ] Implement frontend UI
- [ ] Add CSS styling (dark mode + responsive)
- [ ] Add i18n translation keys
- [ ] Add whitelist access control
- [ ] Test locally (basic smoke test only)

### Before Commit:
- [ ] Verify code quality (no console.log, clean code)
- [ ] Check for security issues (XSS, injection)
- [ ] Ensure dark mode works
- [ ] Ensure mobile responsive
- [ ] Add to navigation (if applicable)

### After Commit:
- [ ] Push to GitHub
- [ ] Wait for Railway auto-deploy
- [ ] Verify production URL loads
- [ ] **STOP** - Manual testing is separate from dev flow

---

## 🧪 Testing Philosophy

### What Developers Test:
- ✅ Code compiles/runs without errors
- ✅ Basic functionality works (smoke test)
- ✅ API endpoints respond correctly
- ✅ UI renders without crashes
- ✅ Dark mode toggle works
- ✅ Mobile viewport scales correctly

### What QA/Product Team Tests:
- UX flow completeness
- Edge cases and error handling
- Cross-browser compatibility
- Real device testing
- User acceptance testing
- Performance under load
- Accessibility compliance

**Developer testing**: 5-10 minutes per feature
**QA testing**: Happens asynchronously, does not block development

---

## 🔄 Iteration Cycle

```
1. Feature Request → 2. Implementation → 3. Commit & Push → 4. Auto-Deploy
                                                                    ↓
                                                            5. Production Live
                                                                    ↓
                                                    6. QA Tests (async) ← User Feedback
                                                                    ↓
                                              7. Bug Reports / Improvements
                                                                    ↓
                                                        Back to Step 1 (next iteration)
```

**Key Point**: Steps 1-4 happen in one session. Steps 5-7 happen asynchronously without blocking new development.

---

## 🛠️ Tech Stack Summary

### Backend
- Node.js + Express
- PostgreSQL (Railway managed)
- JWT authentication
- Rate limiting (3-tier)
- Compression (gzip/brotli)
- Helmet.js security headers

### Frontend
- Vanilla JavaScript (no framework)
- CSS3 (glassmorphism, dark mode)
- i18n system (6 languages)
- Service Worker (PWA)
- Responsive design (mobile-first)

### Deployment
- Railway (auto-deploy from `develop`)
- PostgreSQL (Railway managed DB)
- HTTPS enforced
- Environment variables managed via Railway

---

## 📁 Project Structure

```
words-learning-server/
├── server-postgresql.js        # Main server (10,000+ lines)
├── public/
│   ├── index.html              # Main app
│   ├── app.js                  # Core app logic
│   ├── user-manager.js         # Auth & whitelist
│   ├── gamification.js         # XP, levels, achievements
│   ├── weekly-challenges-ui.js # Weekly challenges (whitelisted)
│   ├── leagues-ui.js           # Leagues system (whitelisted)
│   ├── personal-rating-ui.js   # Rating charts (whitelisted)
│   ├── features-ui.js          # Daily challenges, streak freeze
│   ├── style.css               # Main styles
│   └── [component]-ui.css      # Component-specific styles
├── translations/
│   └── source-texts.json       # i18n keys (626+ keys)
└── [various .md docs]          # Documentation
```

---

## 🔐 Security Checklist

Before committing, verify:
- [ ] No hardcoded secrets/passwords
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] User input is sanitized
- [ ] API endpoints have rate limiting
- [ ] Authentication is required for sensitive endpoints
- [ ] HTTPS enforced in production

---

## 🌍 i18n Guidelines

When adding new UI text:
1. Add key to `translations/source-texts.json`
2. Use `data-i18n="key_name"` attribute in HTML
3. Use `i18n.t('key_name')` in JavaScript
4. English translation is primary (other languages can use English fallback initially)
5. Call `i18n.updatePageTranslations()` after dynamic content changes

---

## 📝 Commit Message Format

Use conventional commits with emojis:

```
🎨 UI improvement
✨ New feature
🐛 Bug fix
🔧 Configuration
📝 Documentation
♻️ Refactoring
🚀 Performance
🔒 Security
🌍 i18n/localization
```

**Examples**:
- `✨ Add Weekly Challenges UI (limited access)`
- `🐛 Fix dark mode toggle in settings`
- `🌍 Add 12 new translation keys for Leagues UI`
- `🔧 Update whitelist to include user ID 5`

---

## 🎯 Current Priorities (November 2025)

1. **Completed Features** (whitelisted access):
   - ✅ Weekly Challenges UI
   - ✅ Leagues & Leaderboards UI
   - ✅ Personal Rating UI
   - ✅ Daily Challenges UI
   - ✅ Streak Freeze UI
   - ✅ Bug Reports UI

2. **Next Up** (from PLAN.md):
   - [ ] SRS Statistics Dashboard UI
   - [ ] Leech Detection UI
   - [ ] User Learning Profile UI
   - [ ] Cramming Mode UI
   - [ ] Friend System UI
   - [ ] Duels UI

3. **Backlog** (see BACKLOG.md):
   - Global Word Collections
   - Tournament Brackets
   - Admin Panel for Bug Reports
   - Auth0 Integration

---

## 🔗 Quick Links

- **Production**: https://words-learning-server-copy-production.up.railway.app/
- **GitHub**: https://github.com/Nalivator3000/words-learning-server
- **Branch**: `develop` (auto-deploys)
- **Railway Dashboard**: [login required]
- **PLAN.md**: Full feature roadmap
- **BACKLOG.md**: Deferred features
- **TODO-SUMMARY.md**: Extracted todo list

---

## 📞 Support & Questions

**For Developers**:
- Check PLAN.md for feature specs
- Check server-postgresql.js for API endpoints
- Check user-manager.js for access control logic
- Use `console.log()` for debugging (remove before commit)

**For Product/QA**:
- Manual testing happens after deployment
- Report bugs via Bug Reports UI (whitelisted users only)
- Feature requests go into BACKLOG.md

---

**Remember**: Focus on building, not testing. Testing happens asynchronously. Keep the development velocity high! 🚀
