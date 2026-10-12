'use client'

import { createQueryClient } from '@aim/api-client/react'
import { Spinner, Toaster } from '@aim/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { env } from '@/lib/api'
import { setupWechatShare } from '@/lib/wechat'

/** 无需 Mock 的路由（分享接口为本应用 Route Handler） */
const NO_MOCK = ['/preview', '/embed']

function MockGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const skip = !env.mock || NO_MOCK.some((p) => pathname.startsWith(p))
  const [ready, setReady] = useState(skip)
  useEffect(() => {
    if (skip) return
    let alive = true
    void import('@aim/mock/browser')
      .then((m) => m.startMockWorker())
      .catch((e) => console.error('[mock] 启动失败', e))
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [skip])
  if (!ready)
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="加载中…" />
      </div>
    )
  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient)
  useEffect(() => {
    void setupWechatShare({ title: '梦网5G阅信', desc: '一键体验富媒体短信：图文、视频、卡券、通知多种版式' })
  }, [])
  return (
    <QueryClientProvider client={client}>
      <MockGate>{children}</MockGate>
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
