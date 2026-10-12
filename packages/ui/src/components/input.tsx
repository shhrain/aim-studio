import * as React from 'react'
import { cn } from '../lib/utils'

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'prefix'> {
  /** 显示字数计数，需同时设置 maxLength */
  showCount?: boolean
  /** 前缀 / 后缀插槽 */
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const inputBase =
  'flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 file:border-0 file:bg-transparent file:text-sm file:font-medium'

export function Input({ className, showCount, prefix, suffix, maxLength, value, ...props }: InputProps) {
  const count = typeof value === 'string' ? [...value].length : 0
  if (!showCount && !prefix && !suffix) {
    return (
      <input
        data-slot="input"
        className={cn(inputBase, className)}
        maxLength={maxLength}
        value={value}
        {...props}
      />
    )
  }
  return (
    <div
      data-slot="input-group"
      className={cn(
        inputBase,
        'items-center gap-2 px-2.5 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring',
        className,
      )}
    >
      {prefix && <span className="flex shrink-0 text-muted-foreground">{prefix}</span>}
      <input
        data-slot="input"
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {suffix && <span className="flex shrink-0 text-muted-foreground">{suffix}</span>}
      {showCount && maxLength != null && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {count}/{maxLength}
        </span>
      )}
    </div>
  )
}
