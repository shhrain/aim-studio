import * as React from 'react'
import { cn } from '../lib/utils'

export function Spinner({ className, label, ...props }: React.ComponentProps<'span'> & { label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)} {...props}>
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
      {label && <span>{label}</span>}
    </span>
  )
}
