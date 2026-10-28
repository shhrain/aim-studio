import { createDatabase, type PoolClient } from '@aim/db'
import { randomUUID } from 'node:crypto'
import { loadConfig } from './config'
export const config = loadConfig()
export const { pool, db } = createDatabase(config.DATABASE_URL)
export const id = () => randomUUID()
/** 所有有状态变更均使用事务。 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
export async function record(
  client: PoolClient,
  workspace: string,
  user: string,
  action: string,
  target?: string,
) {
  await client.query(
    'INSERT INTO audit_logs(id,workspace_id,user_id,action,target_id) VALUES($1,$2,$3,$4,$5)',
    [id(), workspace, user, action, target],
  )
}
export class BusinessError extends Error {
  constructor(
    public status: number,
    public code: number,
    message: string,
  ) {
    super(message)
  }
}
export function assert(
  value: unknown,
  status = 404,
  code = 2001,
  message = '资源不存在或无权访问',
): asserts value {
  if (!value) throw new BusinessError(status, code, message)
}
