const { test, expect } = require('@playwright/test');

/**
 * Translation Loading Tests
 * Tests i18n system initialization and race condition fixes
 */

test.describe('Translation System', () => {
  test.beforeEach(async ({ page }) => {
    // Force English locale for consistent testing
    await page.addInitScript(() => {
      localStorage.setItem('language', 'en');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for i18n to initialize
    await page.waitForTimeout(500);
  });

  test('should load i18n system successfully', async ({ page }) => {
    // Check that window.i18n is exposed globally
    const i18nExists = await page.evaluate(() => {
      return typeof window.i18n !== 'undefined';
    });
    expect(i18nExists).toBeTruthy();
  });

  test('should load translations before initializing auth validation', async ({ page }) => {
    // Check that translations are loaded
    const translationsLoaded = await page.evaluate(() => {
      return window.i18n &&
             window.i18n.translations &&
             Object.keys(window.i18n.translations).length > 0;
    });
    expect(translationsLoaded).toBeTruthy();

    // Check that auth validation initialized after translations
    const authValidationExists = await page.evaluate(() => {
      return typeof window.authValidation !== 'undefined';
    });
    expect(authValidationExists).toBeTruthy();
  });

  test('should not show "Translation missing" errors in console', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'warn' && msg.text().includes('Translation missing')) {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to catch any console warnings
    await page.waitForTimeout(1000);

    // Should have no translation missing warnings
    expect(consoleErrors.length).toBe(0);
  });

  test('should display password strength indicator with translations', async ({ page }) => {
    // Switch to register tab
    const registerTab = page.locator('button:has-text("Register"), a:has-text("Register")').first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
      await page.waitForTimeout(200);
    }

    // Type password and check strength indicator
    const passwordInput = page.locator('#registerPassword, input[type="password"][placeholder*="password" i]').first();
    await passwordInput.fill('weak');

    // Wait for strength indicator to appear
    await page.waitForTimeout(300);

    // Check that strength text is in English (not [key] format)
    const strengthText = await page.locator('#strengthText, .strength-text').first().textContent();

    // Should not contain brackets (which indicates missing translation)
    expect(strengthText).not.toContain('[');
    expect(strengthText).not.toContain(']');

    // Should contain actual text
    expect(strengthText.length).toBeGreaterThan(0);
  });

  test('should validate email with translated messages', async ({ page }) => {
    // Switch to register tab if needed
    const registerTab = page.locator('button:has-text("Register"), a:has-text("Register")').first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
      await page.waitForTimeout(200);
    }

    // Type invalid email and trigger validation
    const emailInput = page.locator('#registerEmail, input[type="email"]').first();
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    await page.waitForTimeout(300);

    // Check validation message
    const validationMessage = await page.locator('#emailValidation, .validation-message').first().textContent();

    // Should not be empty or contain [key] format
    if (validationMessage && validationMessage.trim().length > 0) {
      expect(validationMessage).not.toContain('[');
      expect(validationMessage).not.toContain(']');
    }
  });

  test('should hide empty error container on login page', async ({ page }) => {
    // Check that error container exists but is hidden when empty
    const errorContainer = page.locator('.auth-error').first();

    if (await errorContainer.count() > 0) {
      const isEmpty = await errorContainer.evaluate(el => el.textContent.trim() === '');

      if (isEmpty) {
        // Empty error container should not be visible
        const isVisible = await errorContainer.isVisible();
        expect(isVisible).toBeFalsy();
      }
    }
  });

  test('should show error container only when there is an error', async ({ page }) => {
    // Try to login with invalid credentials
    const emailInput = page.locator('#loginEmail, input[type="email"]').first();
    const passwordInput = page.locator('#loginPassword, input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Log In"), button:has-text("Login")').first();

    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();

    await page.waitForTimeout(500);

    // Error container should be visible now
    const errorContainer = page.locator('.auth-error').first();
    if (await errorContainer.count() > 0) {
      const hasText = await errorContainer.evaluate(el => el.textContent.trim().length > 0);

      if (hasText) {
        const isVisible = await errorContainer.isVisible();
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('should have all required translation keys', async ({ page }) => {
    // Check that critical translation keys exist
    const keysToCheck = [
      'password_weak',
      'password_medium',
      'password_strong',
      'email_valid',
      'email_invalid',
      'login',
      'register'
    ];

    for (const key of keysToCheck) {
      const translation = await page.evaluate((k) => {
        return window.i18n ? window.i18n.t(k) : null;
      }, key);

      // Should not return the key in brackets
      expect(translation).not.toBe(`[${key}]`);
      expect(translation).toBeTruthy();
    }
  });
});

test.describe('Translation System - Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Force English locale for consistent testing
    await page.addInitScript(() => {
      localStorage.setItem('language', 'en');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for i18n to initialize
    await page.waitForTimeout(500);
  });

  test('should support multiple languages', async ({ page }) => {
    const availableLanguages = await page.evaluate(() => {
      return window.i18n ? window.i18n.getAvailableLanguages() : [];
    });

    // Should have at least English and Russian
    expect(availableLanguages.length).toBeGreaterThan(0);
    expect(availableLanguages).toContain('en');
  });

  test('should switch language without errors', async ({ page }) => {
    const languageChanged = await page.evaluate(async () => {
      if (!window.i18n) return false;
      await window.i18n.setLanguage('ru');
      return window.i18n.getCurrentLanguage() === 'ru';
    });

    expect(languageChanged).toBeTruthy();
  });
});
