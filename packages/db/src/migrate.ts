import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDatabase } from './index'
if (!process.env.DATABASE_URL) throw new Error('请配置 DATABASE_URL')
const { db, pool } = createDatabase(process.env.DATABASE_URL)
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../migrations', import.meta.url)) })
  console.log('数据库迁移完成')
} finally {
  await pool.end()
}
