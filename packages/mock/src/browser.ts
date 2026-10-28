import { getResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { resetDb } from './db'
import { handlers } from './index'
import { getControl, setControl } from './utils'

let started: Promise<unknown> | null = null

export type MockMode = 'service-worker' | 'fetch'

/** Service Worker 仅在安全上下文（HTTPS / localhost）可用 */
export function supportsServiceWorker(): boolean {
  return (
    typeof window !== 'undefined' && window.isSecureContext === true && 'serviceWorker' in navigator
  )
}

/**
 * 页面内 fetch 拦截：在 HTTP + 局域网 IP 等非安全上下文下替代 Service Worker，
 * 命中 handlers 的请求在页面内直接响应，其余请求透传。
 */
function patchFetch() {
  const original = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    const mocked = await getResponse(handlers, request.clone(), { baseUrl: location.href })
    return mocked ?? original(request)
  }
}

/**
 * 启动浏览器端 Mock。
 * - 安全上下文：Service Worker（需先执行 `msw init public` 生成 mockServiceWorker.js）；
 * - 非安全上下文（如 Docker 部署后通过 http://内网IP 访问）：自动降级为页面内 fetch 拦截。
 */
export function startMockWorker(
  options: { serviceWorkerUrl?: string; quiet?: boolean } = {},
): Promise<MockMode | undefined> {
  if (typeof window === 'undefined') return Promise.resolve(undefined)
  started ??= supportsServiceWorker()
    ? setupWorker(...handlers)
        .start({
          serviceWorker: { url: options.serviceWorkerUrl ?? '/mockServiceWorker.js' },
          onUnhandledRequest: 'bypass',
          quiet: options.quiet ?? true,
        })
        .then(() => 'service-worker' as const)
    : Promise.resolve().then(() => {
        patchFetch()
        if (!options.quiet) console.info('[aim-mock] 非安全上下文，已切换为页面内 fetch 拦截')
        return 'fetch' as const
      })
  // 调试入口：window.__aimMock.set({ latency: 1500 })、failNext('/send/experience', 1003)、reset()
  ;(window as unknown as { __aimMock: unknown }).__aimMock = {
    get: getControl,
    set: setControl,
    failNext: (path: string, subCode: number) => setControl({ failNext: { path, subCode } }),
    reset: () => resetDb().then(() => location.reload()),
  }
  return started as Promise<MockMode | undefined>
}
