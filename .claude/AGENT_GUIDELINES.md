# 🤖 Agent Guidelines for LexyBooster Project

Critical rules and conventions for AI agents working on this project.

---

## 🔴 CRITICAL RULE #1: Git Branch Policy

### ALWAYS Push to `develop` Branch by Default

**✅ CORRECT:**
```bash
git push origin develop
```

**❌ WRONG:**
```bash
git push origin main
git push origin master
git push  # May push to wrong branch
```

**Why:**
- `develop` is the main development branch
- `main` is for production-ready code only
- Railway auto-deploys from `develop` branch
- Prevents accidental production deployments

**Exception:** Only push to `main` if explicitly requested by the user with clear intent for production deployment.

---

## 📋 Standard Git Workflow

```bash
# 1. Stage changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: descriptive message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 3. ALWAYS pull before push (critical when multiple agents work in parallel)
git pull origin develop

# 4. Resolve conflicts if any, then push
git push origin develop
```

---

## 🔄 CRITICAL: Multiple Agents Working in Parallel

### ⚠️ ALWAYS Pull Before Push

When multiple AI agents work on the same project simultaneously, you MUST follow this workflow:

```bash
# Before EVERY push, ALWAYS do:
git pull origin develop

# If there are conflicts:
# 1. Git will show conflict markers in files
# 2. Resolve conflicts manually (read files, edit to merge changes)
# 3. Stage resolved files: git add .
# 4. Complete merge: git commit (or use the merge commit message)

# Then push:
git push origin develop
```

**Why This is CRITICAL:**
- Multiple agents may push commits while you're working
- Pushing without pulling first will fail with "rejected - non-fast-forward"
- You'll lose context of what other agents changed
- May cause deployment issues if changes conflict

**Best Practice:**
1. `git fetch origin develop` - Check for new commits
2. `git log HEAD..origin/develop` - See what changed
3. `git pull origin develop` - Merge changes
4. Resolve any conflicts
5. `git push origin develop` - Push your work

---

## 🔢 Version Management

### CRITICAL: Always Bump Version Before Commit

**Before every commit, you MUST:**

1. **Check the previous commit version:**
```bash
git log -1 --format=%B
# Look for version pattern like "v5.1.2" or "VERSION: Bump to v5.1.2"
```

2. **Increment the version:**
   - Bug fixes: `5.1.2` → `5.1.3` (patch)
   - New features: `5.1.2` → `5.2.0` (minor)
   - Breaking changes: `5.1.2` → `6.0.0` (major)

3. **Include version in commit message:**
```bash
git commit -m "🔖 VERSION: Bump to v5.1.3

feat: your actual change description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Example Workflow:**
```bash
# Check previous version
git log -1 --format=%B
# Shows: "🔖 VERSION: Bump to v5.4.16"

# Your new version should be v5.4.17
git commit -m "🔖 VERSION: Bump to v5.4.17

🐛 FIX: Fix translation loading bug

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Why This Matters:**
- Maintains consistent version history
- Makes rollbacks easier
- Tracks deployment progression
- Required for production releases

---

## 🚀 Deployment Workflow

### After Pushing to develop:

```bash
# Railway auto-deploys from develop branch
# Wait ~30 seconds for deployment

# If migrations needed, provide user with these commands:
railway login
railway run npm run db:migrate:progress
railway run npm run db:create-word-sets
railway run npm run db:migrate:users
```

**Important:** Railway CLI requires interactive login - cannot be automated by agents. Always provide clear manual instructions.

---

## ⚠️ Common Pitfalls to Avoid

1. **Never push to `main` by default** - Always use `develop`
2. **Never push without pulling first** - ALWAYS `git pull origin develop` before `git push` (critical when multiple agents work in parallel)
3. **Never commit sensitive data** - Check .env, credentials, API keys
4. **Never use bash for file operations** - Use Read/Edit/Write/Grep tools
5. **Never assume Railway CLI is logged in** - Remind user to `railway login`
6. **Always read files before editing** - Use Read tool first
7. **NEVER test locally** - All testing ONLY on Railway production environment
8. **ALWAYS check and bump version before commit** - Use `git log -1` to check previous commit message for version (e.g., v5.4.23 → v5.4.24)

---

## ✅ Best Practices Checklist

