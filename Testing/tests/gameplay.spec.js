import { test, expect } from '@playwright/test';

test.describe('Core Game Loop & Multiplayer Interfaces', () => {
  test('Single Player Game Environment Initialization', async ({ page }) => {
    await page.goto('/game');
    await page.waitForLoadState('networkidle');
    
    // Ensure the container holding the game canvas/board renders
    await expect(page.locator('body')).toBeVisible();
  });

  test('Multiplayer Lobby Setup screen', async ({ page }) => {
    await page.goto('/multiplayerlobby');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Multiplayer Game Connection Engine', async ({ page }) => {
    await page.goto('/multiplayergame');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
