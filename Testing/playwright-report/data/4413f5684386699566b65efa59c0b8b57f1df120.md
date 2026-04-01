# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication Flows >> User can login and is redirected to Home/Dashboard
- Location: tests\auth.spec.js:36:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"], input[name="email"]').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "🍌 Banana Brain Quest" [ref=e4] [cursor=pointer]:
      - /url: /home
    - link "Login" [ref=e5] [cursor=pointer]:
      - /url: /login
    - link "Register" [ref=e6] [cursor=pointer]:
      - /url: /register
  - generic [ref=e8]:
    - heading "🍌 LOGIN" [level=2] [ref=e9]
    - generic [ref=e10]:
      - textbox "Email" [ref=e11]
      - textbox "Password" [ref=e12]
      - button "Enter Jungle" [ref=e13] [cursor=pointer]
    - paragraph [ref=e14]:
      - text: No account?
      - link "Register" [ref=e15] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flows', () => {
  4  |   const timestamp = Date.now();
  5  |   const testEmail = `testuser_${timestamp}@uobgame.com`;
  6  |   const testPassword = 'Password123!';
  7  | 
  8  |   test('User can register a new account', async ({ page }) => {
  9  |     await page.goto('/register');
  10 |     
  11 |     // Check if on register page
  12 |     await expect(page).toHaveURL(/.*register/);
  13 |     await expect(page.locator('h1, h2').filter({ hasText: /Register|Sign Up/i })).toBeVisible({ timeout: 10000 }).catch(() => {});
  14 |     
  15 |     // Fill the registration form (fuzzy matching selectors for robust UI testing)
  16 |     const nameInput = page.locator('input[name="username"], input[name="name"], input[placeholder*="Name" i]');
  17 |     if (await nameInput.first().isVisible()) {
  18 |       await nameInput.first().fill(`User${timestamp}`);
  19 |     }
  20 |     
  21 |     await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail);
  22 |     await page.locator('input[type="password"], input[name="password"]').first().fill(testPassword);
  23 |     
  24 |     // If there's a confirm password
  25 |     const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]');
  26 |     if (await confirmPassword.first().isVisible()) {
  27 |       await confirmPassword.first().fill(testPassword);
  28 |     }
  29 | 
  30 |     await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').click();
  31 |     
  32 |     // Expect navigation 
  33 |     await page.waitForLoadState('networkidle');
  34 |   });
  35 | 
  36 |   test('User can login and is redirected to Home/Dashboard', async ({ page }) => {
  37 |     await page.goto('/login');
  38 |     
  39 |     await expect(page).toHaveURL(/.*login/);
  40 |     
  41 |     // Find login form
> 42 |     await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail);
     |                                                                            ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  43 |     await page.locator('input[type="password"], input[name="password"]').first().fill(testPassword);
  44 |     
  45 |     await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').click();
  46 |     
  47 |     await page.waitForLoadState('networkidle');
  48 |   });
  49 | });
  50 | 
```