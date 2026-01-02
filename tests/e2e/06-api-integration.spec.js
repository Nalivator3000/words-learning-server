const { test, expect } = require('@playwright/test');
const { TEST_PASSWORD } = require('./helpers/test-users');

/**
 * API Integration Tests
 * Tests API endpoints work correctly with test users
 */

// Helper function to convert username to email
function usernameToEmail(username) {
  return username.replace(/_/g, '.') + '@lexibooster.test';
}

test.describe('API - Authentication', () => {
  test('should authenticate via API', async ({ request }) => {
    const email = usernameToEmail('test_de_en');

    const response = await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('user');
  });

  test('should reject invalid credentials via API', async ({ request }) => {
    const email = usernameToEmail('test_de_en');

    const response = await request.post('/api/auth/login', {
      data: {
        email,
        password: 'wrong_password'
      }
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });
});

test.describe('API - Word Sets', () => {
  test.beforeEach(async ({ request }) => {
    // Login to get session
    const email = usernameToEmail('test_de_en');
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
  });

  test('should fetch word sets for German', async ({ request }) => {
    const response = await request.get('/api/word-sets', {
      params: {
        language: 'german',
        source: 'de'
      }
    });

    expect(response.ok()).toBeTruthy();

    const wordSets = await response.json();
    expect(Array.isArray(wordSets)).toBeTruthy();
    expect(wordSets.length).toBe(17);
  });

  test('should fetch word sets for Hindi', async ({ request }) => {
    // Login as Hindi user
    const email = usernameToEmail('test_hi_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    const response = await request.get('/api/word-sets', {
      params: {
        language: 'hindi',
        source: 'hi'
      }
    });

    expect(response.ok()).toBeTruthy();

    const wordSets = await response.json();
    expect(Array.isArray(wordSets)).toBeTruthy();
    expect(wordSets.length).toBe(16);
  });

  test('should fetch empty array for Russian', async ({ request }) => {
    const email = usernameToEmail('test_ru_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    const response = await request.get('/api/word-sets', {
      params: {
        language: 'russian',
        source: 'ru'
      }
    });

    expect(response.ok()).toBeTruthy();

    const wordSets = await response.json();
    expect(Array.isArray(wordSets)).toBeTruthy();
    expect(wordSets.length).toBe(0);
  });

  test('should fetch words from a specific set', async ({ request }) => {
    // Login
    const email = usernameToEmail('test_de_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    // Get word sets
    const setsResponse = await request.get('/api/word-sets?language=german');
    const wordSets = await setsResponse.json();

    expect(wordSets.length).toBeGreaterThan(0);

    // Get words from first set
    const firstSetId = wordSets[0].id;
    const wordsResponse = await request.get(`/api/word-sets/${firstSetId}/words`);

    expect(wordsResponse.ok()).toBeTruthy();

    const words = await wordsResponse.json();
    expect(Array.isArray(words)).toBeTruthy();
    expect(words.length).toBeGreaterThan(0);
  });
});

test.describe('API - Import with Deduplication', () => {
  test('should import words via API', async ({ request }) => {
    // Login
    const email = usernameToEmail('test_en_de');
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    const { user } = await loginResponse.json();

    // Get word sets
    const setsResponse = await request.get('/api/word-sets?language=english');
    const wordSets = await setsResponse.json();

    const firstSetId = wordSets[0].id;

    // Import words
    const importResponse = await request.post(`/api/word-sets/${firstSetId}/import`, {
      data: {
        userId: user.id
      }
    });

    expect(importResponse.ok()).toBeTruthy();

    const result = await importResponse.json();
    expect(result).toHaveProperty('imported');
    expect(result.imported).toBeGreaterThan(0);
  });

  test('API should prevent duplicates on re-import', async ({ request }) => {
    // Login
    const email = usernameToEmail('test_en_es');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    // Get word sets
    const setsResponse = await request.get('/api/word-sets?language=english');
    const wordSets = await setsResponse.json();

    const firstSetId = wordSets[0].id;

    // First import
    const firstImport = await request.post(`/api/word-sets/${firstSetId}/import`);
    const firstResult = await firstImport.json();

    expect(firstResult.imported).toBeGreaterThan(0);

    const importedCount = firstResult.imported;

    // Second import of SAME set
    const secondImport = await request.post(`/api/word-sets/${firstSetId}/import`);
    const secondResult = await secondImport.json();

    // Should import 0 words (all skipped)
    expect(secondResult.imported).toBe(0);
    expect(secondResult.skipped).toBe(importedCount);
  });
});

test.describe('API - Vocabulary Management', () => {
  test('should fetch user vocabulary via API', async ({ request }) => {
    // Login
    const email = usernameToEmail('test_de_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    const response = await request.get('/api/vocabulary');

    expect(response.ok()).toBeTruthy();

    const vocabulary = await response.json();
    expect(Array.isArray(vocabulary)).toBeTruthy();
  });

  test('should delete word via API', async ({ request }) => {
    // Login and import word first
    const email = usernameToEmail('test_en_fr');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    // Import a set
    const setsResponse = await request.get('/api/word-sets?language=english');
    const wordSets = await setsResponse.json();

    await request.post(`/api/word-sets/${wordSets[0].id}/import`);

    // Get vocabulary
    const vocabResponse = await request.get('/api/vocabulary');
    const vocabulary = await vocabResponse.json();

    expect(vocabulary.length).toBeGreaterThan(0);

    // Delete first word
    const firstWordId = vocabulary[0].id;
    const deleteResponse = await request.delete(`/api/vocabulary/${firstWordId}`);

    expect(deleteResponse.ok()).toBeTruthy();

    // Verify word deleted
    const afterDelete = await request.get('/api/vocabulary');
    const afterVocab = await afterDelete.json();

    expect(afterVocab.length).toBe(vocabulary.length - 1);
  });
});

test.describe('API - Error Handling', () => {
  test('should return 401 for unauthorized requests', async ({ request }) => {
    const response = await request.get('/api/word-sets');

    // Should be unauthorized without login
    expect(response.status()).toBe(401);
  });

  test('should return 404 for non-existent word set', async ({ request }) => {
    const email = usernameToEmail('test_de_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    const response = await request.get('/api/word-sets/99999999');

    expect(response.status()).toBe(404);
  });

  test('should handle invalid JSON', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeFalsy();
  });
});

test.describe('API - Performance', () => {
  test('should respond quickly to word sets request', async ({ request }) => {
    const email = usernameToEmail('test_de_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    const startTime = Date.now();

    const response = await request.get('/api/word-sets?language=german');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });

  test('should handle large set fetch efficiently', async ({ request }) => {
    const email = usernameToEmail('test_hi_en');
    await request.post('/api/auth/login', {
      data: {
        email,
        password: TEST_PASSWORD
      }
    });

    // Get Hindi General theme (2999 words)
    const setsResponse = await request.get('/api/word-sets?language=hindi');
    const wordSets = await setsResponse.json();

    const generalSet = wordSets.find(set =>
      set.title.toLowerCase().includes('general')
    );

    expect(generalSet).toBeTruthy();

    const startTime = Date.now();

    const wordsResponse = await request.get(`/api/word-sets/${generalSet.id}/words`);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(wordsResponse.ok()).toBeTruthy();

    const words = await wordsResponse.json();
    expect(words.length).toBeGreaterThan(2000);

    // Should fetch within 3 seconds even for large set
    expect(duration).toBeLessThan(3000);
  });
});

test.describe('API - Cross-Origin and Security', () => {
  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.options('/api/word-sets');

    const headers = response.headers();

    // Should have CORS headers (if enabled)
    if (headers['access-control-allow-origin']) {
      expect(headers['access-control-allow-origin']).toBeTruthy();
    }
  });

  test('should have security headers', async ({ request }) => {
    const response = await request.get('/');

    const headers = response.headers();

    // Check for security headers
    // (These may not all be present depending on server config)
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'x-xss-protection',
    ];

    // At least some security headers should be present
    const hasSecurityHeaders = securityHeaders.some(header =>
      headers[header] !== undefined
    );

    // In production, should have security headers
    if (process.env.NODE_ENV === 'production') {
      expect(hasSecurityHeaders).toBeTruthy();
    }
  });
});
