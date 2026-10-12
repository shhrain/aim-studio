import { expect, test, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/?token=e2e-token&phone=13800138000')
  await expect(page).toHaveURL(/\/template-list$/)
}

test.describe('移动端体验', () => {
  test('未登录跳转登录提示，体验登录后回到目标页', async ({ page }) => {
    await page.goto('/send-records')
    await expect(page).toHaveURL(/\/auth-required/)
    await page.getByRole('button', { name: '体验登录' }).click()
    await expect(page).toHaveURL(/\/send-records$/)
  })

  test('URL 携带 token 进入：清理地址并写入 Cookie', async ({ page, context }) => {
    await login(page)
    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'aim_token')?.value).toBe('e2e-token')
    await expect(page.getByRole('heading', { name: '模板体验' })).toBeVisible()
    await expect(page.locator('.waterfall > a').first()).toBeVisible({ timeout: 30_000 })
  })

  test('详情页测试发送全流程', async ({ page }) => {
    await login(page)
    await page.goto('/detail?tplId=tpl_travel')
    await expect(page.locator('.aim-card')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: '测试发送' }).click()
    await page.getByRole('button', { name: '下一步：确认号码' }).click()
    await expect(page.getByText('13800138000')).toBeVisible()
    await page.getByRole('button', { name: /^发送 \d+ 个号码$/ }).click()

    // Mock 验证码：读取图片 SVG 中的数字
    const img = page.getByAltText('图形验证码')
    await expect(img).toBeVisible()
    const code = await page.evaluate(async () => {
      const el = document.querySelector<HTMLImageElement>('img[alt="图形验证码"]')!
      const svg = await (await fetch(el.src)).text()
      return [...svg.matchAll(/>(\d)<\/text>/g)].map((m) => m[1]).join('')
    })
    await page.getByPlaceholder('4 位验证码').fill(code)
    await page.getByRole('button', { name: '确认发送' }).click()
    await expect(page.getByText('已提交发送')).toBeVisible()

    await page.getByRole('button', { name: '查看发送记录' }).click()
    await expect(page).toHaveURL(/\/send-records$/)
    await expect(page.getByText('国庆出游季').first()).toBeVisible()
  })

  test('能力查询', async ({ page }) => {
    await login(page)
    await page.goto('/ability-query')
    await page.getByPlaceholder('输入要查询的手机号').fill('13800138000,13912345678')
    await page.getByRole('button', { name: '立即查询' }).click()
    await expect(page.locator('li', { hasText: '13912345678' })).toBeVisible()
  })
})
