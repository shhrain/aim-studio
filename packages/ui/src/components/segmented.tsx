'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface SegmentedProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: readonly { value: T; label: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }[]
  size?: 'sm' | 'default'
  block?: boolean
  className?: string
  'aria-label'?: string
}

/** 分段控制器：用于 2~5 个互斥视图切换（如 服务类/通知类、商用/测试） */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = 'default',
  block,
  className,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-lg bg-muted p-[3px] text-muted-foreground',
        size === 'sm' ? 'h-8' : 'h-9',
        block && 'flex w-full',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onValueChange(o.value)}
            className={cn(
              'inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 font-medium whitespace-nowrap transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50',
              size === 'sm' ? 'text-xs' : 'text-sm',
              active ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
