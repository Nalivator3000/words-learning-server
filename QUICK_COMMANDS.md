# ⚡ Quick Commands Reference

## Railway Deployment

```bash
# 1. Commit and push
git add .
git commit -m "feat: new word architecture"
git push origin main

# 2. Run migrations on Railway
railway run npm run db:migrate:progress
railway run npm run db:create-word-sets
railway run npm run db:migrate:users

# 3. Check deployment
railway status
railway logs
```

## Local Testing (when DB accessible)

```bash
# Run migrations
npm run db:migrate:progress
npm run db:create-word-sets
npm run db:migrate:users

# Start server
npm start

# Open onboarding
# http://localhost:3001/onboarding.html
```

## Database Checks

```bash
# Check if user_word_progress exists
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT COUNT(*) FROM user_word_progress').then(r => {console.log('✅ Rows:', r.rows[0].count); db.end();});"

# Check word_sets count
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT COUNT(*) FROM word_sets').then(r => {console.log('✅ Word sets:', r.rows[0].count); db.end();});"

# Check users
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT id, name FROM users').then(r => {console.log('✅ Users:', r.rows); db.end();});"
```

## API Testing

```bash
# Test word counts endpoint
curl "https://your-app.railway.app/api/words/counts?userId=5&languagePairId=1"

# Test random words endpoint
curl "https://your-app.railway.app/api/words/random/new/10?userId=5&languagePairId=1"

# Test word sets endpoint
curl "https://your-app.railway.app/api/word-sets?sourceLang=german"

# Test progress update
curl -X PUT "https://your-app.railway.app/api/words/1/progress" \
  -H "Content-Type: application/json" \
  -d '{"correct": true, "questionType": "multiple", "userId": 5, "languagePairId": 1}'
```

## Rollback (if needed)

```bash
# Revert code changes
git checkout HEAD~1 -- server-postgresql.js public/database.js public/api-database.js

# Drop new tables (CAREFUL!)
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('DROP TABLE IF EXISTS user_word_progress CASCADE; DROP TABLE IF EXISTS word_sets CASCADE;').then(() => {console.log('✅ Tables dropped'); db.end();});"
```

## Useful Railway Commands

```bash
# Login to Railway
railway login

# Link to project
railway link

# View environment variables
railway variables

# Open Railway dashboard
railway open

# View logs
railway logs

# Run command on Railway
railway run <command>

# SSH into container
railway shell
```

## NPM Scripts Added

```bash
npm run db:check              # Check database status
npm run db:check-users        # Check user words counts
npm run db:migrate:progress   # Create user_word_progress table
npm run db:migrate:users      # Migrate User #5 and #7 data
npm run db:create-word-sets   # Create word sets from source vocabularies
```

## One-Liner Deploy

```bash
git add . && git commit -m "feat: new word architecture" && git push && sleep 30 && railway run npm run db:migrate:progress && railway run npm run db:create-word-sets && railway run npm run db:migrate:users && echo "✅ Deployment complete!"
```

## Status Check

```bash
# Check everything at once
railway run node scripts/check-deployment-status.js
```

(Create this script if needed - checks all tables, counts, etc.)
