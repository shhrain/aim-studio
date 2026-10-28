import { expect, test } from '@playwright/test'
import { login, web, business } from '../helpers/platform'

test('移动端浏览已发布版本、预览和模拟发送记录', async ({ page }) => {
  const state = await login(page)
  await page.goto('/m/template-list?workspace=' + state.workspace)
  await expect(page.getByText('已发布的回归模板')).toBeVisible()
  await page.getByText('已发布的回归模板').click()
  await expect(page.getByRole('button', { name: '测试发送', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '测试发送', exact: true }).click()
  await page.getByLabel('接收号码').fill('13800138000')
  await page.getByRole('button', { name: '创建模拟任务' }).click()
  await expect(page.getByText('任务已受理', { exact: true })).toBeVisible()
  await page.goto('/m/send-records')
  await expect(page.getByText('已发布的回归模板').first()).toBeVisible()
  await expect(page.getByText(/模拟/).first()).toBeVisible()
  await page.getByRole('button', { name: '预览', exact: true }).first().click()
  await expect(page.locator('.aim-root')).toBeVisible()
})
test('联系人增改和能力查询', async ({ page }) => {
  const state = await login(page)
  const prefix = '/api/v1/workspaces/' + state.workspace
  const contact = await business(page.request, prefix + '/contacts', {
    contactName: '回归联系人',
    mobile: '13800138001',
  })
  await page.goto('/m/send-objects')
  await expect(page.getByText('回归联系人')).toBeVisible()
  await business(
    page.request,
    prefix + '/contacts/' + contact.id,
    { contactName: '更新后的联系人', mobile: '13800138001' },
    'PUT',
  )
  await page.reload()
  await expect(page.getByText('更新后的联系人')).toBeVisible()
  await page.goto('/m/ability-query')
  await page.getByPlaceholder('输入要查询的手机号').fill('13800138001')
  await page.getByRole('button', { name: '立即查询' }).click()
  await expect(page.getByText('13800138001').first()).toBeVisible()
})
test('匿名业务页面回到登录，旧 token 不授予身份', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/m/?token=obsolete&phone=13800138000')
  await expect(page).toHaveURL(new RegExp(web + '/zh-CN/login'))
  await expect(page.getByRole('heading', { name: '登录', exact: true })).toBeVisible()
})
