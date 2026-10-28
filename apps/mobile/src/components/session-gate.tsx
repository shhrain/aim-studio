'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ApiError, createHttpClient } from '@aim/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { clearAuth } from '@/lib/auth'
const http = createHttpClient()
function webHref(path: string) {
  const locale =
    typeof document !== 'undefined' && document.cookie.includes('NEXT_LOCALE=en') ? 'en' : 'zh-CN'
  const origin = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
  return `${origin}/${locale}${path}`
}
/** 公开分享无需会话；业务页面使用明确的工作空间选择。 */
export function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const publicPage = ['/preview', '/embed', '/auth-required', '/ability-guide'].some((p) =>
    pathname.startsWith(p),
  )
  const [spaces, setSpaces] = useState<{ id: string; name: string; role: string }[]>([])
  const [selected, setSelected] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [mode, setMode] = useState('disabled')
  const qc = useQueryClient()
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setAttempt(a => a + 1) }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])
  useEffect(() => {
    if (publicPage) return
    let active = true
    setLoading(true)
    setError(null)
    void Promise.all([
      http.get<{ id: string; name: string; role: string }[]>('/api/v1/workspaces'),
      http.get<{ mode: string }>('/api/v1/capabilities'),
      http.get<{ id: string }>('/api/v1/me'),
    ])
      .then(([rows, caps, user]) => {
        if (!active) return
        if (sessionStorage.getItem('aim:user') !== user.id) { clearAuth(); qc.clear() }
        sessionStorage.setItem('aim:user', user.id)
        setSpaces(rows)
        setMode(caps.mode)
        const query = new URLSearchParams(location.search).get('workspace')
        const old = query ?? sessionStorage.getItem('aim:workspace')
        const id = rows.find((r) => r.id === old)?.id ?? rows[0]?.id ?? ''
        sessionStorage.setItem('aim:workspace', id)
        sessionStorage.setItem('aim:role', rows.find((r) => r.id === id)?.role ?? 'viewer')
        setSelected(id)
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError && error.isUnauthorized) {
          clearAuth()
          qc.clear()
          location.replace(
            webHref('/login?redirect=' + encodeURIComponent('/m' + pathname + location.search)),
          )
        }
        setError(error as Error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [publicPage, attempt, pathname, qc])
  if (publicPage) return children
  if (error)
    return (
      <main className="p-8 text-center">
        <p>
          {error instanceof ApiError && error.isUnauthorized
            ? '会话已失效，请重新登录。'
            : '暂时无法连接服务，请稍后重试。'}
        </p>
        <button className="m-3 underline" onClick={() => setAttempt((a) => a + 1)}>
          重试
        </button>
        <a
          href={webHref('/login?redirect=' + encodeURIComponent('/m' + pathname + location.search))}
        >
          前往登录
        </a>
      </main>
    )
  if (loading) return <main className="p-8 text-center">正在加载工作空间…</main>
  if (!selected)
    return (
      <main className="p-8 text-center">
        请先在主站创建工作空间。 <a href={webHref('/app')}>进入控制台</a>
      </main>
    )
  return (
    <>
      <div className="bg-card flex items-center justify-between gap-3 border-b px-4 py-2 text-xs">
        <select
          aria-label="切换工作空间"
          className="min-w-0 rounded border p-2"
          value={selected}
          onChange={(e) => {
            sessionStorage.setItem('aim:workspace', e.target.value)
            sessionStorage.setItem(
              'aim:role',
              spaces.find((s) => s.id === e.target.value)?.role ?? 'viewer',
            )
            sessionStorage.removeItem('aim:sendDraft')
            void qc.cancelQueries()
            qc.clear()
            const url = new URL(location.href)
            url.searchParams.set('workspace', e.target.value)
            history.replaceState(null, '', url)
            setSelected(e.target.value)
          }}
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <a href={webHref('/app')}>控制台 ↗</a>
      </div>
      <div className="bg-accent text-accent-foreground px-4 py-2 text-center text-xs">
        {mode === 'simulated'
          ? '模拟通道 · 能力与发送结果仅用于演示，不发送真实消息'
          : '外部发送与终端能力通道未配置'}
      </div>
      <div key={selected}>{children}</div>
    </>
  )
}
