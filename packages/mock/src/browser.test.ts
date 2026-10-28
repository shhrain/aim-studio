// @vitest-environment jsdom
import { EDITOR_PREFIX, EXPERIENCE_PREFIX } from '@aim/api-client'
import { describe, expect, it, vi } from 'vitest'
import { startMockWorker, supportsServiceWorker } from './browser'

describe('startMockWorker：非安全上下文降级为 fetch 拦截', () => {
  const real = vi.fn(async () => new Response('real'))

  it('无 Service Worker 时使用页面内 fetch 拦截', async () => {
    window.fetch = real as unknown as typeof fetch
    expect(supportsServiceWorker()).toBe(false)
    await expect(startMockWorker({ quiet: true })).resolves.toBe('fetch')
  })

  it('命中 handlers 的请求返回 Mock 数据（含请求体）', async () => {
    const list = await fetch(`${location.origin}${EDITOR_PREFIX}/templates?pageSize=3`)
    const body = (await list.json()) as { subCode: number; data: unknown[] }
    expect(body.subCode).toBe(0)
    expect(body.data.length).toBeGreaterThan(0)

    const login = await fetch(`${location.origin}${EXPERIENCE_PREFIX}/auth/mock-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '13800138000' }),
    })
    expect(((await login.json()) as { subCode: number }).subCode).toBe(0)
    expect(real).not.toHaveBeenCalled()
  })

  it('未命中的请求透传给原始 fetch', async () => {
    const res = await fetch('https://example.com/not-mocked')
    expect(await res.text()).toBe('real')
    expect(real).toHaveBeenCalledTimes(1)
  })
})
