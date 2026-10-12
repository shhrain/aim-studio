'use client'

import { ChevronLeftIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'

export interface NavBarProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  title: React.ReactNode
  /** 点击返回；不传则不显示返回按钮 */
  onBack?: () => void
  right?: React.ReactNode
  /** 品牌色背景（详情页蓝色顶栏） */
  tone?: 'default' | 'primary' | 'transparent'
  sticky?: boolean
}

/** 移动端顶部导航栏，自动适配刘海屏安全区 */
export function NavBar({
  title,
  onBack,
  right,
  tone = 'default',
  sticky = true,
  className,
  ...props
}: NavBarProps) {
  return (
    <header
      data-slot="nav-bar"
      className={cn(
        'z-30 pt-[env(safe-area-inset-top)]',
        sticky && 'sticky top-0',
        tone === 'default' && 'bg-card/95 border-b backdrop-blur',
        tone === 'primary' && 'bg-primary text-primary-foreground',
        tone === 'transparent' && 'bg-transparent',
        className,
      )}
      {...props}
    >
      <div className="relative flex h-11 items-center justify-center px-12">
        {onBack && (
          <button
            type="button"
            aria-label="返回"
            onClick={onBack}
            className="absolute left-1 flex size-10 items-center justify-center rounded-full active:bg-black/5"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
        )}
        <h1 className="truncate text-[17px] font-semibold">{title}</h1>
        {right && <div className="absolute right-2 flex items-center gap-1">{right}</div>}
      </div>
    </header>
  )
}
