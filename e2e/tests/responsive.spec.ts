import { expect, test } from '@playwright/test'
import { login } from '../helpers/platform'
for (const width of [360, 390, 768, 1024, 1280, 1440, 1920])
  test(`主要入口在 ${width}px 下可使用`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/zh-CN')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy()
    const account = await login(page)
    await page.goto('/zh-CN/app/w/' + account.workspace)
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy()
    await page.screenshot({ path: info.outputPath('overview-' + width + '.png'), fullPage: true })
    await page.goto('/m/template-list?workspace=' + account.workspace)
    await expect(page.getByText('已发布的回归模板')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy()
  })
test('中英文、深浅主题与短屏', async ({ page }, info) => {
  const account = await login(page)
  for (const locale of ['zh-CN', 'en'])
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width: 1280, height: 640 })
      await page.goto('/' + locale + '/app/w/' + account.workspace)
      await page
        .getByRole('combobox', { name: locale === 'en' ? 'Appearance' : '外观' })
        .selectOption(theme)
      await expect(page.locator('html')).toHaveClass(new RegExp(theme))
      await page.screenshot({ path: info.outputPath(locale + '-' + theme + '.png') })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBeTruthy()
    }
  await page.getByRole('combobox', { name: 'Appearance' }).selectOption('system')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/dark/)
})
