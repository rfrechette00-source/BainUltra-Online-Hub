// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Default to the live GitHub Pages site. Override with BASE_URL env var for
// local testing (e.g. BASE_URL=http://localhost:8080 npm test after running
// `python3 -m http.server 8080` in the project root).
const LIVE_URL = 'https://rfrechette00-source.github.io/BainUltra-Online-Hub';
const baseURL = process.env.BASE_URL || LIVE_URL;
const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  ...(isLocal && {
    webServer: {
      command: 'python3 -m http.server 8080',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  }),
});
