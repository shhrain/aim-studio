import * as React from 'react'
import { cn } from '../lib/utils'

export function Spinner({
  className,
  label,
  ...props
}: React.ComponentProps<'span'> & { label?: string }) {
  return (
    <span
      role="status"
      className={cn('text-muted-foreground inline-flex items-center gap-2 text-sm', className)}
      {...props}
    >
      <span className="border-primary size-4 animate-spin rounded-full border-2 border-r-transparent" />
      {label && <span>{label}</span>}
    </span>
  )
}
