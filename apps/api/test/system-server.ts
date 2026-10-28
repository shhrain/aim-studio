import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, open } from 'node:fs/promises'
import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { serve } from '@hono/node-server'
import { startDatabase } from './database'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const webPort = Number(process.env.QA_WEB_PORT ?? 3100),
  mobilePort = Number(process.env.QA_MOBILE_PORT ?? 3101),
  docsPort = Number(process.env.QA_DOCS_PORT ?? 3102),
  apiPort = Number(process.env.QA_API_PORT ?? 4100)
const url = 'http://localhost:' + webPort
await mkdir(root + '.cache', { recursive: true })
const postgres = await startDatabase(Number(process.env.QA_PG_PORT ?? 55434))
Object.assign(process.env, {
  DATABASE_URL: postgres.url,
  BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
  PUBLIC_URL: url,
  PORT: String(apiPort),
  PROVIDER_MODE: 'simulated',
  NODE_ENV: 'test',
  SMTP_HOST: process.env.QA_SMTP_HOST ?? '127.0.0.1',
  SMTP_PORT: process.env.QA_SMTP_PORT ?? '11026',
  STORAGE_PATH: root + '.cache/qa-files',
})
const { pool, db } = await import('../src/context')
await migrate(db, { migrationsFolder: root + 'packages/db/migrations' })
const production = process.env.QA_PRODUCTION === 'true'
const children: ChildProcess[] = []
let closing = false
let server: ReturnType<typeof serve> | undefined
const spawnNode = async (
  name: string,
  args: string[],
  cwd: string,
  extra: Record<string, string> = {},
) => {
  const file = await open(root + '.cache/qa-' + name + '.log', 'a')
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...extra },
    windowsHide: true,
    stdio: ['ignore', file.fd, file.fd],
  })
  children.push(child)
  child.on('exit', (code) => {
    if (!closing) {
      console.error(`${name} 进程意外退出：${code}；检查 .cache/qa-${name}.log`)
      void stop(1)
    }
  })
  child.on('error', (error) => {
    console.error(`${name} 启动失败：${error.name}`)
    void stop(1)
  })
  await file.close()
  return child
}
await spawnNode(
  'worker',
  production
    ? [root + 'apps/api/dist/worker.js']
    : ['--import', 'tsx', root + 'apps/api/src/worker.ts'],
  root + 'apps/api',
)
if (production) await spawnNode('api', [root + 'apps/api/dist/server.js'], root + 'apps/api')
else {
  const { app } = await import('../src/app')
  server = serve({ fetch: app.fetch, port: apiPort, hostname: '127.0.0.1' })
}
for (const [name, port] of [
  ['web', webPort],
  ['mobile', mobilePort],
  ['docs', docsPort],
] as const) {
  const cwd = root + 'apps/' + name,
    req = createRequire(cwd + '/package.json')
  await spawnNode(
    name,
    [req.resolve('next/dist/bin/next'), production ? 'start' : 'dev', '--port', String(port)],
    cwd,
    {
      NODE_ENV: production ? 'production' : 'development',
      NEXT_DIST_DIR: process.env.QA_DIST_DIR ?? '.next/qa',
      NEXT_PUBLIC_API_MOCK: 'false',
      NEXT_PUBLIC_API_BASE: '',
      NEXT_PUBLIC_WEB_URL: url,
      NEXT_PUBLIC_EDITOR_URL: url,
      NEXT_PUBLIC_MOBILE_URL: url + '/m',
      NEXT_PUBLIC_DOCS_URL: 'http://localhost:' + docsPort,
      API_INTERNAL_URL: 'http://127.0.0.1:' + apiPort,
      MOBILE_INTERNAL_URL: 'http://127.0.0.1:' + mobilePort,
    },
  )
}
await writeFile(
  root + '.cache/qa-environment.json',
  JSON.stringify({
    web: url,
    mobile: url + '/m',
    docs: 'http://localhost:' + docsPort,
    api: 'http://localhost:' + apiPort,
    mailpit: process.env.QA_MAILPIT_URL ?? 'http://127.0.0.1:18026',
  }),
)
async function stop(code = 0) {
  if (closing) return
  closing = true
  server?.close()
  for (const child of children) child.kill()
  await pool.end()
  await postgres.stop()
  process.exit(code)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
console.log('隔离回归环境已启动：' + url + '；日志位于 .cache/qa-*.log')