Before every commit:
- [ ] Read relevant code before making changes
- [ ] Use TodoWrite for multi-step tasks
- [ ] Test changes (minimum: syntax check)
- [ ] **Check previous commit version and bump it** ← CRITICAL! (e.g., 5.4.23 → 5.4.24)
- [ ] Commit with descriptive message
- [ ] **ALWAYS pull before push: `git pull origin develop`** ← CRITICAL when multiple agents work!
- [ ] **Push to `develop` branch: `git push origin develop`** ← CRITICAL!
- [ ] Create clear manual instructions if needed
- [ ] Verify no sensitive data in commits

---

## 📁 Project Structure

```
words-learning-server/
├── public/              # Frontend files
├── migrations/          # Database migrations
├── scripts/             # Utility scripts
├── tests/              # Test files
├── server-postgresql.js # Main server
└── package.json        # NPM scripts
```

---

## 🔧 Key NPM Scripts

```bash
# Development
npm start                      # Start server
npm run dev                    # Start with nodemon

# Database (Railway only - requires railway login)
railway run npm run db:migrate:progress    # Create user_word_progress table
railway run npm run db:create-word-sets    # Populate word_sets
railway run npm run db:migrate:users       # Migrate existing users

# Testing (ONLY on Railway production)
npm run test:e2e:production:smoke    # Quick smoke test (5-7 min)
npm run test:e2e:production          # Critical tests (10-15 min)
npm run test:e2e:production:full     # Full E2E suite (60+ min)
npm run test:e2e:production:report   # View test report
```

**CRITICAL:** ALL testing is done ONLY against Railway production environment. Never run tests locally.

---

## 🗄️ Database Architecture

**Key Concept:**
- Source vocabularies (`source_words_*`) are shared by all users
- User progress tracked separately in `user_word_progress`
- JOINs fetch user-specific data

**Tables:**
- `source_words_german` - 8,076 words (shared)
- `user_word_progress` - Individual progress
- `word_sets` - 170+ organized collections
- `users` - User accounts
- `language_pairs` - User preferences

---

## 📝 Documentation Guidelines

When making significant changes:
1. Create/update relevant documentation
2. Add code comments for complex logic
3. Provide clear manual instructions
4. Include rollback plan for migrations
5. Document expected results

---

## 🧪 Testing Environment

**CRITICAL TESTING RULE:**
- ✅ **ALL tests run ONLY on Railway production**
- ❌ **NEVER test locally** - no local database setup
- ✅ Test user IP is whitelisted for rate limiting: `176.199.209.166`
- ✅ Use production URL: `https://words-learning-server-production.up.railway.app`

**Test Commands:**
```bash
# Smoke tests (recommended)
npm run test:e2e:production:smoke

# Critical tests
npm run test:e2e:production

# View results
npm run test:e2e:production:report
```

**Rate Limiting:**
- Test IP whitelisted in `RATE_LIMIT_WHITELIST` array
- Located in [server-postgresql.js:66-71](server-postgresql.js#L66-L71)
- Bypasses both `generalLimiter` and `authLimiter`

---

## 🎯 Summary

**MOST IMPORTANT:**
- ✅ **ALWAYS check and bump version** (use `git log -1` before commit)
- ✅ **ALWAYS pull before push** (`git pull origin develop` - critical with multiple agents!)
- ✅ **ALWAYS `git push origin develop`** (never main by default)
- ✅ **ALL testing ONLY on Railway** (never locally)
- ✅ Use Read/Edit/Write tools (not bash cat/sed/echo)
- ✅ Create documentation for complex changes
- ✅ Test before committing
- ✅ Never commit sensitive data

**Default Git Commands:**
```bash
# Check previous version
git log -1 --format=%B

# Stage and commit with bumped version
git add .
git commit -m "🔖 VERSION: Bump to v5.x.x

feat: your message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# CRITICAL: Always pull before push (especially when multiple agents work in parallel)
git pull origin develop

# Then push
git push origin develop  # ← ALWAYS develop!
```

---

**Version:** 1.2
**Last Updated:** January 7, 2026
**For:** Claude Code AI Agents
**Changelog:**
- v1.2: Added critical guidelines for multiple agents working in parallel (ALWAYS pull before push)
- v1.1: Initial version management and deployment guidelines
