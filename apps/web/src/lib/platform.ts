'use client'
import { createHttpClient } from '@aim/api-client'
import { createAuthClient } from '@aim/api-client/auth'
export const platform = createHttpClient()
export const authentication = createAuthClient()
/** 为选择器收集服务端分页数据；业务列表仍按页展示。 */
export async function loadAllPages<T>(path: string) {
  const rows: T[] = []
  for (let page = 1; ; page++) {
    const response = await platform.get<{ data: T[]; pageInfo: { total: number } }>(path, {
      query: { page, size: 100 },
      raw: true,
    })
    rows.push(...response.data)
    if (!response.data.length || rows.length >= response.pageInfo.total) return rows
  }
}
/** 当前 URL 中的工作空间是请求作用域，不使用全局可变工作空间。 */
export function workspacePath() {
  const match = typeof window === 'undefined' ? null : location.pathname.match(/\/app\/w\/([^/]+)/)
  if (!match) throw new Error('请先选择工作空间')
  return `/api/v1/workspaces/${encodeURIComponent(match[1]!)}`
}
export function appPath(section = '') {
  if (typeof window === 'undefined') return '/zh-CN/app'
  const match = location.pathname.match(/^(\/(?:zh-CN|en)\/app\/w\/[^/]+)/)
  return match ? `${match[1]}${section ? '/' + section : ''}` : '/zh-CN/app'
}
