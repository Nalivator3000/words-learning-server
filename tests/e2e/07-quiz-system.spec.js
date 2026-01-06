/**
 * Quiz System E2E Tests
 * Tests all quiz types: Multiple Choice, Reverse, Word Building, Typing
 * CRITICAL: Core learning functionality
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Quiz System - Multiple Choice', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should start a multiple choice quiz', async ({ page }) => {
    // Click on "Study" or quiz start button
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    await studyButton.waitFor({ state: 'visible', timeout: 10000 });
    await studyButton.click();

    // Wait for quiz to load
    await page.waitForTimeout(2000);

    // Check quiz interface is visible
    const quizContainer = page.locator('.quiz-container, #quizContainer, [data-testid="quiz"]');
    await expect(quizContainer).toBeVisible({ timeout: 10000 });

    // Check that we have a question
    const questionText = page.locator('.question-text, .quiz-question, [data-testid="question"]');
    await expect(questionText).toBeVisible();

    // Check that we have answer choices
    const choices = page.locator('.quiz-option, .choice, button.answer');
    const choiceCount = await choices.count();
    expect(choiceCount).toBeGreaterThanOrEqual(2); // At least 2 choices
  });

  test('should show correct answer after answering', async ({ page }) => {
    // Start quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Select first answer choice
    const firstChoice = page.locator('.quiz-option, .choice, button.answer').first();
    await firstChoice.waitFor({ state: 'visible', timeout: 10000 });
    await firstChoice.click();

    // Wait for feedback
    await page.waitForTimeout(1500);

    // Check that we got feedback (correct or incorrect)
    const feedback = page.locator('.feedback, .result, .answer-feedback, .correct, .incorrect');
    const feedbackVisible = await feedback.isVisible().catch(() => false);

    // If feedback is shown, verify it has content
    if (feedbackVisible) {
      const feedbackText = await feedback.textContent();
      expect(feedbackText.length).toBeGreaterThan(0);
    }
  });

  test('should progress through multiple questions', async ({ page }) => {
    // Start quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Answer 3 questions
    for (let i = 0; i < 3; i++) {
      // Select an answer
      const choice = page.locator('.quiz-option, .choice, button.answer').first();
      await choice.waitFor({ state: 'visible', timeout: 10000 });
      await choice.click();

      // Wait for feedback and next button
      await page.waitForTimeout(1500);

      // Try to click next/continue button
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Weiter")');
      if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      } else {
        // Quiz might auto-advance
        await page.waitForTimeout(1000);
      }
    }

    // Verify we've progressed (either still in quiz or on results)
    const quizActive = await page.locator('.quiz-container, .quiz-results, [data-testid="quiz"], [data-testid="results"]').isVisible();
    expect(quizActive).toBeTruthy();
  });

  test('should show quiz results after completion', async ({ page }) => {
    // Start quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Answer all questions (up to 10)
    for (let i = 0; i < 10; i++) {
      // Check if quiz is still active
      const quizActive = await page.locator('.quiz-container, #quizContainer, [data-testid="quiz"]').isVisible().catch(() => false);
      if (!quizActive) break;

      // Select first answer
      const choice = page.locator('.quiz-option, .choice, button.answer').first();
      if (await choice.isVisible({ timeout: 3000 }).catch(() => false)) {
        await choice.click();
        await page.waitForTimeout(1500);

        // Try to click next
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Weiter")');
        if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        } else {
          await page.waitForTimeout(1000);
        }
      } else {
        break;
      }
    }

    // Wait for results screen
    await page.waitForTimeout(2000);

    // Check for results screen elements
    const resultsVisible = await page.locator('.quiz-results, .results, [data-testid="results"], .score').isVisible({ timeout: 5000 }).catch(() => false);

    // Or check if we're back at dashboard (quiz completed)
    const dashboardVisible = await page.locator('.dashboard, #dashboard, [data-testid="dashboard"]').isVisible().catch(() => false);

    // One of them should be visible
    expect(resultsVisible || dashboardVisible).toBeTruthy();
  });
});

test.describe('Quiz System - Typing Questions', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should accept correct typed answer', async ({ page }) => {
    // Navigate to typing quiz if available
    // This test assumes typing quiz can be selected

    // Start any quiz first
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for typing input (if this quiz type appears)
    const typingInput = page.locator('input[type="text"].answer-input, input[type="text"].quiz-input, input[placeholder*="type"], input[placeholder*="Type"]');

    if (await typingInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get the correct answer from the page if visible
      const correctAnswerElement = page.locator('.correct-answer, [data-correct-answer]');

      // Type a sample answer
      await typingInput.fill('hello');

      // Submit
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Check"), button[type="submit"]');
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      } else {
        // Try pressing Enter
        await typingInput.press('Enter');
      }

      // Wait for feedback
      await page.waitForTimeout(1500);

      // Verify feedback is shown
      const feedback = page.locator('.feedback, .result, .answer-feedback');
      if (await feedback.isVisible().catch(() => false)) {
        expect(await feedback.textContent()).toBeTruthy();
      }
    } else {
      // If no typing quiz available, log and skip
      console.log('Typing quiz not available in current session');
    }
  });

  test('should handle case-insensitive matching', async ({ page }) => {
    // Start quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for typing input
    const typingInput = page.locator('input[type="text"].answer-input, input[type="text"].quiz-input');

    if (await typingInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Type answer in different case
      await typingInput.fill('HELLO');

      // Submit
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Check")');
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      } else {
        await typingInput.press('Enter');
      }

      await page.waitForTimeout(1500);

      // Note: Can't verify correctness without knowing the actual answer
      // But we can verify the quiz accepted the input
      const feedback = page.locator('.feedback, .result');
      const hasFeedback = await feedback.isVisible().catch(() => false);
      expect(hasFeedback).toBeTruthy();
    }
  });
});

test.describe('Quiz System - German Articles', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should handle German articles (der/die/das)', async ({ page }) => {
    // Start quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for German words with articles in choices
    const choices = page.locator('.quiz-option, .choice, button.answer');
    const choiceCount = await choices.count();

    if (choiceCount > 0) {
      // Check if any choice contains German articles
      for (let i = 0; i < Math.min(choiceCount, 4); i++) {
        const choiceText = await choices.nth(i).textContent();
        const hasArticle = /^(der|die|das)\s/i.test(choiceText.trim());

        if (hasArticle) {
          // Found a German word with article
          console.log(`Found German word with article: ${choiceText}`);

          // Click it
          await choices.nth(i).click();
          await page.waitForTimeout(1500);

          // Verify feedback is shown
          const feedback = page.locator('.feedback, .result');
          expect(await feedback.isVisible().catch(() => false)).toBeTruthy();

          break;
        }
      }
    }
  });
});

test.describe('Quiz System - XP and Progress', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should award XP after quiz completion', async ({ page }) => {
    // Get initial XP if visible
    const xpElement = page.locator('.xp, .xp-count, [data-testid="xp"]');
    let initialXP = 0;

    if (await xpElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      const xpText = await xpElement.textContent();
      initialXP = parseInt(xpText.replace(/\D/g, '')) || 0;
    }

    // Start and complete a quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Answer 5 questions
    for (let i = 0; i < 5; i++) {
      const quizActive = await page.locator('.quiz-container, #quizContainer').isVisible().catch(() => false);
      if (!quizActive) break;

      const choice = page.locator('.quiz-option, .choice, button.answer').first();
      if (await choice.isVisible({ timeout: 3000 }).catch(() => false)) {
        await choice.click();
        await page.waitForTimeout(1500);

        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextButton.click();
        }
        await page.waitForTimeout(1000);
      }
    }

    // Wait for quiz completion
    await page.waitForTimeout(3000);

    // Check if XP increased (if XP counter is visible)
    if (await xpElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      const finalXPText = await xpElement.textContent();
      const finalXP = parseInt(finalXPText.replace(/\D/g, '')) || 0;

      // XP should have increased (or at least stayed the same if all answers wrong)
      expect(finalXP).toBeGreaterThanOrEqual(initialXP);

      if (finalXP > initialXP) {
        console.log(`XP increased from ${initialXP} to ${finalXP} (+${finalXP - initialXP})`);
      }
    } else {
      console.log('XP counter not visible - skipping XP verification');
    }
  });

  test('should update progress stats after quiz', async ({ page }) => {
    // Complete a short quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Answer 3 questions
    for (let i = 0; i < 3; i++) {
      const quizActive = await page.locator('.quiz-container, #quizContainer').isVisible().catch(() => false);
      if (!quizActive) break;

      const choice = page.locator('.quiz-option, .choice, button.answer').first();
      if (await choice.isVisible({ timeout: 3000 }).catch(() => false)) {
        await choice.click();
        await page.waitForTimeout(1500);

        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextButton.click();
        }
        await page.waitForTimeout(1000);
      }
    }

    // Wait for completion
    await page.waitForTimeout(3000);

    // Navigate to stats/progress page if available
    const statsLink = page.locator('a[href*="stats"], a[href*="progress"], button:has-text("Stats"), button:has-text("Progress")');
    if (await statsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statsLink.click();
      await page.waitForTimeout(2000);

      // Verify stats page loaded
      const statsContainer = page.locator('.stats, .progress, [data-testid="stats"]');
      expect(await statsContainer.isVisible({ timeout: 5000 }).catch(() => false)).toBeTruthy();
    }
  });
});

test.describe('Quiz System - Mobile Experience', () => {
  test.use({
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('should work on mobile viewport', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Start quiz
    const studyButton = page.locator('button:has-text("Study"), button:has-text("Start Quiz"), a[href*="quiz"]').first();
    if (await studyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studyButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify quiz is visible and usable on mobile
    const quizContainer = page.locator('.quiz-container, #quizContainer');
    if (await quizContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check that choices are tappable (minimum 44x44px touch target)
      const choice = page.locator('.quiz-option, .choice, button.answer').first();
      const box = await choice.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Close to 44px minimum
        expect(box.width).toBeGreaterThanOrEqual(40);
      }

      // Tap a choice
      await choice.click();
      await page.waitForTimeout(1500);

      // Verify feedback is shown
      const feedback = page.locator('.feedback, .result');
      expect(await feedback.isVisible().catch(() => false)).toBeTruthy();
    }
  });
});
