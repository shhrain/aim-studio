import { expect, test } from '@playwright/test'
import { login, web, business, mailLink, seedTemplate } from '../helpers/platform'
import { createDocument } from '@aim/template-core'

test('邮箱注册、真实验证邮件、工作空间和模板完整流程', async ({ page }) => {
  const email = 'flow-' + Date.now() + '@example.com',
    password = 'Flow-' + crypto.randomUUID() + '!'
  await page.goto('/zh-CN/register')
  await page.getByLabel('名称', { exact: true }).fill('流程回归')
  await page.getByLabel('邮箱', { exact: true }).fill(email)
  await page.getByLabel('密码', { exact: true }).fill(password)
  await page.getByLabel('确认密码', { exact: true }).fill(password)
  await page.getByRole('button', { name: '创建账号', exact: true }).click()
  await expect(page).toHaveURL(/verify-email/)
  await page.goto(await mailLink(page.request, email))
  await expect(page.getByRole('heading', { name: '创建工作空间' })).toBeVisible()
  await page.getByLabel('名称', { exact: true }).fill('流程回归工作空间')
  await page.getByRole('button', { name: '创建工作空间', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/w\//)
  const workspace = new URL(page.url()).pathname.split('/')[4]!
  const prefix = '/api/v1/workspaces/' + workspace
  await page.getByRole('link', { name: '新建模板', exact: true }).click()
  await expect(page.getByRole('heading', { name: /选择版式/ })).toBeVisible()
  const doc = createDocument({ layoutId: 'com.hbm.pureText', name: '全流程回归模板' })
  for (const el of doc.pages[0]!.elements) {
    if (el.type === 'text') el.props.text = el.slot === 'title' ? '预约已确认' : '请按预约时间到店'
    if (el.type === 'button') el.event = { action: 'OPEN_URL', target: 'https://example.com' }
  }
  await business(page.request, prefix + '/templates', doc)
  await page.goto(`/zh-CN/app/w/${workspace}/create/${doc.id}`)
  await expect(page.getByRole('button', { name: '预览', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '预览', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await business(page.request, prefix + '/templates/' + doc.id + '/submit', { revision: 1 })
  let reviews = await business<any[]>(page.request, prefix + '/reviews', undefined, 'GET')
  let review = reviews.find((r) => r.template_id === doc.id)!
  await page.goto(`/zh-CN/app/w/${workspace}/reviews`)
  await expect(page.getByText('全流程回归模板')).toBeVisible()
  await business(page.request, prefix + '/reviews/' + review.id + '/decision', {
    decision: 'rejected',
    reason: '请调整正文',
  })
  await business(
    page.request,
    prefix + '/templates/' + doc.id,
    { document: doc, revision: 1 },
    'PUT',
  )
  await business(page.request, prefix + '/templates/' + doc.id + '/submit', { revision: 2 })
  reviews = await business(page.request, prefix + '/reviews', undefined, 'GET')
  review = reviews.find((r) => r.template_id === doc.id && r.status === 'reviewing')!
  await business(page.request, prefix + '/reviews/' + review.id + '/decision', {
    decision: 'approved',
  })
  await business(page.request, prefix + '/templates/' + doc.id + '/publish', {
    versionId: review.version_id,
  })
  await page.goto('/m/template-list?workspace=' + workspace)
  await expect(page.getByText('全流程回归模板')).toBeVisible()
})
test('保存、双会话版本冲突和版本历史', async ({ page }) => {
  const state = await login(page)
  const prefix = '/api/v1/workspaces/' + state.workspace
  const doc = createDocument({ layoutId: 'com.hbm.pureText', name: '并发草稿' })
  await business(page.request, prefix + '/templates', doc)
  await business(
    page.request,
    prefix + '/templates/' + doc.id,
    { document: doc, revision: 1 },
    'PUT',
  )
  const stale = await page.request.put(web + prefix + '/templates/' + doc.id, {
    headers: { Origin: web },
    data: { document: doc, revision: 1 },
  })
  expect(stale.status()).toBe(409)
  await page.goto(`/zh-CN/app/w/${state.workspace}/create/${doc.id}`)
  await page.getByRole('textbox', { name: '模板名称', exact: true }).fill('自动保存草稿')
  await expect(page.getByText(/已自动保存/)).toBeVisible()
  await expect
    .poll(
      async () =>
        (await business<any>(page.request, prefix + '/templates/' + doc.id, undefined, 'GET'))
          .document.name,
    )
    .toBe('自动保存草稿')
  const current = await business<any>(
    page.request,
    prefix + '/templates/' + doc.id,
    undefined,
    'GET',
  )
  await business(
    page.request,
    prefix + '/templates/' + doc.id,
    { document: current.document, revision: current.revision },
    'PUT',
  )
  await page.getByRole('textbox', { name: '模板名称', exact: true }).fill('未覆盖的冲突草稿')
  await expect(page.getByRole('alert').filter({ hasText: '其他会话更新' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重新加载最新版', exact: true })).toBeVisible()
  const final = await business<any>(page.request, prefix + '/templates/' + doc.id, undefined, 'GET')
  expect(final.document.name).toBe('自动保存草稿')
})

test('离线备份恢复，语言切换保留编辑内容', async ({ page, context }) => {
  const state = await login(page)
  const id = await seedTemplate(
    page.request,
    state.workspace,
    '离线恢复模板',
    'com.hbm.pureText',
    false,
  )
  const path = `/zh-CN/app/w/${state.workspace}/create/${id}`
  await page.goto(path)
  const name = page.getByRole('textbox', { name: '模板名称', exact: true })
  await expect(name).toBeVisible()
  await context.setOffline(true)
  try {
    await name.fill('离线保留的内容')
    await expect(page.getByRole('button', { name: /保存失败/ })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
  page.on('dialog', (dialog) => void dialog.accept())
  await page.reload()
  await page.getByRole('button', { name: '恢复草稿', exact: true }).click()
  await expect(name).toHaveValue('离线保留的内容')
  await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
  await expect(page).toHaveURL(new RegExp('/en/app/w/' + state.workspace + '/create/' + id))
  await expect(page.locator('header input').last()).toHaveValue('离线保留的内容')
  const stored = await business<any>(
    page.request,
    '/api/v1/workspaces/' + state.workspace + '/templates/' + id,
    undefined,
    'GET',
  )
  expect(stored.document.name).toBe('离线保留的内容')
})

test('手机审核中模板保持只读', async ({ page }) => {
  const state = await login(page)
  const id = await seedTemplate(
    page.request,
    state.workspace,
    '手机只读模板',
    'com.hbm.pureText',
    false,
  )
  await business(
    page.request,
    '/api/v1/workspaces/' + state.workspace + '/templates/' + id + '/submit',
    { revision: 1 },
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/zh-CN/app/w/${state.workspace}/create/${id}`)
  await expect(page.getByRole('textbox', { name: '名称', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '提交审核', exact: true })).toBeDisabled()
})
