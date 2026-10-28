'use client'
import { ThemeProvider } from 'next-themes'

import { createQueryClient } from '@aim/api-client/react'
import { Spinner, Toaster, TooltipProvider } from '@aim/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { env } from '@/lib/api'

/** Mock 模式下等待 Service Worker 就绪后再渲染，避免首屏请求漏拦截 */
function MockGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!env.mock)
  useEffect(() => {
    if (!env.mock) return
    let alive = true
    void import('@aim/mock/browser')
      .then((m) => m.startMockWorker())
      .catch((err) => console.error('[mock] 启动失败', err))
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  if (!ready)
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner label="正在初始化本地数据…" />
      </div>
    )
  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient)
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem enableColorScheme>
      <QueryClientProvider client={client}>
        <TooltipProvider delayDuration={300}>
          <MockGate>{children}</MockGate>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
