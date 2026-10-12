import { describe, expect, it, vi } from 'vitest'
import { ApiError, createHttpClient } from './http'

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

describe('createHttpClient', () => {
  it('携带 AuthorizationCode 并返回 data', async () => {
    const fetch = vi.fn(async () => jsonResponse({ subCode: 0, message: 'ok', data: { a: 1 } }))
    const http = createHttpClient({ fetch, getToken: () => 'tk' })
    await expect(http.post('/x', { b: 2 })).resolves.toEqual({ a: 1 })
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).AuthorizationCode).toBe('tk')
  })

  it('subCode 9001 触发 onUnauthorized', async () => {
    const onUnauthorized = vi.fn()
    const onError = vi.fn()
    const http = createHttpClient({
      fetch: async () => jsonResponse({ subCode: 9001, message: '登录失效', data: null }),
      onUnauthorized,
      onError,
    })
    await expect(http.get('/x')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('业务错误触发 onError，silent 不触发', async () => {
    const onError = vi.fn()
    const http = createHttpClient({
      fetch: async () => jsonResponse({ subCode: 1003, message: '', data: null }),
      onError,
    })
    await expect(http.get('/x')).rejects.toMatchObject({
      subCode: 1003,
      message: '操作过于频繁，请稍后再试',
    })
    await expect(http.get('/x', { silent: true })).rejects.toBeTruthy()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('query 拼接忽略空值', () => {
    const http = createHttpClient({ baseUrl: 'https://a.com' })
    expect(http.url('/p', { a: 1, b: '', c: undefined, d: 'x' })).toBe('https://a.com/p?a=1&d=x')
  })
})
