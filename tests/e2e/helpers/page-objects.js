/**
 * Page Object Model for E2E Tests
 * Provides reusable selectors and actions
 */

class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = 'input[name="username"], input[type="text"], #username';
    this.passwordInput = 'input[name="password"], input[type="password"], #password';
    this.loginButton = 'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")';
    this.errorMessage = '.error, .alert-error, [role="alert"]';
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username, password) {
    await this.page.fill(this.usernameInput, username);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);

    // Wait for navigation
    await this.page.waitForLoadState('networkidle');
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
    this.wordSetCard = '.word-set, .card, [data-testid="word-set"]';
    this.wordSetTitle = '.word-set-title, h2, h3, .title';
    this.wordCount = '.word-count, .count, [data-count]';
    this.levelFilter = 'select[name="level"], #level-filter, .level-filter';
    this.themeFilter = 'select[name="theme"], #theme-filter, .theme-filter';
    this.searchInput = 'input[type="search"], input[placeholder*="Search"], #search';
    this.emptyState = '.empty-state, .no-results, [data-testid="empty-state"]';
  }

  async goto() {
    // Navigate to word sets page (adjust URL as needed)
    await this.page.goto('/word-sets');
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
    this.wordList = '.word-item, .word, [data-testid="word"]';
    this.sourceWord = '.source-word, .word-source';
    this.targetWord = '.target-word, .word-target';
    this.importAllButton = 'button:has-text("Import All"), button:has-text("Add All"), [data-action="import-all"]';
    this.importSelectedButton = 'button:has-text("Import Selected"), button:has-text("Add Selected")';
    this.wordCheckbox = 'input[type="checkbox"]';
    this.closeButton = 'button:has-text("Close"), button[aria-label="Close"], .close';
    this.successMessage = '.success, .alert-success, [role="alert"].success';
    this.wordCountDisplay = '.total-words, .word-count, [data-testid="word-count"]';
  }

  async getWordCount() {
    const words = await this.page.locator(this.wordList).all();
    return words.length;
  }

  async importAll() {
    await this.page.click(this.importAllButton);

    // Wait for import to complete
    await this.page.waitForSelector(this.successMessage, { timeout: 30000 });
  }

  async selectWords(count) {
    const checkboxes = await this.page.locator(this.wordCheckbox).all();
    const selectCount = Math.min(count, checkboxes.length);

    for (let i = 0; i < selectCount; i++) {
      await checkboxes[i].check();
    }
  }

  async importSelected() {
    await this.page.click(this.importSelectedButton);
    await this.page.waitForSelector(this.successMessage, { timeout: 30000 });
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
    this.navMenu = 'nav, .navigation, [role="navigation"]';
    this.homeLink = 'a:has-text("Home"), a[href="/"], a[href="/home"]';
    this.wordSetsLink = 'a:has-text("Word Sets"), a:has-text("Sets"), a[href="/word-sets"]';
    this.vocabularyLink = 'a:has-text("Vocabulary"), a:has-text("My Words"), a[href="/vocabulary"]';
    this.logoutLink = 'a:has-text("Logout"), a:has-text("Sign out"), button:has-text("Logout")';
  }

  async goToHome() {
    await this.page.click(this.homeLink);
    await this.page.waitForLoadState('networkidle');
  }

  async goToWordSets() {
    await this.page.click(this.wordSetsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async goToVocabulary() {
    await this.page.click(this.vocabularyLink);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    await this.page.click(this.logoutLink);
    await this.page.waitForLoadState('networkidle');
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
