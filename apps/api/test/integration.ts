import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { startDatabase } from './database'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDocument } from '@aim/template-core'

const postgres = await startDatabase()
process.env.DATABASE_URL = postgres.url
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString('hex')
process.env.PUBLIC_URL = 'http://localhost:3000'
process.env.PROVIDER_MODE = 'simulated'
process.env.NODE_ENV = 'test'
const { pool, db } = await import('../src/context')
try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../../packages/db/migrations', import.meta.url)),
  })
  const { app } = await import('../src/app')
  async function request(path: string, method = 'GET', body?: unknown, cookie = '', key = 'integration-idempotency') {
    const response = await app.request(`http://localhost:3000${path}`, {
      method,
      headers: {
        cookie,
        origin: 'http://localhost:3000',
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
    return { response, json }
  }
  async function register(email: string) {
    const signup = await request('/api/auth/sign-up/email', 'POST', {
      name: '测试用户',
      email,
      password: 'Test-password-2026!',
      callbackURL: '/zh-CN/app',
    })
    assert.equal(signup.response.status, 200, JSON.stringify(signup.json))
    const mail = (
      await pool.query(
        "SELECT payload FROM outbox WHERE topic='mail' AND payload->>'to'=$1 ORDER BY created_at DESC LIMIT 1",
        [email],
      )
    ).rows[0]
    assert.ok(mail, '必须生成验证邮件')
    const url = mail.payload.text.match(/http:\/\/localhost:3000\S+/)[0]
    const verification = await app.request(url)
    assert.ok([200, 302].includes(verification.status))
    const login = await request('/api/auth/sign-in/email', 'POST', {
      email,
      password: 'Test-password-2026!',
    })
    assert.equal(login.response.status, 200, JSON.stringify(login.json))
    const cookies = login.response.headers
      .getSetCookie()
      .map((v) => v.split(';')[0])
      .join('; ')
    assert.ok(cookies)
    return cookies
  }
  const owner = await register('owner@example.com')
  const stranger = await register('other@example.com')
  const workspace = await request(
    '/api/v1/workspaces',
    'POST',
    { name: '测试工作空间', default: true },
    owner,
  )
  assert.equal(workspace.response.status, 201, JSON.stringify(workspace.json))
  const ws = workspace.json.data.id
  const again = await request(
    '/api/v1/workspaces',
    'POST',
    { name: '重复初始化', default: true },
    owner,
  )
  assert.equal(again.json.data.id, ws, '默认空间幂等')
  assert.equal(
    (await request(`/api/v1/workspaces/${ws}/templates`, 'GET', undefined, stranger)).response
      .status,
    403,
  )
  assert.equal((await request(`/api/v1/workspaces/${ws}/templates`)).response.status, 401)
  const doc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '集成测试' })
  doc.meta.status = 'approved'
  const created = await request(`/api/v1/workspaces/${ws}/templates`, 'POST', doc, owner)
  assert.equal(created.response.status, 201, JSON.stringify(created.json))
  assert.equal(created.json.data.status, 'draft', '忽略客户端审核状态')
  const updated = await request(
    `/api/v1/workspaces/${ws}/templates/${doc.id}`,
    'PUT',
    { document: doc, revision: 1 },
    owner,
  )
  assert.equal(updated.response.status, 200, JSON.stringify(updated.json))
  assert.equal(updated.json.data.revision, 2)
  const stale = await request(
    `/api/v1/workspaces/${ws}/templates/${doc.id}`,
    'PUT',
    { document: doc, revision: 1 },
    owner,
  )
  assert.equal(stale.response.status, 409)
  const share = await request(
    `/api/v1/workspaces/${ws}/shares`,
    'POST',
    { templateId: doc.id },
    owner,
  )
  assert.equal(share.response.status, 200, JSON.stringify(share.json))
  const token = share.json.data.token
  assert.equal((await request(`/api/v1/public/shares/${token}`)).response.status, 200)
  await request(`/api/v1/workspaces/${ws}/shares/${share.json.data.id}`, 'DELETE', undefined, owner)
  assert.equal((await request(`/api/v1/public/shares/${token}`)).response.status, 404)
  const membership = (await pool.query('SELECT id FROM member WHERE organization_id=$1', [ws]))
    .rows[0]
  assert.equal(
    (
      await request(
        `/api/v1/workspaces/${ws}/team/${membership.id}`,
        'POST',
        { remove: true },
        owner,
      )
    ).response.status,
    409,
  )
  const other = (await pool.query('SELECT id FROM "user" WHERE email=$1', ['other@example.com']))
    .rows[0]
  await pool.query(
    "INSERT INTO member(id,organization_id,user_id,role) VALUES('viewer-test',$1,$2,'viewer')",
    [ws, other.id],
  )
  assert.equal(
    (
      await request(
        `/api/v1/workspaces/${ws}/templates`,
        'POST',
        { ...doc, id: 'forbidden' },
        stranger,
      )
    ).response.status,
    403,
  )
  await pool.query("DELETE FROM member WHERE id='viewer-test'")
  assert.equal(
    (await request(`/api/v1/workspaces/${ws}/templates`, 'GET', undefined, stranger)).response
      .status,
    403,
    '权限立即撤销',
  )
  const csrf = await app.request(`http://localhost:3000/api/v1/workspaces/${ws}/templates`, {
    method: 'POST',
    headers: { cookie: owner, origin: 'https://evil.invalid', 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
  assert.equal(csrf.status, 403)

  const valid = createDocument({ layoutId: 'com.hbm.pureText', name: '可发布通知' })
  for (const element of valid.pages[0]!.elements)
    if (element.event?.action === 'OPEN_URL') element.event.target = 'https://example.com'
  const base = '/api/v1/workspaces/' + ws
  assert.equal((await request(base + '/templates', 'POST', valid, owner)).response.status, 201)
  const firstSubmit = await request(
    base + '/templates/' + valid.id + '/submit',
    'POST',
    { revision: 1, precheckPassed: true },
    owner,
  )
  assert.equal(firstSubmit.response.status, 200, JSON.stringify(firstSubmit.json))
  let reviews = (await request(base + '/reviews', 'GET', undefined, owner)).json.data
  assert.equal(
    (
      await request(
        base + '/reviews/' + reviews[0].id + '/decision',
        'POST',
        { decision: 'rejected', reason: '请修改正文' },
        owner,
      )
    ).response.status,
    200,
  )
  assert.equal(
    (await request(base + '/templates/' + valid.id, 'PUT', { document: valid, revision: 1 }, owner))
      .response.status,
    200,
  )
  assert.equal(
    (await request(base + '/templates/' + valid.id + '/submit', 'POST', { revision: 2 }, owner))
      .response.status,
    200,
  )
  reviews = (await request(base + '/reviews', 'GET', undefined, owner)).json.data
  const current = reviews.find((r: any) => r.status === 'reviewing')
  assert.equal(
    (
      await request(
        base + '/reviews/' + current.id + '/decision',
        'POST',
        { decision: 'approved' },
        owner,
      )
    ).response.status,
    200,
  )
  assert.equal(
    (
      await request(
        base + '/templates/' + valid.id + '/publish',
        'POST',
        { versionId: current.version_id },
        owner,
      )
    ).response.status,
    200,
  )
  valid.name = '新草稿不覆盖发布版本'
  assert.equal(
    (await request(base + '/templates/' + valid.id, 'PUT', { document: valid, revision: 2 }, owner))
      .response.status,
    200,
  )
  const experience = (await request(base + '/experience/templates', 'GET', undefined, owner)).json
    .data
  assert.equal(experience.find((t: any) => t.tplId === valid.id).document.name, '可发布通知')
  const sending = { templateId: valid.id, mobiles: ['13800138000'], sendMode: 'priority' }
  const sent = await request(base + '/delivery-jobs', 'POST', sending, owner)
  assert.equal(sent.response.status, 202, JSON.stringify(sent.json))
  const twice = await request(base + '/delivery-jobs', 'POST', sending, owner)
  assert.equal(twice.json.data.id, sent.json.data.id, 'JSONB 属性顺序不能破坏幂等')
  assert.equal(
    (
      await request(
        base + '/delivery-jobs',
        'POST',
        { ...sending, mobiles: ['13800138001'] },
        owner,
      )
    ).response.status,
    409,
  )
  const { processEvent, recordFailure } = await import('../src/worker-service')
  const event = (
    await pool.query("SELECT id FROM outbox WHERE topic='job' AND payload->>'id'=$1", [
      sent.json.data.id,
    ])
  ).rows[0]
  await processEvent(event.id)
  await processEvent(event.id)
  assert.equal(
    (await request(base + '/tasks/' + sent.json.data.id, 'GET', undefined, owner)).json.data.status,
    'done',
  )
  assert.equal(
    (
      await pool.query('SELECT count(*)::int total FROM deliveries WHERE job_id=$1', [
        sent.json.data.id,
      ])
    ).rows[0].total,
    1,
  )
  const task = (await request(base + '/precheck/deep', 'POST', { document: valid }, owner)).json
    .data.taskId
  const taskEvent = (
    await pool.query("SELECT id FROM outbox WHERE topic='job' AND payload->>'id'=$1", [task])
  ).rows[0]
  for (let attempt = 0; attempt < 7; attempt++) await recordFailure(taskEvent.id)
  assert.equal(
    (await pool.query('SELECT attempts FROM outbox WHERE id=$1', [taskEvent.id])).rows[0].attempts,
    5,
  )
  assert.equal(
    (await request(base + '/tasks/' + task, 'GET', undefined, owner)).json.data.status,
    'failed',
  )
  assert.equal(
    (
      await request(
        base + '/team/invite',
        'POST',
        { email: 'other@example.com', role: 'editor' },
        owner,
      )
    ).response.status,
    200,
  )
  const invitation = (
    await pool.query('SELECT id FROM invitation WHERE email=$1', ['other@example.com'])
  ).rows[0]
  assert.equal(
    (await request('/api/v1/invitations/' + invitation.id + '/accept', 'POST', {}, stranger))
      .response.status,
    200,
  )
  assert.equal(
    (await request(base + '/templates', 'GET', undefined, stranger)).response.status,
    200,
  )
  const sharp = (await import('sharp')).default
  const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#663399' } })
    .png()
    .toBuffer()
  const form = new FormData()
  form.set('file', new File([png], 'test.png', { type: 'image/png' }))
  const uploaded = await app.request('http://localhost:3000' + base + '/materials', {
    method: 'POST',
    headers: { cookie: owner, origin: 'http://localhost:3000' },
    body: form,
  })
  assert.equal(uploaded.status, 201, await uploaded.clone().text())
  const material = ((await uploaded.json()) as any).data
  assert.equal(material.width, 10)
  const publicFile = await app.request('http://localhost:3000' + material.url)
  assert.equal(publicFile.status, 401)
  const range = await app.request('http://localhost:3000' + material.url, {
    headers: { cookie: owner, range: 'bytes=0-7' },
  })
  assert.equal(range.status, 206)
  assert.equal((await range.arrayBuffer()).byteLength, 8)
  const malicious = new FormData()
  malicious.set('file', new File(['<script>alert(1)</script>'], 'fake.png', { type: 'image/png' }))
  assert.equal(
    (
      await app.request('http://localhost:3000' + base + '/materials', {
        method: 'POST',
        headers: { cookie: owner, origin: 'http://localhost:3000' },
        body: malicious,
      })
    ).status,
    400,
  )

  const fallbackDoc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '替代链接审核' })
  for (const element of fallbackDoc.pages[0]!.elements) {
    if (element.type === 'image') element.props.src = material.url
    if (element.type === 'text')
      element.props.text = element.slot === 'title' ? '预约确认' : '请查看预约信息'
    if (element.type === 'button')
      element.event = { action: 'COPY_PARAMETER', content: '预约编号', copyType: 'fixed' }
  }
  const fallbackButton = fallbackDoc.pages[0]!.elements.find((e) => e.type === 'button')!
  await request(base + '/templates', 'POST', fallbackDoc, owner)
  assert.equal(
    (
      await request(
        base + '/templates/' + fallbackDoc.id + '/submit',
        'POST',
        { revision: 1 },
        owner,
      )
    ).response.status,
    422,
    '服务端必须拒绝缺失的替代链接',
  )
  const fallbackSubmitted = await request(
    base + '/templates/' + fallbackDoc.id + '/submit',
    'POST',
    {
      revision: 1,
      rcsFallbacks: Object.fromEntries(
        fallbackDoc.pages[0]!.elements.filter((el) => el.type === 'button').map((el, index) => [
          el.id,
          'https://example.com/booking' + index,
        ]),
      ),
    },
    owner,
  )
  assert.equal(fallbackSubmitted.response.status, 200, JSON.stringify(fallbackSubmitted.json))
  const fallbackVersion = (
    await pool.query('SELECT converted FROM template_versions WHERE template_id=$1', [
      fallbackDoc.id,
    ])
  ).rows[0]
  assert.ok(
    JSON.stringify(fallbackVersion.converted).includes('https://example.com/booking'),
    '补填链接必须写入版本协议',
  )
  const redpacket = createDocument({ layoutId: 'com.hbm.redpacket', name: '红包审核图片' })
  for (const element of redpacket.pages[0]!.elements) {
    if (element.type === 'text') element.props.text = '美好祝福'
    if (element.type === 'button')
      element.event = { action: 'OPEN_URL', target: 'https://example.com' }
  }
  await request(base + '/templates', 'POST', redpacket, owner)
  const redSubmit = await request(
    base + '/templates/' + redpacket.id + '/submit',
    'POST',
    { revision: 1 },
    owner,
  )
  assert.equal(redSubmit.response.status, 200, JSON.stringify(redSubmit.json))
  const captured = (
    await pool.query('SELECT converted FROM template_versions WHERE template_id=$1', [redpacket.id])
  ).rows[0].converted
  assert.equal(captured.needCapture, false)
  const capture = await app.request(
    'http://localhost:3000' + captured.rcsTplContent.content[0].media.mtalAddress,
    { headers: { cookie: owner } },
  )
  assert.equal(capture.status, 200)
  assert.equal(capture.headers.get('content-type'), 'image/png')
  assert.ok((await capture.arrayBuffer()).byteLength > 100)
  const badRange = await app.request('http://localhost:3000' + material.url, {
    headers: { cookie: owner, range: 'bytes=999999999-' },
  })
  assert.equal(badRange.status, 416)
  assert.ok(badRange.headers.get('content-range')?.startsWith('bytes */'))
  const record = (
    await pool.query('SELECT id FROM deliveries WHERE job_id=$1', [sent.json.data.id])
  ).rows[0]
  const historic = await request(
    base + '/experience/records/' + record.id + '/template',
    'GET',
    undefined,
    owner,
  )
  assert.equal(historic.json.data.document.name, '可发布通知', '历史预览绑定发送版本')
  const shareDoc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '素材分享' })
  const image = shareDoc.pages[0]!.elements.find((e) => e.type === 'image')!
  if (image.type === 'image') image.props.src = material.url
  await request(base + '/templates', 'POST', shareDoc, owner)
  const mediaShare = (await request(base + '/shares', 'POST', { templateId: shareDoc.id }, owner))
    .json.data
  assert.equal(
    (await request('/api/v1/public/shares/' + mediaShare.token + '/files/' + material.id)).response
      .status,
    200,
  )
  await pool.query("UPDATE shares SET expires_at=now()-interval '1 second' WHERE id=$1", [
    mediaShare.id,
  ])
  assert.equal(
    (await request('/api/v1/public/shares/' + mediaShare.token + '/files/' + material.id)).response
      .status,
    404,
  )
  const reset = await request('/api/auth/request-password-reset', 'POST', {
    email: 'owner@example.com',
    redirectTo: 'http://localhost:3000/zh-CN/reset-password',
  })
  assert.equal(reset.response.status, 200)
  const resetMail = (
    await pool.query(
      "SELECT payload FROM outbox WHERE topic='mail' AND payload->>'to'=$1 ORDER BY created_at DESC LIMIT 1",
      ['owner@example.com'],
    )
  ).rows[0]
  const resetURL = new URL(resetMail.payload.text.match(/http:\/\/localhost:3000\S+/)[0])
  const resetPage = await app.request(resetURL.toString())
  const target = resetPage.headers.get('location')
  assert.ok(target)
  const resetToken = new URL(target).searchParams.get('token')
  assert.ok(resetToken)
  assert.equal(
    (
      await request('/api/auth/reset-password', 'POST', {
        token: resetToken,
        newPassword: 'Changed-password-2026!',
      })
    ).response.status,
    200,
  )
  assert.equal(
    (await request('/api/v1/me', 'GET', undefined, owner)).response.status,
    401,
    '重置密码撤销会话',
  )

  console.log(
    '通过：审核驳回与发布、发布版本隔离、发送幂等、任务重试上限、邀请接受、真实素材解析与范围请求、重置密码撤销会话；真实 PostgreSQL 17 迁移、注册验证与登录、工作空间初始化幂等、租户隔离、权限撤销、版本冲突、审核状态防伪、分享撤销、最后所有者与来源校验。',
  )
} finally {
  await pool.end()
  await postgres.stop()
}
