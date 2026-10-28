import { defineConfig, devices } from '@playwright/test'
const web = process.env.E2E_WEB_URL ?? 'http://localhost:3100'
export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: { timeout: 30000, toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' } },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: web,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    {
      name: 'web',
      testMatch: /(account|editor|scroll|visual|responsive)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', testMatch: /(mobile|share)\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'docs', testMatch: /docs\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
  webServer:
    process.env.E2E_EXTERNAL === 'true'
      ? undefined
      : {
          command: 'node --import tsx apps/api/test/system-server.ts',
          url: web + '/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 240000,
          cwd: '..',
        },
})
