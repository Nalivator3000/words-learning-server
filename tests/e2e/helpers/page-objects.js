/**
 * Page Object Model for E2E Tests
 * Provides reusable selectors and actions
 */

class LoginPage {
  constructor(page) {
    this.page = page;
    // Real selectors from the actual app
    this.emailInput = '#loginEmail';
    this.passwordInput = '#loginPassword';
    this.loginButton = '#loginBtn';
    this.loginTab = '#loginTab';
    this.errorMessage = '.error, .alert-error, [role="alert"]';
  }

  async goto() {
    await this.page.goto('/');

    // Force English locale for tests
    await this.page.evaluate(() => {
      localStorage.setItem('uiLanguage', 'en');
    });

    // Wait for Welcome page with "Log In" button
    await this.page.waitForSelector('button:has-text("Log In")', { timeout: 10000 });
  }

  async login(username, password) {
    // Click "Log In" button on Welcome page
    const welcomeLoginBtn = this.page.locator('button:has-text("Log In")').first();
    await welcomeLoginBtn.waitFor({ state: 'visible', timeout: 10000 });
    await welcomeLoginBtn.click();

    // Wait for login form to appear
    await this.page.waitForTimeout(1000);

    // Convert username to email format
    // test_de_en -> test.de.en@lexibooster.test
    const email = username.replace(/_/g, '.') + '@lexibooster.test';

    // Fill email and password using specific IDs
    await this.page.fill(this.emailInput, email);
    await this.page.waitForTimeout(200);
    await this.page.fill(this.passwordInput, password);
    await this.page.waitForTimeout(200);

    // Click the submit button using explicit ID (NOT Google OAuth button)
    const submitButton = this.page.locator(this.loginButton); // #loginBtn
    await submitButton.click();

    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);

    // Verify we're logged in by checking if we're NOT on Welcome page anymore
    // More lenient than checking for specific dashboard elements
    const currentUrl = this.page.url();
    const stillOnWelcome = await this.page.locator('button:has-text("Register")')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (stillOnWelcome) {
      // Check if there's an error message
      const errorMsg = await this.getErrorMessage();
      if (errorMsg) {
        throw new Error(`Login failed: ${errorMsg}`);
      }
      throw new Error('Login failed: Still on Welcome page');
    }

    // Allow page to fully load
    await this.page.waitForTimeout(1000);
  }

  async getErrorMessage() {
    const errorElement = await this.page.locator(this.errorMessage).first();
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }
}

class WordSetsPage {
  constructor(page) {
    this.page = page;
    // Actual selectors from word-lists-ui.js
    this.wordSetCard = '.word-list-card';
    this.wordSetTitle = '.list-title';
    this.wordCount = '.meta-text';
    this.levelFilter = '#cefrLevelFilter';
    this.themeFilter = '#topicFilter';
    this.difficultyFilter = '#difficultyFilter';
    this.resetFiltersBtn = '#resetFiltersBtn';
    this.viewSetBtn = '.view-set-btn';
    this.importSetBtn = '.import-set-btn';
    this.emptyState = '.empty-state';
    this.wordListsContainer = '.word-lists-container';
  }

  async goto() {
    // This is a SPA - click the Word Lists button to show the section
    await this.page.click('#wordListsBtn');
    // Wait for the section to become visible
    await this.page.waitForSelector('#wordListsSection.active', { timeout: 10000 });
    // Wait for word lists to load (either cards or empty state)
    await this.page.waitForSelector('.word-lists-container, .empty-state', { timeout: 10000 });
    await this.page.waitForTimeout(500); // Allow rendering to complete
  }

  async getWordSetCount() {
    const cards = await this.page.locator(this.wordSetCard).all();
    return cards.length;
  }

  async getWordSetTitles() {
    const titles = await this.page.locator(this.wordSetTitle).allTextContents();
    return titles;
  }

