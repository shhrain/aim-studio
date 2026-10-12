'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface TabBarItem {
  key: string
  label: string
  icon: React.ReactNode
  badge?: number | boolean
}

export interface TabBarProps {
  items: readonly TabBarItem[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

/** 移动端底部标签栏，固定在底部并处理 Home Indicator 安全区 */
export function TabBar({ items, activeKey, onChange, className }: TabBarProps) {
  return (
    <nav
      data-slot="tab-bar"
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur',
        className,
      )}
    >
      <ul className="mx-auto flex h-14 max-w-screen-sm">
        {items.map((item) => {
          const active = item.key === activeKey
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex size-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="relative [&_svg]:size-5.5">
                  {item.icon}
                  {item.badge ? (
                    <span className="absolute -top-1 -right-2 min-w-4 rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">
                      {item.badge === true ? '' : item.badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** 占位：避免内容被固定底栏遮挡 */
export function TabBarSpacer() {
  return <div aria-hidden className="h-[calc(56px+env(safe-area-inset-bottom))]" />
}
