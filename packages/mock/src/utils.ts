import { SUB_CODE_MESSAGE, type PageInfo } from '@aim/api-client'
import { HttpResponse, delay } from 'msw'

export interface MockControl {
  /** 模拟网络延迟（毫秒） */
  latency: number
  /** 下一次匹配路径的请求返回指定 subCode */
  failNext?: { path: string; subCode: number }
}

const CONTROL_KEY = 'aim:mock:control'

export function getControl(): MockControl {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CONTROL_KEY)
      if (raw) return { latency: 300, ...(JSON.parse(raw) as Partial<MockControl>) }
    }
  } catch {
    /* ignore */
  }
  return { latency: typeof window === 'undefined' ? 0 : 300 }
}

/** 浏览器控制台可调用：window.__aimMock.set({ latency: 1500 }) / failNext('/send/experience', 1003) */
export function setControl(patch: Partial<MockControl>) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CONTROL_KEY, JSON.stringify({ ...getControl(), ...patch }))
}

export async function latency(path: string) {
  const c = getControl()
  if (c.latency) await delay(c.latency)
  if (c.failNext && path.includes(c.failNext.path)) {
    const subCode = c.failNext.subCode
    setControl({ failNext: undefined })
    return fail(subCode)
  }
  return null
}

export function ok<T>(data: T, pageInfo?: PageInfo) {
  return HttpResponse.json({ subCode: 0, message: 'success', data, ...(pageInfo ? { pageInfo } : {}) })
}

export function fail(subCode: number, message?: string) {
  return HttpResponse.json({ subCode, message: message ?? SUB_CODE_MESSAGE[subCode] ?? '请求失败', data: null })
}

/** 号码哈希：保证同一号码每次 Mock 结果一致 */
export function hashOf(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

export function paginate<T>(list: T[], pageNum: number, pageSize: number) {
  const size = Math.max(1, pageSize)
  const current = Math.max(1, pageNum)
  return {
    records: list.slice((current - 1) * size, current * size),
    total: list.length,
    current,
    size,
    pages: Math.max(1, Math.ceil(list.length / size)),
  }
}
