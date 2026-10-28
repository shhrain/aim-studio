import { pageSchema } from '@aim/api-contracts'
import { pool } from './context'

/** 所有列表共享服务端分页；租户条件必须由调用方先绑定，不能来自查询参数。 */
export async function readPage(
  sql: string,
  values: unknown[],
  input: Record<string, string>,
  map: (row: Record<string, any>) => unknown = (row) => row,
) {
  const { page, size } = pageSchema.parse(input)
  const [count, rows] = await Promise.all([
    pool.query('SELECT count(*)::int AS total FROM (' + sql + ') scoped', values),
    pool.query(sql + ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [
      ...values,
      size,
      (page - 1) * size,
    ]),
  ])
  return {
    subCode: 0,
    message: 'OK',
    data: rows.rows.map(map),
    pageInfo: { page, size, total: count.rows[0].total },
  }
}
