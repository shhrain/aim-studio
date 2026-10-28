import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { createDocument } from '@aim/template-core'
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'

export const web = process.env.E2E_WEB_URL ?? 'http://localhost:3100'
export const docs = process.env.E2E_DOCS_URL ?? 'http://localhost:3102'
export const mailpit = process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:18026'
let cached:
  | {
      email: string
      password: string
      workspace: string
      template: string
      cookies: Awaited<ReturnType<APIRequestContext['storageState']>>['cookies']
    }
  | undefined
export async function mailLink(request: APIRequestContext, email: string, contains = web) {
  let text = ''
  await expect
    .poll(
      async () => {
        const res = await request.get(mailpit + '/api/v1/messages')
        const body = await res.json()
        const message = body.messages?.find((m: { To: { Address: string }[] }) =>
          m.To?.some((to) => to.Address === email),
        )
        if (!message) return ''
        const detail = await (await request.get(mailpit + '/api/v1/message/' + message.ID)).json()
        text = detail.Text ?? ''
        return text
      },
      { timeout: 45000, intervals: [500, 1000, 2000] },
    )
    .toContain(contains)
  return text.match(/https?:\/\/\S+/)![0]
}
export async function business<T = any>(
  request: APIRequestContext,
  path: string,
  body?: unknown,
  method = 'POST',
): Promise<T> {
  const response = await request.fetch(web + path, {
    method,
    headers: {
      Origin: web,
      'Content-Type': 'application/json',
      'Idempotency-Key': randomBytes(16).toString('hex'),
    },
    ...(body === undefined ? {} : { data: body }),
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()).data
}
export async function login(page: Page) {
  if (!cached) {
    const email = 'e2e-' + Date.now() + '-' + randomBytes(3).toString('hex') + '@example.com',
      password = randomBytes(24).toString('hex')
    const response = await page.request.post(web + '/api/auth/sign-up/email', {
      headers: { Origin: web },
      data: { name: '回归用户', email, password, callbackURL: web + '/zh-CN/app' },
    })
    expect(response.ok(), await response.text()).toBeTruthy()
    await page.request.get(await mailLink(page.request, email))
    const signed = await page.request.post(web + '/api/auth/sign-in/email', {
      headers: { Origin: web },
      data: { email, password },
    })
    expect(signed.ok(), await signed.text()).toBeTruthy()
    const workspace = (
      await business(page.request, '/api/v1/workspaces', { name: '自动化回归工作空间' })
    ).id
    const template = await seedTemplate(page.request, workspace, '已发布的回归模板')
    cached = {
      email,
      password,
      workspace,
      template,
      cookies: (await page.request.storageState()).cookies,
    }
  }
  await writeFile(
    new URL('../../.cache/qa-browser-credentials.json', import.meta.url),
    JSON.stringify({
      email: cached.email,
      password: cached.password,
      workspace: cached.workspace,
      template: cached.template,
    }),
  )
  await page.context().addCookies(cached.cookies)
  await page.addInitScript(() => localStorage.setItem('aim:editor-tour-v1', 'true'))
  return cached
}
export async function seedTemplate(
  request: APIRequestContext,
  workspace: string,
  name: string,
  layout = 'com.hbm.pureText',
  publish = true,
) {
  const doc = createDocument({ layoutId: layout, name })
  for (const el of doc.pages[0]!.elements) {
    if (el.type === 'text')
      el.props.text = el.slot === 'title' ? '预约已确认' : '请按预约时间到店。'
    if (el.type === 'button') el.event = { action: 'OPEN_URL', target: 'https://example.com' }
  }
  const prefix = '/api/v1/workspaces/' + workspace
  await business(request, prefix + '/templates', doc)
  if (publish) {
    await business(request, prefix + '/templates/' + doc.id + '/submit', { revision: 1 })
    const reviews = await business<any[]>(request, prefix + '/reviews', undefined, 'GET')
    const review = reviews.find((r) => r.template_id === doc.id)!
    await business(request, prefix + '/reviews/' + review.id + '/decision', {
      decision: 'approved',
    })
    await business(request, prefix + '/templates/' + doc.id + '/publish', {
      versionId: review.version_id,
    })
  }
  return doc.id
}
