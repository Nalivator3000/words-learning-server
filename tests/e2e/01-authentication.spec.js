const { test, expect } = require('@playwright/test');
const { LoginPage, NavigationHelper } = require('./helpers/page-objects');
const { getAllTestUsers, TEST_PASSWORD } = require('./helpers/test-users');

/**
 * Authentication Tests
 * Tests login/logout functionality for all test users
 */

test.describe('Authentication - All Language Pairs', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should load login page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/LexiBooster|Login|Sign in/i);
    await expect(page.locator(loginPage.usernameInput)).toBeVisible();
    await expect(page.locator(loginPage.passwordInput)).toBeVisible();
    await expect(page.locator(loginPage.loginButton)).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await loginPage.login('invalid_user', 'wrong_password');

    // Should show error or stay on login page
    const currentUrl = page.url();
    const errorMessage = await loginPage.getErrorMessage();

    expect(
      currentUrl.includes('/login') || errorMessage !== null
    ).toBeTruthy();
  });
});

// Test login for each priority group
test.describe('Authentication - High Priority Users', () => {
  const highPriorityUsers = getAllTestUsers().filter(u =>
    ['test_de_en', 'test_de_ru', 'test_en_ru', 'test_en_de'].includes(u.username)
  );

  for (const user of highPriorityUsers) {
    test(`should login successfully: ${user.username} (${user.fromName} → ${user.toName})`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(user.username, TEST_PASSWORD);

      // Should redirect away from login page
      await expect(page).not.toHaveURL(/login/);

      // Should show user-specific content or language pair
      const pageContent = await page.textContent('body');
      expect(
        pageContent.includes(user.fromName) ||
        pageContent.includes(user.toName) ||
        pageContent.includes(user.username)
      ).toBeTruthy();
    });
  }
});

test.describe('Authentication - Medium Priority Users', () => {
  const mediumPriorityUsers = getAllTestUsers().filter(u =>
    ['test_de_es', 'test_hi_en', 'test_en_es'].includes(u.username)
  );

  for (const user of mediumPriorityUsers) {
    test(`should login successfully: ${user.username} (${user.fromName} → ${user.toName})`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(user.username, TEST_PASSWORD);

      // Should redirect away from login page
      await expect(page).not.toHaveURL(/login/);
    });
  }
});

test.describe('Authentication - Special Script Users', () => {
  const specialScriptUsers = [
    { username: 'test_hi_en', script: 'Devanagari' },
    { username: 'test_ar_en', script: 'Arabic' },
    { username: 'test_zh_en', script: 'Chinese' },
  ];

  for (const user of specialScriptUsers) {
    test(`should login and render ${user.script} correctly: ${user.username}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(user.username, TEST_PASSWORD);

      await expect(page).not.toHaveURL(/login/);

      // Check that page doesn't have replacement characters (□, �)
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('□');
      expect(bodyText).not.toContain('�');
    });
  }
});

test.describe('Authentication - Session Management', () => {
  test('should maintain session after refresh', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Login
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await expect(page).not.toHaveURL(/login/);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in
    await expect(page).not.toHaveURL(/login/);
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const nav = new NavigationHelper(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Logout
    await nav.logout();

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test('should not access protected pages after logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const nav = new NavigationHelper(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Logout
    await nav.logout();

    // Try to access protected page
    await page.goto('/word-sets');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Authentication - Empty Word Sets Users', () => {
  const emptySetUsers = [
    { username: 'test_ru_en', fromName: 'Russian', toName: 'English' },
    { username: 'test_ru_de', fromName: 'Russian', toName: 'German' },
  ];

  for (const user of emptySetUsers) {
    test(`should login successfully despite no word sets: ${user.username}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(user.username, TEST_PASSWORD);

      // Should successfully login
      await expect(page).not.toHaveURL(/login/);

      // Should not crash or show errors
      const errorElements = await page.locator('.error, [role="alert"].error').count();
      expect(errorElements).toBe(0);
    });
  }
});

test.describe('Authentication - Security', () => {
  test('should not expose password in URL', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await page.fill(loginPage.usernameInput, 'test_de_en');
    await page.fill(loginPage.passwordInput, TEST_PASSWORD);
    await page.click(loginPage.loginButton);

    await page.waitForLoadState('networkidle');

    // Password should not be in URL
    const url = page.url();
    expect(url).not.toContain(TEST_PASSWORD);
    expect(url).not.toContain('password');
  });

  test('should use HTTPS in production', async ({ page }) => {
    // Skip in local development
    if (process.env.NODE_ENV === 'production') {
      await page.goto('/');
      const url = page.url();
      expect(url).toMatch(/^https:/);
    } else {
      test.skip();
    }
  });
});
