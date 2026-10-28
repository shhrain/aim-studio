import { expect, test } from '@playwright/test'
import { web, mailLink, login, business } from '../helpers/platform'

test('真实找回邮件、密码重置和设备会话撤销', async ({ page, browser }) => {
  const email = 'password-' + Date.now() + '@example.com'
  const password = crypto.randomUUID() + '!'
  const changed = crypto.randomUUID() + '!'
  const registered = await page.request.post(web + '/api/auth/sign-up/email', {
    headers: { Origin: web },
    data: { name: '密码回归', email, password, callbackURL: web + '/zh-CN/app' },
  })
  expect(registered.ok(), await registered.text()).toBeTruthy()
  await page.request.get(await mailLink(page.request, email))
  await page.goto('/zh-CN/forgot-password')
  await page.getByLabel('邮箱', { exact: true }).fill(email)
  await page.getByRole('button', { name: '忘记密码？', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('邮件')
  await page.goto(await mailLink(page.request, email, '/reset-password/'))
  await page.getByLabel('密码', { exact: true }).fill(changed)
  await page.getByRole('button', { name: '重置密码', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('邮箱', { exact: true }).fill(email)
  await page.getByLabel('密码', { exact: true }).fill(changed)
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL(/\/app/)
  const second = await browser.newContext()
  try {
    expect(
      (
        await second.request.post(web + '/api/auth/sign-in/email', {
          headers: { Origin: web },
          data: { email, password: changed },
        })
      ).ok(),
    ).toBeTruthy()
    const sessions = await page.request.get(web + '/api/auth/list-sessions')
    expect((await sessions.json()).length).toBeGreaterThanOrEqual(2)
    await page.goto('/zh-CN/app/settings')
    const updatedEmail = 'updated-' + Date.now() + '@example.com'
    await page.getByLabel('邮箱', { exact: true }).fill(updatedEmail)
    await page.getByRole('button', { name: '修改邮箱', exact: true }).click()
    await page.goto(await mailLink(page.request, updatedEmail, '/verify-email'))
    await expect
      .poll(async () => (await (await page.request.get(web + '/api/v1/me')).json()).data?.email)
      .toBe(updatedEmail)
    await page.goto('/zh-CN/app/settings')
    await page.getByRole('button', { name: '退出全部设备', exact: true }).click()
    await expect.poll(async () => (await second.request.get(web + '/api/v1/me')).status()).toBe(401)
  } finally {
    await second.close()
  }
})

test('工作空间切换隔离与邀请撤销', async ({ page }) => {
  const account = await login(page)
  const another = await business<any>(page.request, '/api/v1/workspaces', { name: '第二工作空间' })
  await page.goto('/zh-CN/app/w/' + another.id + '/templates')
  await expect(page.getByText('已发布的回归模板', { exact: true })).toHaveCount(0)
  const cross = await page.request.get(
    web + '/api/v1/workspaces/' + another.id + '/templates/' + account.template,
  )
  expect(cross.status()).toBe(404)
  const prefix = '/api/v1/workspaces/' + another.id
  await business(page.request, prefix + '/team/invite', {
    email: 'pending-' + Date.now() + '@example.com',
    role: 'viewer',
  })
  await page.goto('/zh-CN/app/w/' + another.id + '/team')
  await page.getByRole('button', { name: '撤销邀请', exact: true }).click()
  await expect(page.getByRole('button', { name: '撤销邀请', exact: true })).toHaveCount(0)
  await page.goto('/zh-CN/app/w/' + account.workspace + '/templates')
  await expect(page.getByText('已发布的回归模板', { exact: true })).toBeVisible()
})
