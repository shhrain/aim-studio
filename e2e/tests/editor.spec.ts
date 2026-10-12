import { expect, test } from '@playwright/test'

test.describe('模板编辑器', () => {
  test.beforeEach(async ({ page }) => {
    // 跳过新手引导
    await page.addInitScript(() => localStorage.setItem('aim:editor-tour-v1', 'true'))
  })

  test('模板列表展示示例模板与状态', async ({ page }) => {
    await page.goto('/templates')
    await expect(page.getByRole('heading', { name: '我的模板' })).toBeVisible()
    await expect(page.locator('article')).toHaveCount(18, { timeout: 30_000 })
    await page.getByRole('tab', { name: '已驳回' }).click()
    await expect(page.getByText(/驳回原因/).first()).toBeVisible()
  })

  test('新建图文模板：编辑、自动保存、多厂商预览', async ({ page }) => {
    await page.goto('/editor/new')
    await page.locator('button', { hasText: '大图 + 标题 + 描述 + 按钮' }).click()

    await page.getByRole('textbox', { name: '模板名称' }).first().fill('E2E 测试模板')
    await page.locator('.aim-el[data-selectable][data-slot="title"]').click()
    const text = page.getByRole('textbox', { name: /文本/ })
    await text.fill('端到端测试标题')
    await expect(page.locator('.aim-el[data-selectable][data-slot="title"]')).toContainText(
      '端到端测试标题',
    )
    await expect(page.getByText('7/17')).toBeVisible()

    await expect(page.getByText(/已自动保存/)).toBeVisible({ timeout: 20_000 })
    await expect(page).toHaveURL(/\/editor\/tpl_/)

    await page.getByRole('button', { name: '预览', exact: true }).click()
    await expect(page.getByText('华为手机')).toBeVisible()
    await expect(page.getByText('小米手机')).toBeVisible()
    await page.getByRole('tab', { name: '三信融合' }).click()
    await expect(page.getByText('苹果 · 5G 消息')).toBeVisible()
  })

  test('未通过预检时不可提交', async ({ page }) => {
    await page.goto('/editor/new?layout=com.hbm.imageandtext')
    await page.getByRole('button', { name: '提交审核' }).first().click()
    await expect(page.getByText('请先修复上方错误')).toBeVisible()
    await expect(page.getByRole('button', { name: '提交审核' }).last()).toBeDisabled()
    await expect(page.getByText('请填写模板名称')).toBeVisible()
  })

  test('版式画廊渲染全部版式', async ({ page }) => {
    await page.goto('/gallery')
    await expect(page.locator('figure[data-testid^="gallery-"]')).toHaveCount(34, {
      timeout: 30_000,
    })
  })
})
