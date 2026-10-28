import { serve } from '@hono/node-server'
import { app } from './app'
import { config, pool } from './context'
const server = serve({ fetch: app.fetch, port: config.PORT, hostname: '0.0.0.0' })
const stop = () => {
  server.close(() => {
    void pool.end().then(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10000).unref()
}
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
console.log(`AIM API 已启动，端口 ${config.PORT}`)
