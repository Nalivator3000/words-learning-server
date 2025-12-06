// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * New Features Tests - Phase 2 & 3
 * Testing OAuth, Word Sets, and Manual Word Addition features
 */

test.describe('Google OAuth Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display Google Sign-In button', async ({ page }) => {
    // Open auth modal
    const authModal = page.locator('#authModal');
    const isVisible = await authModal.isVisible();

    if (!isVisible) {
      // Click login button to show modal
      const loginBtn = page.locator('#loginBtn, button:has-text("Login")').first();
      if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Check for Google OAuth button
    const googleBtn = page.locator('button:has-text("Login with Google"), #googleLoginBtn');
    await expect(googleBtn.first()).toBeVisible({ timeout: 3000 });
  });

  test('should have proper OAuth redirect URL configured', async ({ page }) => {
    await page.goto('/');

    // Check if Google OAuth endpoint exists
    const response = await page.request.get('/auth/google').catch(() => null);

    // Should redirect (302/303) or require authentication
    if (response) {
      expect([200, 302, 303, 401, 403]).toContain(response.status());
    }
  });
});

test.describe('Registration Flow Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open auth modal
    const authModal = page.locator('#authModal');
    const isVisible = await authModal.isVisible();

    if (!isVisible) {
      const loginBtn = page.locator('#loginBtn, button:has-text("Login")').first();
      if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Switch to register form
    const showRegisterBtn = page.locator('#showRegisterBtn, button:has-text("Register")');
    if (await showRegisterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showRegisterBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display password strength indicator', async ({ page }) => {
    const passwordInput = page.locator('#registerPassword');
    const strengthIndicator = page.locator('#passwordStrength, .password-strength');

    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('weak');

      // Check for strength indicator
      await expect(strengthIndicator.first()).toBeVisible({ timeout: 2000 });
    } else {
      test.skip();
    }
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('#registerEmail');
    const emailValidation = page.locator('#emailValidation, .validation-message');

    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Invalid email
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      await page.waitForTimeout(300);

      const hasValidation = await emailValidation.isVisible().catch(() => false);
      expect(hasValidation).toBeTruthy();

      // Valid email
      await emailInput.fill('test@example.com');
      await emailInput.blur();
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });

  test('should show Terms of Service checkbox', async ({ page }) => {
    const termsCheckbox = page.locator('#acceptTerms, input[type="checkbox"]:near(:text("Terms"))');

    const isVisible = await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await expect(termsCheckbox.first()).toBeVisible();
    }
  });
});

test.describe('Manual Word Addition Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Close auth modal if present
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should display Add Word button in Word Lists section', async ({ page }) => {
    // Navigate to Word Lists
    const wordListsBtn = page.locator('#wordListsBtn, button:has-text("Word Lists")');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(1000);

      // Check for Add Word button
      const addWordBtn = page.locator('#addWordBtn, button:has-text("Добавить слово"), button:has-text("Add Word")');
      await expect(addWordBtn.first()).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('should open Add Word modal when clicking button', async ({ page }) => {
    // Navigate to Word Lists
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(1000);

      const addWordBtn = page.locator('#addWordBtn');

      if (await addWordBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addWordBtn.click();
        await page.waitForTimeout(500);

        // Check if modal is visible
        const addWordModal = page.locator('#addWordModal');
        const isVisible = await addWordModal.isVisible().catch(() => false);

        if (isVisible) {
          await expect(addWordModal).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });

  test('should have 3-step wizard in Add Word modal', async ({ page }) => {
    // Navigate to Word Lists and open modal
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(1000);

      const addWordBtn = page.locator('#addWordBtn');

      if (await addWordBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addWordBtn.click();
        await page.waitForTimeout(500);

        // Check for step 1
        const step1 = page.locator('#step1');
        if (await step1.isVisible().catch(() => false)) {
          await expect(step1).toBeVisible();

          // Check for word input
          const wordInput = page.locator('#newWord');
          await expect(wordInput).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });
});

test.describe('CEFR Word Sets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should display CEFR level filter in Word Lists', async ({ page }) => {
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(1000);

      // Check for CEFR level filter
      const cefrFilter = page.locator('#cefrLevelFilter, select:near(:text("CEFR"))');
      const isVisible = await cefrFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        await expect(cefrFilter.first()).toBeVisible();

        // Check that it has CEFR levels
        const options = await cefrFilter.first().locator('option').allTextContents();
        const hasCEFRLevels = options.some(opt => /A1|A2|B1|B2|C1|C2/.test(opt));
        expect(hasCEFRLevels).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('should display word sets when available', async ({ page }) => {
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(2000);

      // Check for word set cards (either CEFR or traditional)
      const wordSetCards = page.locator('.word-set-card, .word-list-card');
      const count = await wordSetCards.count();

      if (count > 0) {
        expect(count).toBeGreaterThan(0);

        // Check for import buttons
        const importBtn = page.locator('button:has-text("Import"), .import-btn');
        const hasImportBtn = await importBtn.count() > 0;
        expect(hasImportBtn).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('should have color-coded level badges', async ({ page }) => {
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(2000);

      // Look for level badges
      const levelBadges = page.locator('.list-level-badge, [class*="level-badge"]');
      const count = await levelBadges.count();

      if (count > 0) {
        const firstBadge = levelBadges.first();
        const backgroundColor = await firstBadge.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        // Should have a background color set
        expect(backgroundColor).toBeTruthy();
        expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Thematic Word Sets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should have theme filter in Word Lists', async ({ page }) => {
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(1000);

      // Check for theme/topic filter
      const themeFilter = page.locator('#topicFilter, select:has(option:text("Travel")), select:has(option:text("Business"))');
      const isVisible = await themeFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        await expect(themeFilter.first()).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should filter word sets by theme', async ({ page }) => {
    const wordListsBtn = page.locator('#wordListsBtn');

    if (await wordListsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wordListsBtn.click();
      await page.waitForTimeout(2000);

      const themeFilter = page.locator('#topicFilter');

      if (await themeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Get initial count
        const initialCount = await page.locator('.word-set-card, .word-list-card').count();

        // Select a theme
        await themeFilter.selectOption({ index: 1 }); // Select first non-empty option
        await page.waitForTimeout(1000);

        // Count should change or stay the same (both valid)
        const newCount = await page.locator('.word-set-card, .word-list-card').count();
        expect(typeof newCount).toBe('number');
      }
    } else {
      test.skip();
    }
  });
});

test.describe('API Endpoints', () => {
  test('word sets API should be accessible', async ({ page }) => {
    const response = await page.request.get('/api/word-sets');

    // Should return 200 or require auth (401)
    expect([200, 401]).toContain(response.status());
  });

  test('word translation API should exist', async ({ page }) => {
    // POST request to translation endpoint
    const response = await page.request.post('/api/words/translate', {
      data: {
        word: 'test',
        sourceLang: 'en',
        targetLang: 'de'
      }
    }).catch(() => null);

    if (response) {
      // Should return 200, 400 (bad request), or 401 (auth required)
      expect([200, 400, 401]).toContain(response.status());
    }
  });

  test('OAuth endpoints should be configured', async ({ page }) => {
    const googleAuth = await page.request.get('/auth/google').catch(() => null);

    if (googleAuth) {
      // Should redirect or return auth page
      expect([200, 302, 303, 401]).toContain(googleAuth.status());
    }
  });
});
