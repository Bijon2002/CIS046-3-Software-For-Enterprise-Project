// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://uob-game.netlify.app',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'msedge', // 🔥 Uses System Edge to bypass AppLocker
      },
    },
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: {
        ...devices['Pixel 5'], // Emulates a standard mobile viewport
        channel: 'msedge', // 🔥 Uses Edge on the backend to avoid AppLocker blocks
      },
    },
    {
      name: 'iPhone 14 Pro Max',
      use: {
        ...devices['iPhone 14 Pro Max'], // Brings in iPhone Viewport, Touch support, UserAgent
        browserName: 'chromium', // 🔥 Force Chromium engine instead of default WebKit
        channel: 'msedge', // 🔥 Uses safe system Edge to bypass Windows AppLocker
      },
    },
  ],
});