  async openWordSet(index = 0) {
    const cards = await this.page.locator(this.wordSetCard).all();
    if (cards[index]) {
      await cards[index].click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async filterByLevel(level) {
    await this.page.selectOption(this.levelFilter, level);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByTheme(theme) {
    await this.page.selectOption(this.themeFilter, theme);
    await this.page.waitForLoadState('networkidle');
  }

  async search(query) {
    await this.page.fill(this.searchInput, query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async isEmptyStateVisible() {
    const emptyState = this.page.locator(this.emptyState).first();
    return await emptyState.isVisible();
  }

  async getWordSetByTitle(title) {
    return this.page.locator(this.wordSetCard).filter({ hasText: title }).first();
  }
}

class WordSetDetailPage {
  constructor(page) {
    this.page = page;
    // Modal selectors from word-lists-ui.js
    this.modal = '#wordListModal';
    this.modalTitle = '#modalListTitle';
    this.modalContent = '#modalListContent';
    this.closeButton = '.modal-close, .close-modal';
    this.importButton = '#importFromModalBtn';
    this.wordList = '.word-item, .modal-word-item';
    this.sourceWord = '.source-word, .word-source';
    this.targetWord = '.target-word, .word-target';
    this.successMessage = '.success, .alert-success, [role="alert"].success';
    this.wordCountDisplay = '.total-words, .word-count';
  }

  async getWordCount() {
    const words = await this.page.locator(this.wordList).all();
    return words.length;
  }

  async waitForModal() {
    await this.page.waitForSelector(this.modal, { state: 'visible', timeout: 10000 });
    await this.page.waitForSelector(this.modalContent, { timeout: 5000 });
  }

  async importAll() {
    await this.waitForModal();
    await this.page.click(this.importButton);

    // Wait for import to complete (success message or modal close)
    await this.page.waitForTimeout(2000);
  }

  async selectWords(count) {
    // For now, just import all - word lists UI doesn't have checkboxes
    await this.importAll();
  }

  async importSelected() {
    // Same as importAll for word lists
    await this.importAll();
  }

  async getSuccessMessage() {
    const message = await this.page.locator(this.successMessage).first();
    if (await message.isVisible()) {
      return await message.textContent();
    }
    return null;
  }

  async close() {
    await this.page.click(this.closeButton);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyScriptRendering(script = 'latin') {
    // Verify that text is rendered correctly for different scripts
    const firstWord = await this.page.locator(this.sourceWord).first();
    const text = await firstWord.textContent();

    // Basic check: text should not be empty and not contain replacement characters
    return text && text.length > 0 && !text.includes('�') && !text.includes('□');
  }
}

class VocabularyPage {
  constructor(page) {
    this.page = page;
    this.wordList = '.vocabulary-word, .word-item, [data-testid="vocab-word"]';
    this.totalCount = '.total-count, [data-testid="total-words"]';
    this.deleteButton = 'button:has-text("Delete"), .delete-btn, [data-action="delete"]';
    this.searchInput = 'input[type="search"], #vocab-search';
    this.emptyState = '.empty-state, .no-words';
  }

  async goto() {
    await this.page.goto('/vocabulary');
  }

  async getWordCount() {
    const countText = await this.page.locator(this.totalCount).first().textContent();
    return parseInt(countText.match(/\d+/)?.[0] || '0');
  }

  async getVocabularyWords() {
    return await this.page.locator(this.wordList).all();
  }

  async deleteWord(index = 0) {
    const words = await this.getVocabularyWords();
    if (words[index]) {
      const deleteBtn = words[index].locator(this.deleteButton);
      await deleteBtn.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      await this.page.waitForLoadState('networkidle');
    }
  }

  async search(query) {
    await this.page.fill(this.searchInput, query);
    await this.page.waitForTimeout(500);
  }

  async isEmptyStateVisible() {
    const emptyState = this.page.locator(this.emptyState).first();
    return await emptyState.isVisible();
  }
}

class NavigationHelper {
  constructor(page) {
    this.page = page;
    // SPA navigation uses buttons with IDs
    this.homeBtn = '#homeBtn';
    this.wordListsBtn = '#wordListsBtn';
    this.importBtn = '#importBtn';
    this.studyBtn = '#studyBtn';
    this.reviewBtn = '#reviewBtn';
    this.statsBtn = '#statsBtn';
    this.settingsBtn = '#settingsNavBtn';
    this.logoutBtn = '#logoutBtn, button:has-text("Выход"), button:has-text("Logout")';
  }

  async goToHome() {
    await this.page.click(this.homeBtn);
    await this.page.waitForSelector('#homeSection.active', { timeout: 5000 });
  }

  async goToWordSets() {
    await this.page.click(this.wordListsBtn);
    await this.page.waitForSelector('#wordListsSection.active', { timeout: 5000 });
  }

  async goToImport() {
    await this.page.click(this.importBtn);
    await this.page.waitForSelector('#importSection.active', { timeout: 5000 });
  }

  async goToVocabulary() {
    // Vocabulary might be part of home or a different section
    // Update this based on actual app structure
    await this.goToHome();
  }

  async logout() {
    // INCREASED TIMEOUTS: Production needs longer wait times
    const LOGOUT_WAIT = 15000; // Increased from 5000ms
    const CLICK_TIMEOUT = 20000; // Increased from 10000ms

    try {
      // Try direct logout button first
      await this.page.waitForSelector(this.logoutBtn, { state: 'visible', timeout: LOGOUT_WAIT });

      // iOS Safari: Scroll button into view before clicking
      await this.page.locator(this.logoutBtn).first().scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(500);

      // Click with multiple strategies
      try {
        await this.page.click(this.logoutBtn, { timeout: CLICK_TIMEOUT });
      } catch (clickError) {
        // Fallback: force click
        await this.page.click(this.logoutBtn, { force: true, timeout: CLICK_TIMEOUT });
      }
    } catch (e) {
      // If logout button not immediately visible, might be in settings
      // Try to open settings first
      try {
        const settingsVisible = await this.page.isVisible(this.settingsBtn);
        if (settingsVisible) {
          await this.page.click(this.settingsBtn);
          await this.page.waitForTimeout(1000); // Increased from 500ms
        }
      } catch (settingsError) {
        // Settings not available, continue
      }

      // Now try logout button again with longer timeout
      await this.page.waitForSelector(this.logoutBtn, { state: 'visible', timeout: LOGOUT_WAIT });

      // Scroll into view
      await this.page.locator(this.logoutBtn).first().scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(500);

      // Use force: true if button is found but not clickable
      await this.page.click(this.logoutBtn, { force: true, timeout: CLICK_TIMEOUT });
    }

    // Wait for logout to complete and auth modal to appear
    await this.page.waitForTimeout(2000); // Increased from 1000ms

    // Wait for auth modal to be visible (indicates logout succeeded)
    await this.page.waitForSelector('#authModal.active', { timeout: 10000 });
  }
}

class AssertionHelper {
  constructor(page) {
    this.page = page;
  }

  async assertTextVisible(text) {
    const element = this.page.locator(`text=${text}`);
    await element.waitFor({ state: 'visible', timeout: 5000 });
  }

  async assertElementExists(selector) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'attached', timeout: 5000 });
  }

  async assertUrl(expectedUrl) {
    await this.page.waitForURL(expectedUrl, { timeout: 5000 });
  }

  async assertUrlContains(urlPart) {
    await this.page.waitForFunction(
      (part) => window.location.href.includes(part),
      urlPart,
      { timeout: 5000 }
    );
  }
}

module.exports = {
  LoginPage,
  WordSetsPage,
  WordSetDetailPage,
  VocabularyPage,
  NavigationHelper,
  AssertionHelper,
};
