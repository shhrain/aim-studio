'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface PullRefreshProps {
  onRefresh: () => Promise<unknown>
  /** 触发刷新的下拉距离（px） */
  threshold?: number
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

type Status = 'idle' | 'pulling' | 'ready' | 'refreshing'

const TEXT: Record<Status, string> = {
  idle: '',
  pulling: '下拉刷新',
  ready: '释放立即刷新',
  refreshing: '正在刷新…',
}

/** 下拉刷新：仅在页面滚动到顶部时响应手势 */
export function PullRefresh({ onRefresh, threshold = 64, disabled, className, children }: PullRefreshProps) {
  const [offset, setOffset] = React.useState(0)
  const [status, setStatus] = React.useState<Status>('idle')
  const startY = React.useRef<number | null>(null)

  const atTop = () => (typeof window === 'undefined' ? true : window.scrollY <= 0)

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={(e) => {
        if (disabled || status === 'refreshing' || !atTop()) return
        startY.current = e.touches[0]?.clientY ?? null
      }}
      onTouchMove={(e) => {
        if (startY.current == null) return
        const delta = (e.touches[0]?.clientY ?? 0) - startY.current
        if (delta <= 0) return
        const damped = Math.min(delta * 0.5, threshold * 1.6)
        setOffset(damped)
        setStatus(damped >= threshold ? 'ready' : 'pulling')
      }}
      onTouchEnd={async () => {
        if (startY.current == null) return
        startY.current = null
        if (status === 'ready') {
          setStatus('refreshing')
          setOffset(threshold * 0.75)
          try {
            await onRefresh()
          } finally {
            setStatus('idle')
            setOffset(0)
          }
        } else {
          setStatus('idle')
          setOffset(0)
        }
      }}
    >
      <div
        aria-live="polite"
        className="absolute inset-x-0 top-0 flex items-center justify-center text-xs text-muted-foreground"
        style={{ height: offset, opacity: offset ? 1 : 0 }}
      >
        {status === 'refreshing' && (
          <span className="mr-2 size-3.5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        )}
        {TEXT[status]}
      </div>
      <div
        style={{
          transform: offset ? `translateY(${offset}px)` : undefined,
          transition: startY.current == null ? 'transform .25s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
