import { randomBytes } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import path from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'
/** 隔离的真实 PostgreSQL 17；Windows 使用官方 pg_ctl 降低进程权限。 */
export async function startDatabase(port = 55432) {
  const password = randomBytes(24).toString('hex')
  const directory = fileURLToPath(
    new URL(`../../../.cache/platform-db-${Date.now()}`, import.meta.url),
  )
  const pg = new EmbeddedPostgres({
    databaseDir: directory,
    user: 'aimtest',
    password,
    port,
    persistent: true,
    initdbFlags: ['--no-sync', '--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: (e) => console.error(e),
  })
  await pg.initialise()
  let stop: () => Promise<void>
  if (process.platform === 'win32') {
    const require = createRequire(import.meta.url)
    const binaryRequire = createRequire(require.resolve('embedded-postgres'))
    const binary = await import(
      pathToFileURL(binaryRequire.resolve('@embedded-postgres/windows-x64')).href
    )
    const run = (args: string[]) =>
      new Promise<void>((resolve, reject) => {
        const child = spawn(binary.pg_ctl, args, { windowsHide: true, stdio: 'ignore' })
        child.on('error', reject)
        child.on('exit', (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`pg_ctl 执行失败：${code}；请检查 ${directory}/server.log`)),
        )
      })
    await run([
      '-D',
      directory,
      '-l',
      path.join(directory, 'server.log'),
      '-o',
      `-p ${port} -h 127.0.0.1`,
      '-w',
      'start',
    ])
    stop = () => run(['-D', directory, '-m', 'fast', '-w', 'stop'])
  } else {
    await pg.start()
    stop = () => pg.stop()
  }
  const client = pg.getPgClient('postgres', '127.0.0.1')
  await client.connect()
  await client.query('CREATE DATABASE aimtest')
  await client.end()
  return { url: `postgresql://aimtest:${password}@127.0.0.1:${port}/aimtest`, stop }
}
