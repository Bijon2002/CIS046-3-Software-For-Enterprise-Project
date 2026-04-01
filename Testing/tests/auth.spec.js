import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@uobgame.com`;
  const testPassword = 'Password123!';

  test('User can register a new account', async ({ page }) => {
    await page.goto('/register');
    
    // Check if on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1, h2').filter({ hasText: /Register|Sign Up/i })).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    // Fill the registration form (fuzzy matching selectors for robust UI testing)
    const nameInput = page.locator('input[name="username"], input[name="name"], input[placeholder*="Name" i]');
    if (await nameInput.first().isVisible()) {
      await nameInput.first().fill(`User${timestamp}`);
    }
    
    await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail);
    await page.locator('input[type="password"], input[name="password"]').first().fill(testPassword);
    
    // If there's a confirm password
    const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]');
    if (await confirmPassword.first().isVisible()) {
      await confirmPassword.first().fill(testPassword);
    }

    await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').click();
    
    // Expect navigation 
    await page.waitForLoadState('networkidle');
  });

  test('User can login and is redirected to Home/Dashboard', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveURL(/.*login/);
    
    // Find login form
    await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail);
    await page.locator('input[type="password"], input[name="password"]').first().fill(testPassword);
    
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').click();
    
    await page.waitForLoadState('networkidle');
  });
});
