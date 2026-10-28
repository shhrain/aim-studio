import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
export * from './schema'
export type { PoolClient } from 'pg'
/** 创建服务端连接池；调用方负责关闭。 */
export function createDatabase(url: string) {
  const pool = new Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30_000,
  })
  return { pool, db: drizzle(pool, { schema }) }
}
