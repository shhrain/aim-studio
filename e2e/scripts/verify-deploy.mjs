import { chromium } from '@playwright/test'
import { createDocument } from '@aim/template-core'
import { randomBytes, createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
const base =
  process.env.DEPLOY_WEB_URL ??
  `http://${process.argv[2] ?? 'localhost'}:${process.argv[3] ?? '3000'}`
const docs = process.env.DEPLOY_DOCS_URL ?? `http://${process.argv[2] ?? 'localhost'}:3002`
const mailpit = process.env.DEPLOY_MAILPIT_URL ?? 'http://127.0.0.1:8025'
const stateFile = new URL('../../.cache/deploy-verification.json', import.meta.url)
const browser = await chromium.launch(
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {},
)
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } }),
  request = context.request
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const check = async (url) => {
  const response = await request.get(url)
  if (!response.ok()) throw new Error(`${url}: HTTP ${response.status()}`)
  return response
}
const call = async (path, data, method = 'POST', extra = {}) => {
  const response = await request.fetch(base + path, {
    method,
    headers: { Origin: base, ...extra },
    ...(data === undefined ? {} : { data }),
  })
  if (!response.ok()) throw new Error(`${path}: HTTP ${response.status()} ${await response.text()}`)
  return (await response.json()).data
}
try {
  for (const path of [
    base + '/api/health',
    base + '/api/v1/capabilities',
    base + '/m/api/health',
    docs + '/api/health',
    docs + '/llms.txt',
  ])
    await check(path)
  let state
  if (process.env.DEPLOY_VERIFY_EXISTING === 'true') {
    state = JSON.parse(await readFile(stateFile, 'utf8'))
    await call('/api/auth/sign-in/email', { email: state.email, password: state.password })
  } else {
    const email = 'deploy-' + Date.now() + '@example.com',
      password = randomBytes(24).toString('hex')
    await call('/api/auth/sign-up/email', {
      name: '部署验收',
      email,
      password,
      callbackURL: base + '/zh-CN/app',
    })
    let link = ''
    const deadline = Date.now() + 60000
    while (Date.now() < deadline && !link) {
      const list = await (await check(mailpit + '/api/v1/messages')).json()
      const item = list.messages.find((m) => m.To?.some((to) => to.Address === email))
      if (item) {
        const message = await (await check(mailpit + '/api/v1/message/' + item.ID)).json()
        link = message.Text.match(/https?:\/\/\S+/)?.[0] ?? ''
      }
      if (!link) await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (!link) throw new Error('未收到注册验证邮件，请检查 worker 和 SMTP')
    await check(link)
    await call('/api/auth/sign-in/email', { email, password })
    const workspace = await call('/api/v1/workspaces', { name: '部署回归空间' }),
      prefix = '/api/v1/workspaces/' + workspace.id
    const doc = createDocument({ layoutId: 'com.hbm.pureText', name: '部署回归模板' })
    for (const el of doc.pages[0].elements) {
      if (el.type === 'text') el.props.text = el.slot === 'title' ? '部署验证' : '模板流程验证'
      if (el.type === 'button') el.event = { action: 'OPEN_URL', target: 'https://example.com' }
    }
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNIM56ZZjyTAUIBACC6BMnI2eTcAAAAAElFTkSuQmCC',
      'base64',
    )
    const uploaded = await request.post(base + prefix + '/materials', {
      headers: { Origin: base },
      multipart: { file: { name: 'persistence.png', mimeType: 'image/png', buffer: png } },
    })
    if (!uploaded.ok()) throw new Error('素材上传失败：' + (await uploaded.text()))
    const material = (await uploaded.json()).data
    await call(prefix + '/templates', doc)
    await call(prefix + '/templates/' + doc.id + '/submit', { revision: 1 })
    const reviews = await call(prefix + '/reviews', undefined, 'GET'),
      review = reviews.find((r) => r.template_id === doc.id)
    await call(prefix + '/reviews/' + review.id + '/decision', { decision: 'approved' })
    await call(prefix + '/templates/' + doc.id + '/publish', { versionId: review.version_id })
    state = {
      email,
      password,
      workspace: workspace.id,
      template: doc.id,
      material: material.url,
      hash: digest(png),
    }
    const caps = await call('/api/v1/capabilities', undefined, 'GET')
    if (caps.send && caps.mode === 'simulated')
      state.job = (
        await call(
          prefix + '/delivery-jobs',
          { templateId: doc.id, mobiles: ['13800138000'], sendMode: 'priority' },
          'POST',
          { 'Idempotency-Key': randomBytes(24).toString('hex') },
        )
      ).id
    await mkdir(new URL('../../.cache/', import.meta.url), { recursive: true })
    await writeFile(stateFile, JSON.stringify(state), { mode: 0o600 })
  }
  const prefix = '/api/v1/workspaces/' + state.workspace,
    template = await call(prefix + '/templates/' + state.template, undefined, 'GET')
  if (process.env.DEPLOY_MUTATE === 'true') {
    await call(
      prefix + '/templates/' + state.template,
      { document: { ...template.document, name: '恢复前的临时修改' }, revision: template.revision },
      'PUT',
    )
    console.log('已在隔离验收空间写入临时修改，用于随后验证备份恢复。')
  } else {
    if (template.document.name !== '部署回归模板') throw new Error('模板持久化或备份恢复校验失败')
    const file = await check(base + state.material)
    if (digest(await file.body()) !== state.hash) throw new Error('素材文件校验失败')
    if (state.job) {
      const deadline = Date.now() + 60000
      let status
      do {
        status = (await call(prefix + '/tasks/' + state.job, undefined, 'GET')).status
        if (status === 'failed') throw new Error('后台模拟任务失败')
        if (status !== 'done') await new Promise((resolve) => setTimeout(resolve, 500))
      } while (status !== 'done' && Date.now() < deadline)
      if (status !== 'done') throw new Error('worker 未在时限内完成任务')
    }
    const page = await context.newPage()
    await page.goto(base + '/zh-CN/app/w/' + state.workspace + '/templates')
    await page.getByText('部署回归模板', { exact: true }).waitFor()
    await page.goto(base + '/m/template-list?workspace=' + state.workspace)
    await page.getByText('部署回归模板', { exact: true }).waitFor()
    await page.goto(docs + '/docs/platform')
    await page.getByRole('heading', { name: '平台、账号与业务流程', exact: true }).waitFor()
    console.log(
      '通过：真实账号、模板审核发布、移动端、文档与素材完整性' +
        (state.job ? '、持久化模拟任务。' : '；发送通道未启用。'),
    )
  }
} finally {
  await context.close()
  await browser.close()
}
