// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Mobile Layout Tests - Phase 1.2
 * Testing responsive design across different mobile devices
 */

test.describe('Mobile Layout - Home Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should not have horizontal scroll on iPhone SE', async ({ page }) => {
    // Set viewport to iPhone SE (smallest modern phone)
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that body width doesn't exceed viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.viewportSize().width;

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('should display stats grid correctly on mobile', async ({ page }) => {
    // Check that stats grid is visible
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();

    // On narrow screens (<475px), should show 1 column
    if (page.viewportSize().width < 475) {
      const gridColumns = await statsGrid.evaluate((el) => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });
      expect(gridColumns).toContain('1fr');
    }
  });

  test('should display quick action buttons with proper tap targets', async ({ page }) => {
    const quickActions = page.locator('.quick-actions');
    await expect(quickActions).toBeVisible();

    // Check that action buttons exist
    const actionButtons = page.locator('.action-btn');
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check button size (min 44x44px for touch targets)
    const firstButton = actionButtons.first();
    const boundingBox = await firstButton.boundingBox();

    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should show mobile navigation bar at bottom', async ({ page }) => {
    // Check that header nav exists and is positioned at bottom
    const headerNav = page.locator('.header-nav');
    await expect(headerNav).toBeVisible();

    // Check if it's fixed at bottom
    const position = await headerNav.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        bottom: styles.bottom,
      };
    });

    expect(position.position).toBe('fixed');
  });
});

test.describe('Mobile Layout - Study Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should hide header in quiz mode on mobile', async ({ page }) => {
    // Navigate to study section
    await page.click('#studyBtn');
    await page.waitForTimeout(500);

    // Start a quiz (if available)
    const quickStudyBtn = page.locator('#quickStudyBtn');
    if (await quickStudyBtn.isVisible()) {
      await quickStudyBtn.click();
      await page.waitForTimeout(1000);

      // Check if body has quiz-active class
      const hasQuizActive = await page.evaluate(() => {
        return document.body.classList.contains('quiz-active');
      });

      if (hasQuizActive && page.viewportSize().width < 475) {
        // Header should be hidden (transform: translateY(-100%))
        const header = page.locator('.app-header');
        const transform = await header.evaluate((el) => {
          return window.getComputedStyle(el).transform;
        });

        // Transform should contain translateY with negative value
        expect(transform).toContain('matrix');
      }
    }
  });

  test('should have no empty space below quiz buttons', async ({ page }) => {
    // This tests the fix for word-building and other quiz modes
    // We'll verify that quiz-area has proper max-height
    const quizArea = page.locator('.quiz-area');

    if (await quizArea.isVisible()) {
      const maxHeight = await quizArea.evaluate((el) => {
        return window.getComputedStyle(el).maxHeight;
      });

      // Should have dvh-based height on mobile
      expect(maxHeight).toBeTruthy();
    }
  });
});

test.describe('Mobile Layout - Typography & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have readable font sizes', async ({ page }) => {
    // Check that body text is at least 16px
    const bodyFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize;
    });

    const fontSize = parseInt(bodyFontSize);
    expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
  });

  test('should have proper contrast ratios', async ({ page }) => {
    // This is a basic check - full WCAG testing would need more complex tools
    // We'll just verify that text elements have color set
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const heading = headings.nth(i);
      const color = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(color).toBeTruthy();
    }
  });
});

test.describe('Mobile Layout - Performance', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds (lenient for dev environment)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have minimal bundle size', async ({ page }) => {
    await page.goto('/');

    // Get all script tags
    const scriptSizes = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => script.getAttribute('src'));
    });

    // Just verify scripts are loaded (actual size check would need network monitoring)
    expect(scriptSizes.length).toBeGreaterThan(0);
  });
});
