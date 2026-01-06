/**
 * Debug Test - Count actual cards rendered on page
 */

const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Card Count', () => {
  test('count rendered word set cards', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    console.log('\n=== Login ===');
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    console.log('\n=== Navigate to Word Lists ===');
    await wordSetsPage.goto();

    console.log('\n=== Count cards ===');
    const count = await wordSetsPage.getWordSetCount();
    console.log(`Found ${count} word set cards`);

    // Get actual data from JavaScript
    const jsData = await page.evaluate(() => {
      return {
        wordSets: window.wordListsUI?.wordSets?.length || 0,
        wordLists: window.wordListsUI?.wordLists?.length || 0,
        languagePair: window.wordListsUI?.languagePair || null
      };
    });

    console.log('JavaScript state:');
    console.log('- wordSets array length:', jsData.wordSets);
    console.log('- wordLists array length:', jsData.wordLists);
    console.log('- languagePair:', JSON.stringify(jsData.languagePair, null, 2));

    // Count actual DOM elements
    const domCounts = await page.evaluate(() => {
      const cards = document.querySelectorAll('.word-list-card');
      const cefrSections = document.querySelectorAll('.word-lists-section');

      let byType = { wordSets: 0, traditional: 0 };
      cards.forEach(card => {
        // Check if card has CEFR level (indicates word set)
        const hasLevel = card.querySelector('.cefr-level-badge') ||
                        card.querySelector('[class*="level-"]');
        if (hasLevel) {
          byType.wordSets++;
        } else {
          byType.traditional++;
        }
      });

      return {
        totalCards: cards.length,
        sections: cefrSections.length,
        byType
      };
    });

    console.log('DOM state:');
    console.log('- Total .word-list-card elements:', domCounts.totalCards);
    console.log('- CEFR sections:', domCounts.sections);
    console.log('- By type:', domCounts.byType);

    await page.screenshot({ path: 'test-results/debug-card-count.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
