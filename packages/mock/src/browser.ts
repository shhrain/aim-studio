import { setupWorker } from 'msw/browser'
import { resetDb } from './db'
import { handlers } from './index'
import { getControl, setControl } from './utils'

let started: Promise<unknown> | null = null

/**
 * 启动浏览器端 Mock（Service Worker）。
 * 需先执行 `msw init public` 生成 mockServiceWorker.js。
 */
export function startMockWorker(options: { serviceWorkerUrl?: string; quiet?: boolean } = {}) {
  if (typeof window === 'undefined') return Promise.resolve()
  started ??= setupWorker(...handlers).start({
    serviceWorker: { url: options.serviceWorkerUrl ?? '/mockServiceWorker.js' },
    onUnhandledRequest: 'bypass',
    quiet: options.quiet ?? true,
  })
  // 调试入口：window.__aimMock.set({ latency: 1500 })、failNext('/send/experience', 1003)、reset()
  ;(window as unknown as { __aimMock: unknown }).__aimMock = {
    get: getControl,
    set: setControl,
    failNext: (path: string, subCode: number) => setControl({ failNext: { path, subCode } }),
    reset: () => resetDb().then(() => location.reload()),
  }
  return started
}
