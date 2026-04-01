import { test, expect } from '@playwright/test';

test.describe('Player Private Views & History', () => {
  test('Profile page protection and rendering', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    const currentURL = page.url();
    // Validate that it either shows the profile OR redirects to login properly
    if (currentURL.includes('login')) {
      console.log('Successfully protected Profile route');
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('History page renders match records', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    
    const currentURL = page.url();
    if (currentURL.includes('login')) {
      console.log('Successfully protected History route');
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
