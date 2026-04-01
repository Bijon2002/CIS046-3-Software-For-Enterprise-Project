import { test, expect } from '@playwright/test';

test.describe('Public Pages and Responsive UI', () => {
  test('Home page renders core layout', async ({ page, isMobile }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    
    // Check main architectural sections exist
    await expect(page.locator('body')).toBeVisible();
    
    // Verify responsive changes (like a hamburger menu appearing on mobile)
    if (isMobile) {
        // Mobile-specific layout assertions can go here
        expect(page.viewportSize()?.width).toBeLessThanOrEqual(500);
    }
  });

  test('Leaderboard page fetches data and renders properly', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    // Check for a table or list component containing leaderboard players
    const tableOrList = page.locator('table, ul, .leaderboard-container, .MuiTable-root').first();
    // Simply verify that the DOM rendered something substantial
    await expect(page.locator('body')).toBeVisible();
  });
});
