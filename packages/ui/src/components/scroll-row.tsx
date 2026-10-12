'use client'

import { enableDragScroll } from '@aim/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'

export interface ScrollRowProps extends React.ComponentProps<'div'> {
  /** 外层容器类名（className 作用于滚动容器本身，用于 gap / padding） */
  wrapperClassName?: string
  /** 溢出时两端渐隐，默认 true */
  fade?: boolean
  /** 桌面端悬停时显示左右翻页按钮，默认 true */
  arrows?: boolean
}

const FADE = 24

/**
 * 横向滚动行（标签、筛选项、厂商切换等）。
 * 触屏原生滑动；桌面端支持滚轮横滑、鼠标拖拽与悬停翻页按钮，溢出一侧自动渐隐。
 */
export function ScrollRow({
  className,
  wrapperClassName,
  fade = true,
  arrows = true,
  children,
  style,
  ...props
}: ScrollRowProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [edge, setEdge] = React.useState({ start: false, end: false })

  const update = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdge((prev) => {
      const next = { start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 }
      return prev.start === next.start && prev.end === next.end ? prev : next
    })
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const cleanup = enableDragScroll(el)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener('scroll', update, { passive: true })
    return () => {
      cleanup()
      ro.disconnect()
      el.removeEventListener('scroll', update)
    }
  }, [update])
  // 子项变化（异步加载的筛选项等）后重新计算
  React.useEffect(update)

  const page = (dir: number) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })

  const mask =
    fade && (edge.start || edge.end)
      ? `linear-gradient(to right, ${edge.start ? 'transparent' : 'black'} 0, black ${FADE}px, black calc(100% - ${FADE}px), ${edge.end ? 'transparent' : 'black'} 100%)`
      : undefined

  return (
    <div data-slot="scroll-row" className={cn('group/scroll relative min-w-0', wrapperClassName)}>
      <div
        ref={ref}
        className={cn(
          'scrollbar-none flex overflow-x-auto overscroll-x-contain data-[dragging]:cursor-grabbing data-[dragging]:select-none data-[dragging]:*:pointer-events-none',
          className,
        )}
        {...props}
        style={{ maskImage: mask, WebkitMaskImage: mask, ...style }}
      >
        {children}
      </div>
      {arrows &&
        (['start', 'end'] as const).map((side) =>
          edge[side] ? (
            <button
              key={side}
              type="button"
              tabIndex={-1}
              aria-label={side === 'start' ? '向左滚动' : '向右滚动'}
              onClick={() => page(side === 'start' ? -1 : 1)}
              className={cn(
                'bg-background/95 text-foreground shadow-panel absolute top-1/2 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 transition group-hover/scroll:opacity-100 pointer-fine:flex',
                side === 'start' ? 'left-1' : 'right-1',
              )}
            >
              {side === 'start' ? (
                <ChevronLeftIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </button>
          ) : null,
        )}
    </div>
  )
}
