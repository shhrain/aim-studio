import { defineConfig, devices } from '@playwright/test'

const prod = Boolean(process.env.CI || process.env.E2E_PROD)
const cmd = (app: string) =>
  prod ? `pnpm --filter @aim/${app} start` : `pnpm --filter @aim/${app} dev`

/**
 * 端到端测试：编辑器（PC）、移动端（Pixel 7 视口）、扫码分享、视觉回归。
 * 本地默认复用已启动的 dev 服务；CI 中先 build 再 start。
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    {
      name: 'editor',
      testMatch: /(editor|visual|scroll)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'mobile',
      testMatch: /(mobile|share)\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: 'http://localhost:3001' },
    },
  ],
  webServer: [
    {
      command: cmd('editor'),
      url: 'http://localhost:3000/templates',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: '..',
    },
    {
      command: cmd('mobile'),
      url: 'http://localhost:3001/auth-required',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: '..',
    },
  ],
})
