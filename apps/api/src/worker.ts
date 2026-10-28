import { PgBoss } from 'pg-boss'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { config, pool } from './context'
import { processEvent, recordFailure } from './worker-service'
const boss = new PgBoss(config.DATABASE_URL)
boss.on('error', (e) => console.error(JSON.stringify({ workerError: e.name })))
await boss.start()
await boss.createQueue('outbox', { retryLimit: 0 })
await boss.work<{ id: string }>('outbox', async (entries) => {
  for (const entry of entries) {
    try {
      await processEvent(entry.data.id)
    } catch {
      await recordFailure(entry.data.id)
    }
  }
})
let polling = false
const tick = async () => {
  if (polling) return
  polling = true
  try {
    const rows = (
      await pool.query(
        'SELECT id FROM outbox WHERE delivered_at IS NULL AND failed_at IS NULL AND available_at<=now() ORDER BY created_at LIMIT 100',
      )
    ).rows
    for (const row of rows)
      await boss.send(
        'outbox',
        { id: row.id },
        { singletonKey: row.id, singletonSeconds: 60, retryLimit: 0 },
      )
    await pool.query('DELETE FROM rate_limits WHERE expires_at<now()')
    await writeFile(join(tmpdir(), 'aim-worker-heartbeat'), String(Date.now()))
  } catch (e) {
    console.error(JSON.stringify({ pollError: (e as Error).name }))
  } finally {
    polling = false
  }
}
await tick()
const timer = setInterval(() => void tick(), 5000)
const stop = async () => {
  clearInterval(timer)
  await boss.stop()
  await pool.end()
  process.exit(0)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
console.log('AIM 后台任务进程已启动')
