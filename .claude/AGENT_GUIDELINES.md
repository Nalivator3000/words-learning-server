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

## 📋 Standard Git Workflow (Pull-Reapply-Push)

### 🔴 CRITICAL: After EVERY Change - Immediately Push to develop

After completing any code change, you MUST immediately push to develop using this workflow:

```bash
# 1. Remember what files you changed and what changes you made
#    (Keep track of your edits before any git operations!)

# 2. Stash your local changes temporarily
git stash

# 3. Pull latest from develop to get other agents' changes
git pull origin develop

# 4. Apply your stashed changes back
git stash pop

# 5. If conflicts occur after stash pop:
#    - Read the conflicted files
#    - Re-apply your changes manually using Edit tool
#    - Make sure not to overwrite other agents' work

# 6. Stage, commit and push
git add .
git commit -m "🔖 VERSION: Bump to vX.X.X

feat: your descriptive message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin develop
```

---

## 🔄 CRITICAL: Multiple Agents Working in Parallel

### ⚠️ Pull-Reapply-Push Strategy (Prevents Conflicts!)

When multiple AI agents work on the same project simultaneously, you MUST follow this **Pull-Reapply-Push** workflow:

```bash
# STEP 1: Before making changes, remember current state
git status
git log -1 --format=%B  # Check current version

# STEP 2: Make your code changes using Edit/Write tools
# ... your changes ...

# STEP 3: Before committing - CRITICAL SEQUENCE:
git stash                    # Save your changes temporarily
git pull origin develop      # Get latest from other agents
git stash pop                # Re-apply your changes on top

# STEP 4: Handle any conflicts
# If "CONFLICT" appears:
#   - Use Read tool to see the conflicted file
#   - Use Edit tool to manually merge changes
#   - Keep BOTH your changes AND other agents' changes
#   - git add <resolved-files>

# STEP 5: Commit and push immediately
git add .
git commit -m "🔖 VERSION: Bump to vX.X.X

your message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin develop
```

### Why Pull-Reapply-Push?

| Problem | Solution |
|---------|----------|
| Agent A and Agent B both edit files | Stash → Pull → Pop ensures you see Agent B's changes first |
| Merge conflicts on push | Conflicts happen locally during `stash pop`, easier to resolve |
| Lost changes from other agents | You always pull before committing, so you see everything |
| "rejected - non-fast-forward" errors | Never happens because you always have latest code |

### Conflict Resolution Example:

```bash
# After git stash pop, you see:
# CONFLICT (content): Merge conflict in public/app.js

# 1. Read the file to see conflict markers
# 2. You'll see:
#    <<<<<<< Updated upstream
#    (other agent's code)
#    =======
#    (your stashed code)
#    >>>>>>> Stashed changes

# 3. Use Edit tool to keep BOTH changes (merge them properly)
# 4. Remove conflict markers
# 5. git add public/app.js
# 6. Continue with commit and push
```

**Golden Rule:** After EVERY code change → immediately do Pull-Reapply-Push → never leave uncommitted changes!

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

**After EVERY code change - Pull-Reapply-Push:**
- [ ] `git stash` - Save your changes
- [ ] `git pull origin develop` - Get latest from other agents
- [ ] `git stash pop` - Re-apply your changes
- [ ] Resolve conflicts if any (keep BOTH your and others' changes!)
- [ ] `git add .` - Stage all changes
- [ ] `git commit -m "..."` - Commit with version bump
- [ ] `git push origin develop` - Push immediately!
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
- ✅ **ALWAYS use Pull-Reapply-Push** (stash → pull → pop → commit → push)
- ✅ **ALWAYS `git push origin develop`** (never main by default)
- ✅ **Push IMMEDIATELY after every change** (don't accumulate changes!)
- ✅ **ALL testing ONLY on Railway** (never locally)
- ✅ Use Read/Edit/Write tools (not bash cat/sed/echo)
- ✅ Never commit sensitive data

**Default Git Commands (Pull-Reapply-Push):**
```bash
# 1. Check previous version
git log -1 --format=%B

# 2. Make your code changes with Edit/Write tools
# ... your changes ...

# 3. CRITICAL: Pull-Reapply-Push sequence
git stash                    # Save changes
git pull origin develop      # Get other agents' work
git stash pop                # Re-apply your changes

# 4. If conflicts - resolve them keeping BOTH changes

# 5. Stage and commit with bumped version
git add .
git commit -m "🔖 VERSION: Bump to v5.x.x

feat: your message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 6. Push immediately
git push origin develop  # ← ALWAYS develop!
```

---

**Version:** 1.3
**Last Updated:** January 11, 2026
**For:** Claude Code AI Agents
**Changelog:**
- v1.3: Introduced Pull-Reapply-Push strategy (stash → pull → pop → push) to prevent conflicts between parallel agents
- v1.2: Added critical guidelines for multiple agents working in parallel (ALWAYS pull before push)
- v1.1: Initial version management and deployment guidelines
