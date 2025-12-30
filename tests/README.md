# 🧪 FluentFlow Test Suite

Comprehensive testing framework for FluentFlow language learning platform.

## 📁 Test Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── test-api-endpoints.js
│   ├── test-production.js
│   ├── test-validation.js
│   └── test-word-lists.js
├── database/               # Database integrity tests
│   ├── test-vocabulary-schema.js
│   └── test-translation-coverage.js
├── security/               # Security vulnerability tests
│   └── test-security.js
├── integration/            # End-to-end integration tests
│   └── test-study-flow.js
└── run-all-tests.js       # Master test runner
```

## 🚀 Quick Start

### Run All Tests
```bash
npm test
# or
npm run test:all
```

### Run Specific Test Suites
```bash
npm run test:database       # Database schema & integrity
npm run test:translations   # Translation coverage
npm run test:word-lists     # Word Lists API
npm run test:security       # Security checks
npm run test:study-flow     # Full user flow
npm run test:api            # All API endpoints
npm run test:validate       # Validation tests
```

## 📊 Test Categories

### 1. Database Tests
**Critical tests that verify data structure and integrity**

- ✅ Table existence (source_words_*, target_translations_*)
- ✅ Column structure (id, word, level, etc.)
- ✅ Constraints (UNIQUE, NOT NULL, FOREIGN KEY)
- ✅ Data quality (no duplicates, no empty values)
- ✅ CEFR level distribution
- ✅ Translation coverage statistics

**Run:** `npm run test:database`

### 2. API Tests
**Verify all REST endpoints work correctly**

- Authentication (login, register, logout)
- User data (stats, language pairs, achievements)
- Words API (fetch, filter by level, due words)
- Study sessions (create, submit answers)
- Statistics & analytics
- Leaderboard
- Word Lists

**Run:** `npm run test:api`

### 3. Security Tests
**Check for common vulnerabilities**

- SQL injection protection
- XSS prevention
- Authorization checks
- Input validation
- Password strength requirements
- Rate limiting

**Run:** `npm run test:security`

### 4. Integration Tests
**End-to-end user flows**

- Full study cycle: Login → Setup → Study → Review → Stats
- XP earning & level progression
- Achievement unlocking
- Streak tracking

**Run:** `npm run test:study-flow`

## 🎯 Test Results

Tests return different exit codes:
- `0` - All tests passed ✅
- `1` - Some tests failed ⚠️
- `2` - Critical tests failed 🚨

## 🔧 Configuration

### Environment Variables
```bash
# For API tests that require running server
TEST_BASE_URL=http://localhost:3000  # or production URL
```

### Test Credentials
```javascript
const TEST_USER = {
    email: 'demo@fluentflow.app',
    password: 'DemoPassword123!'
};
```

## 📝 Writing New Tests

### Test Template
```javascript
#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

let results = { passed: 0, failed: 0 };

async function test(name, fn) {
    process.stdout.write(`  ${name}... `);
    try {
        await fn();
        console.log('✅');
        results.passed++;
    } catch (e) {
        console.log(`❌ ${e.message}`);
        results.failed++;
    }
}

async function runTests() {
    console.log('\n🧪 My Test Suite\n');

    await test('Test description', async () => {
        // Test logic here
        if (condition) throw new Error('Test failed');
    });

    // Print results
    console.log(`\n✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}\n`);

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
```

### Adding to Master Test Runner
Edit `tests/run-all-tests.js`:
```javascript
const TEST_SUITES = [
    // ...
    {
        name: 'My New Tests',
        path: 'tests/category/my-test.js',
        critical: false
    },
];
```

### Adding NPM Script
Edit `package.json`:
```json
{
  "scripts": {
    "test:my-feature": "node tests/category/my-test.js"
  }
}
```

## 🐛 Known Issues

### Database Tests
- ❌ **1,820 duplicates** found in `source_words_german`
- ❌ **30,486 translations** for 10,540 words (289% - duplicates in target_translations_russian)

### Translation Coverage Tests
- ⚠️ Need to check `_from_en` and `_from_es` suffix tables
- Currently shows 0% for EN→RU and ES→RU (false negative)

## 📚 Dependencies

Tests use minimal dependencies:
- `pg` - PostgreSQL client
- `https` - Built-in HTTP client
- `dotenv` - Environment variables

**No testing framework required!** Pure Node.js tests for simplicity.

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

### Pre-commit Hook
```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run test:database
```

## 📊 Coverage Goals

- ✅ Database: **96%** (24/25 tests)
- ⚠️ Translations: **71%** (5/7 tests)
- 🔜 API: Not run yet
- 🔜 Security: Not run yet
- 🔜 Integration: Not run yet

**Target: 90%+ coverage across all critical features**

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "Test timeout"
Increase timeout in test file:
```javascript
// Default: 30 seconds
setTimeout(() => process.exit(1), 60000); // 60 seconds
```

### "Test server not running"
Start local server:
```bash
npm start
# In another terminal:
npm run test:api
```

## 📖 Resources

- [Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-testing)
- [PostgreSQL Testing Guide](https://www.postgresql.org/docs/current/regress.html)
- [REST API Testing Guide](https://www.postman.com/api-testing/)

---

**Last Updated:** 2025-12-23
**Test Suite Version:** 1.0.0
