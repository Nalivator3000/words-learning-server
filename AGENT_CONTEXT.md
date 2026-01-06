# 🤖 Agent Context Summary (LexyBooster)

**Auto-read by agents on startup for quick context awareness**

---

## 🚨 CRITICAL RULES (Read First!)

```
⛔ RULE #0:     NEVER push to 'main' → ONLY 'develop'
⛔ RULE #0.5:   NEVER test locally → ONLY Railway production
⛔ RULE #1:     All DB operations require Railway environment
⛔ RULE #2:     Never commit sensitive data (.env, credentials)
⛔ RULE #3:     Use Read/Edit/Write tools (NOT bash cat/sed)
```

---

## 📊 Project Status Dashboard

| Metric | Current Value |
|--------|---------------|
| **Version** | 5.4.14 |
| **Active Branch** | develop |
| **Environment** | Railway Production |
| **Database** | PostgreSQL (Railway) |
| **Languages** | 18 (German, English, Spanish, etc.) |
| **Word Sets** | 170+ thematic collections |
| **Test Accounts** | 3 (see TEST_ACCOUNTS_READY.md) |

---

## 🏗️ Architecture Quick Reference

### Database Tables (Key)
- `source_words_{language}` - Shared vocabularies (8,076 German words, etc.)
- `user_word_progress` - Individual progress tracking
- `word_sets` - 170+ thematic collections
- `users` - User accounts
- `language_pairs` - User language preferences

### Language Pair Convention
Format: `native_lang→learning_lang`
- `ru→de` = Russian speaker learning German
- `en→es` = English speaker learning Spanish

### API Endpoints (Main)
- `/api/words` - Word operations (GET, POST, PUT)
- `/api/word-sets` - Collections management
- `/api/words/import` - CSV import
- `/api/words/export` - CSV export

---

## ⚡ Quick Commands

### Git Workflow (ALWAYS develop!)
```bash
git add .
git commit -m "feat: description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin develop  # ← CRITICAL: Never push to main!
```

### Testing (Production Only!)
```bash
npm run test:e2e:production:smoke    # 5-7 min - Quick smoke test
npm run test:e2e:production          # 10-15 min - Critical tests
npm run test:e2e:production:full     # 60+ min - Full E2E suite
```

### Version Management
```bash
npm run version:patch  # 5.4.14 → 5.4.15
npm run version:minor  # 5.4.14 → 5.5.0
npm run version:major  # 5.4.14 → 6.0.0
```

### Database Operations (Railway CLI required)
```bash
railway login  # Interactive - must be run by user
railway run npm run db:migrate:progress
railway run npm run db:create-word-sets
```

### Translation Management
```bash
npm run translate:status  # Check translation progress
npm run translate:matrix  # Translate all language pairs
```

---

## 🔍 Context Verification Command

Run this when unsure about project state:
```bash
git status && git branch && echo "=== Recent commits ===" && git log -3 --oneline && echo "=== Current version ===" && node -p "require('./package.json').version"
```

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `.clinerules` | 390 lines of comprehensive agent rules |
| `server-postgresql.js` | Main Express server (5,000+ lines) |
| `package.json` | Dependencies and scripts (v5.4.14) |
| `TEST_ACCOUNTS_READY.md` | Test user credentials |
| `.env` | Environment variables (NOT committed) |

---

## 🌐 URLs & Access

- **Production**: https://lexybooster.com/
- **Railway**: https://words-learning-server-production.up.railway.app
- **Database**: `mainline.proxy.rlwy.net:54625`
- **Whitelisted IP**: `176.199.209.166` (for E2E tests)

---

## 🎯 Common Tasks & Workflows

### Adding New Feature
1. Read relevant code first (use Read tool)
2. Use TodoWrite for multi-step planning
3. Implement changes
4. Test on Railway production
5. Commit to develop branch
6. Verify deployment (~30 sec)

### Fixing Bug
1. Identify issue location (use Grep/Glob tools)
2. Read affected files
3. Apply fix
4. Test on production
5. Commit with "fix:" prefix

### Database Migration
1. Write migration script in `/migrations`
2. Push to develop
3. Wait for Railway deployment
4. User runs: `railway login && railway run npm run db:migrate:progress`

---

## 🚦 Pre-Commit Checklist

- [ ] Read relevant code before changes
- [ ] Use TodoWrite for multi-step tasks
- [ ] Test changes on Railway production
- [ ] Verify no sensitive data in commits
- [ ] Commit with descriptive message
- [ ] **Push to `develop` branch** ← CRITICAL!
- [ ] Verify Railway deployment successful

---

## 🐛 Common Pitfalls

1. ❌ Pushing to `main` instead of `develop` → ⛔ FORBIDDEN
2. ❌ Testing locally without database → ⛔ FORBIDDEN
3. ❌ Using bash for file operations → Use Read/Edit/Write tools
4. ❌ Assuming Railway CLI is logged in → Remind user to login
5. ❌ Committing .env or API keys → Check git status carefully

---

## 📚 Additional Resources

- **Full Rules**: See `.clinerules` (390 lines)
- **API Documentation**: See inline comments in `server-postgresql.js`
- **Testing Guide**: `TESTING_QUICK_START.md`
- **Railway Dashboard**: User must access via web UI

---

**Last Updated**: 2026-01-06
**Agent Version**: v5.4.14
**For**: Claude Code AI Agents (Auto-context on startup)