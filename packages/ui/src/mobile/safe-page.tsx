import * as React from 'react'
import { cn } from '../lib/utils'

/** 移动端页面容器：最小 100dvh、限制最大宽度、可选底部固定操作区 */
export function SafePage({
  className,
  footer,
  children,
  ...props
}: React.ComponentProps<'main'> & { footer?: React.ReactNode }) {
  return (
    <main className={cn('mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col', className)} {...props}>
      <div className="flex-1">{children}</div>
      {footer && (
        <>
          <div aria-hidden className="h-[calc(68px+env(safe-area-inset-bottom))]" />
          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-screen-sm border-t bg-card/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur">
            {footer}
          </div>
        </>
      )}
    </main>
  )
}
