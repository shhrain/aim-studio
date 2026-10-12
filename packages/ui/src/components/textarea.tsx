import * as React from 'react'
import { cn } from '../lib/utils'

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  showCount?: boolean
}

export function Textarea({ className, showCount, maxLength, value, ...props }: TextareaProps) {
  const count = typeof value === 'string' ? [...value].length : 0
  const el = (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        showCount && 'pb-6',
        className,
      )}
      maxLength={maxLength}
      value={value}
      {...props}
    />
  )
  if (!showCount || maxLength == null) return el
  return (
    <div className="relative">
      {el}
      <span className="pointer-events-none absolute right-2.5 bottom-1.5 text-xs text-muted-foreground tabular-nums">
        {count}/{maxLength}
      </span>
    </div>
  )
}
