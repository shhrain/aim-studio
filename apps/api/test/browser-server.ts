import { randomBytes } from 'node:crypto'
import { writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { serve } from '@hono/node-server'
import { createDocument } from '@aim/template-core'
import { startDatabase } from './database'

// 仅测试入口：独立真实数据库与随机凭据，绝不作为产品演示账号。
const postgres = await startDatabase(55433)
process.env.DATABASE_URL = postgres.url
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString('hex')
process.env.PUBLIC_URL = 'http://localhost:3000'
process.env.PROVIDER_MODE = 'simulated'
process.env.NODE_ENV = 'test'
const { pool, db } = await import('../src/context')
await migrate(db, {
  migrationsFolder: fileURLToPath(new URL('../../../packages/db/migrations', import.meta.url)),
})
const { app } = await import('../src/app')
const email = `browser-${Date.now()}@example.com`,
  password = randomBytes(24).toString('hex')
const call = (path: string, body: unknown, cookie = '') =>
  app.request('http://localhost:3000' + path, {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  })
await call('/api/auth/sign-up/email', { name: '林小满', email, password })
const mail = (
  await pool.query("SELECT payload FROM outbox WHERE topic='mail' AND payload->>'to'=$1", [email])
).rows[0]
await app.request(mail.payload.text.match(/http:\/\/localhost:3000\S+/)[0])
const login = await call('/api/auth/sign-in/email', { email, password })
const cookie = login.headers
  .getSetCookie()
  .map((v) => v.split(';')[0])
  .join('; ')
const workspace = (await (
  await call('/api/v1/workspaces', { name: '星河创意工作室' }, cookie)
).json()) as { data: { id: string } }
const document = createDocument({ layoutId: 'com.hbm.pureText', name: '秋日会员活动通知' })
for (const element of document.pages[0]!.elements)
  if (element.event?.action === 'OPEN_URL') element.event.target = 'https://example.com'
await call(`/api/v1/workspaces/${workspace.data.id}/templates`, document, cookie)
await call(
  `/api/v1/workspaces/${workspace.data.id}/templates/${document.id}/submit`,
  { revision: 1 },
  cookie,
)
const reviews = (await (
  await app.request(`http://localhost:3000/api/v1/workspaces/${workspace.data.id}/reviews`, {
    headers: { cookie },
  })
).json()) as { data: { id: string; version_id: string }[] }
await call(
  `/api/v1/workspaces/${workspace.data.id}/reviews/${reviews.data[0]!.id}/decision`,
  { decision: 'approved' },
  cookie,
)
await call(
  `/api/v1/workspaces/${workspace.data.id}/templates/${document.id}/publish`,
  { versionId: reviews.data[0]!.version_id },
  cookie,
)
await writeFile(
  fileURLToPath(new URL('../../../.cache/browser-session.json', import.meta.url)),
  JSON.stringify({ cookie, email, password, workspace: workspace.data.id, template: document.id }),
)
const server = serve({ fetch: app.fetch, port: 4000 })
console.log(
  '浏览器回归服务已就绪：http://localhost:4000；测试凭据仅写入 .cache/browser-session.json',
)
let stopping = false
const stop = async () => {
  if (stopping) return
  stopping = true
  clearInterval(timer)
  server.close()
  await pool.end()
  await postgres.stop()
  process.exit(0)
}
const timer = setInterval(() => {
  void access(fileURLToPath(new URL('../../../.cache/stop-platform-fixture', import.meta.url)))
    .then(stop)
    .catch(() => undefined)
}, 1000)
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
setTimeout(() => void stop(), 60 * 60 * 1000).unref()
