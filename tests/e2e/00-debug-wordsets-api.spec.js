/**
 * Debug Test - Check what the word sets API is returning
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Word Sets API', () => {
  test('check word sets API calls and responses', async ({ page }) => {
    // Monitor network requests
    const apiCalls = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/word-sets') || url.includes('/api/language-pair')) {
        const status = response.status();
        let data = null;
        try {
          data = await response.json();
        } catch (e) {
          // Not JSON
        }
        apiCalls.push({ url, status, data });
        console.log(`\n📡 API Call: ${url}`);
        console.log(`Status: ${status}`);
        if (data) {
          if (Array.isArray(data)) {
            console.log(`Response: Array with ${data.length} items`);
            if (data.length > 0) {
              console.log('First item:', JSON.stringify(data[0], null, 2));
            }
          } else {
            console.log('Response:', JSON.stringify(data, null, 2));
          }
        }
      }
    });

    const loginPage = new LoginPage(page);

    console.log('\n=== Login ===');
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    console.log('\n=== Check user state ===');
    const userState = await page.evaluate(() => {
      return {
        currentUser: window.userManager?.currentUser?.id || null,
        languagePair: window.userManager?.getCurrentLanguagePair() || null
      };
    });
    console.log('Current user:', userState.currentUser);
    console.log('Language pair:', JSON.stringify(userState.languagePair, null, 2));

    console.log('\n=== Navigate to Word Lists ===');
    await page.click('#wordListsBtn');

    // Wait for API calls to complete
    await page.waitForTimeout(3000);

    console.log('\n=== Summary of API calls ===');
    console.log(`Total API calls: ${apiCalls.length}`);

    const wordSetsCall = apiCalls.find(call => call.url.includes('/api/word-sets'));
    if (wordSetsCall) {
      console.log('\nWord Sets API Call:');
      console.log('URL:', wordSetsCall.url);
      console.log('Parameters:', new URL(wordSetsCall.url).searchParams.toString());
      if (Array.isArray(wordSetsCall.data)) {
        console.log(`Returned ${wordSetsCall.data.length} word sets`);

        // Count by source language
        const byLang = {};
        wordSetsCall.data.forEach(set => {
          const lang = set.source_language || 'unknown';
          byLang[lang] = (byLang[lang] || 0) + 1;
        });
        console.log('By source language:', byLang);
      }
    }

    expect(true).toBeTruthy();
  });
});
