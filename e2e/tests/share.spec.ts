import { expect, test } from '@playwright/test'
import { login, business } from '../helpers/platform'

test('持久化分享可匿名预览，撤销后立即失效', async ({ page, browser }) => {
  const state = await login(page)
  const prefix = '/api/v1/workspaces/' + state.workspace
  const share = await business(page.request, prefix + '/shares', { templateId: state.template })
  const context = await browser.newContext()
  const anonymous = await context.newPage()
  await anonymous.goto(share.url)
  await expect(anonymous.getByRole('heading', { name: '已发布的回归模板' })).toBeVisible()
  await expect(anonymous.locator('.aim-root')).toBeVisible()
  await business(page.request, prefix + '/shares/' + share.id, undefined, 'DELETE')
  await anonymous.reload()
  await expect(anonymous.getByText(/分享已过期、被撤销或不存在/)).toBeVisible()
  await context.close()
})
test('不存在的分享不会进入登录循环', async ({ page }) => {
  await page.goto('/m/preview/invalid-share')
  await expect(page.getByRole('heading', { name: '无法预览' })).toBeVisible()
  await expect(page).toHaveURL(/\/m\/preview\/invalid-share$/)
})
