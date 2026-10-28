import { expect, test } from '@playwright/test'
import { docs } from '../helpers/platform'
test('文档导航、搜索、预览及 AI 文档入口', async ({ page, request }) => {
  await page.goto(docs + '/docs/platform')
  await expect(
    page.getByRole('heading', { name: '平台、账号与业务流程', exact: true }),
  ).toBeVisible()
  await page.goto(docs + '/docs/spec/layouts')
  await expect(page.locator('.aim-root').first()).toBeVisible()
  for (const path of [
    '/llms.txt',
    '/llms-full.txt',
    '/api/health',
    '/docs/deployment',
    '/docs/sdk/react',
    '/docs/product/mobile',
  ]) {
    const response = await request.get(docs + path)
    expect(response.ok(), path).toBeTruthy()
    expect(await response.text()).not.toContain('Internal Server Error')
  }
  await page.goto(docs + '/docs')
  await expect(page.getByRole('link', { name: /平台、账号/ }).first()).toBeVisible()
  // 侧栏搜索按钮可见；隐藏的移动端触发器可能同名，必须按可见性过滤。
  const searchTrigger = page
    .getByRole('button', { name: /搜索(文档)?/ })
    .filter({ visible: true })
    .first()
  await expect(searchTrigger).toBeVisible()
  await searchTrigger.click()
  const searchDialog = page.getByRole('dialog')
  await expect(searchDialog).toBeVisible()
  const searchInput = searchDialog.getByRole('combobox').or(searchDialog.locator('input')).first()
  await searchInput.fill('工作空间')
  await expect(searchDialog.getByRole('option').first()).toBeVisible({ timeout: 20_000 })
  await page.keyboard.press('Escape')
  const search = await request.get(docs + '/api/search?query=' + encodeURIComponent('工作空间'))
  expect(search.ok()).toBeTruthy()
  expect((await search.json()).length).toBeGreaterThan(0)
})
