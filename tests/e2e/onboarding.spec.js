const { test, expect } = require('@playwright/test');

test.describe('Onboarding Wizard', () => {
  test('should show onboarding modal with needsOnboarding=true parameter', async ({ page }) => {
    // Navigate to page with needsOnboarding parameter
    await page.goto('/?needsOnboarding=true');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if onboarding modal is visible
    const onboardingModal = page.locator('#onboardingModal');
    await expect(onboardingModal).toBeVisible();

    // Check if first step is shown
    const step1 = page.locator('#onboardingStep1');
    await expect(step1).toBeVisible();
    await expect(step1).toHaveClass(/active/);
  });

  test('should have all 3 steps in onboarding wizard', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Check if all 3 steps exist
    const step1 = page.locator('#onboardingStep1');
    const step2 = page.locator('#onboardingStep2');
    const step3 = page.locator('#onboardingStep3');

    await expect(step1).toBeAttached();
    await expect(step2).toBeAttached();
    await expect(step3).toBeAttached();
  });

  test('should navigate through onboarding steps', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Step 1: Language selection
    const nativeLangSelect = page.locator('#onboardingNativeLang');
    const targetLangSelect = page.locator('#onboardingTargetLang');
    const nextBtn1 = page.locator('#onboardingNext1');

    await expect(nativeLangSelect).toBeVisible();
    await expect(targetLangSelect).toBeVisible();

    // Select languages
    await nativeLangSelect.selectOption('en');
    await targetLangSelect.selectOption('de');

    // Click Next
    await nextBtn1.click();
    await page.waitForTimeout(500);

    // Check that step 2 is now active
    const step2 = page.locator('#onboardingStep2');
    await expect(step2).toHaveClass(/active/);

    // Step 2: Daily goal selection
    const time15 = page.locator('.time-option[data-minutes="15"]');
    await expect(time15).toBeVisible();
    await time15.click();

    const nextBtn2 = page.locator('#onboardingNext2');
    await nextBtn2.click();
    await page.waitForTimeout(500);

    // Check that step 3 is now active
    const step3 = page.locator('#onboardingStep3');
    await expect(step3).toHaveClass(/active/);
  });

  test('should show progress indicators correctly', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Check progress indicators
    const progress1 = page.locator('.progress-step[data-step="1"]');
    const progress2 = page.locator('.progress-step[data-step="2"]');
    const progress3 = page.locator('.progress-step[data-step="3"]');

    // Step 1 should be active
    await expect(progress1).toHaveClass(/active/);
    await expect(progress2).not.toHaveClass(/active/);
    await expect(progress3).not.toHaveClass(/active/);

    // Navigate to step 2
    await page.locator('#onboardingNativeLang').selectOption('en');
    await page.locator('#onboardingTargetLang').selectOption('de');
    await page.locator('#onboardingNext1').click();
    await page.waitForTimeout(500);

    // Now step 2 should be active, step 1 completed
    await expect(progress1).toHaveClass(/completed/);
    await expect(progress2).toHaveClass(/active/);
    await expect(progress3).not.toHaveClass(/active|completed/);
  });

  test('should validate different languages selection', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Try to select same language for both
    await page.locator('#onboardingNativeLang').selectOption('de');
    await page.locator('#onboardingTargetLang').selectOption('de');

    // Listen for alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('different');
      await dialog.accept();
    });

    await page.locator('#onboardingNext1').click();
    await page.waitForTimeout(500);

    // Should still be on step 1
    const step1 = page.locator('#onboardingStep1');
    await expect(step1).toHaveClass(/active/);
  });

  test('should have all time goal options', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Navigate to step 2
    await page.locator('#onboardingNativeLang').selectOption('en');
    await page.locator('#onboardingTargetLang').selectOption('de');
    await page.locator('#onboardingNext1').click();
    await page.waitForTimeout(500);

    // Check all time options exist
    const time5 = page.locator('.time-option[data-minutes="5"]');
    const time10 = page.locator('.time-option[data-minutes="10"]');
    const time15 = page.locator('.time-option[data-minutes="15"]');
    const time20 = page.locator('.time-option[data-minutes="20"]');
    const time30 = page.locator('.time-option[data-minutes="30"]');

    await expect(time5).toBeVisible();
    await expect(time10).toBeVisible();
    await expect(time15).toBeVisible();
    await expect(time20).toBeVisible();
    await expect(time30).toBeVisible();
  });

  test('should have dark and light theme options', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Navigate to step 3
    await page.locator('#onboardingNativeLang').selectOption('en');
    await page.locator('#onboardingTargetLang').selectOption('de');
    await page.locator('#onboardingNext1').click();
    await page.waitForTimeout(500);

    await page.locator('.time-option[data-minutes="15"]').click();
    await page.locator('#onboardingNext2').click();
    await page.waitForTimeout(500);

    // Check theme options
    const darkTheme = page.locator('.theme-option[data-theme="dark"]');
    const lightTheme = page.locator('.theme-option[data-theme="light"]');

    await expect(darkTheme).toBeVisible();
    await expect(lightTheme).toBeVisible();

    // Dark theme should be selected by default
    await expect(darkTheme).toHaveClass(/selected/);
  });

  test('should allow theme preview on selection', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Navigate to step 3
    await page.locator('#onboardingNativeLang').selectOption('en');
    await page.locator('#onboardingTargetLang').selectOption('de');
    await page.locator('#onboardingNext1').click();
    await page.waitForTimeout(500);

    await page.locator('.time-option[data-minutes="15"]').click();
    await page.locator('#onboardingNext2').click();
    await page.waitForTimeout(500);

    // Click light theme
    const lightTheme = page.locator('.theme-option[data-theme="light"]');
    await lightTheme.click();
    await page.waitForTimeout(300);

    // Check that data-theme changed on document
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');

    // Click dark theme back
    const darkTheme = page.locator('.theme-option[data-theme="dark"]');
    await darkTheme.click();
    await page.waitForTimeout(300);

    const theme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme2).toBe('dark');
  });

  test('should have back buttons on steps 2 and 3', async ({ page }) => {
    await page.goto('/?needsOnboarding=true');
    await page.waitForTimeout(1000);

    // Navigate to step 2
    await page.locator('#onboardingNativeLang').selectOption('en');
    await page.locator('#onboardingTargetLang').selectOption('de');
    await page.locator('#onboardingNext1').click();
    await page.waitForTimeout(500);

    // Check back button exists
    const backBtn2 = page.locator('#onboardingBack2');
    await expect(backBtn2).toBeVisible();

    // Navigate to step 3
    await page.locator('.time-option[data-minutes="15"]').click();
    await page.locator('#onboardingNext2').click();
    await page.waitForTimeout(500);

    // Check back button exists
    const backBtn3 = page.locator('#onboardingBack3');
    await expect(backBtn3).toBeVisible();

    // Click back button
    await backBtn3.click();
    await page.waitForTimeout(500);

    // Should be back on step 2
    const step2 = page.locator('#onboardingStep2');
    await expect(step2).toHaveClass(/active/);
  });
});
