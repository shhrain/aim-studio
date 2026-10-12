import * as React from 'react'
import { cn } from '../lib/utils'

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'bg-muted text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-sm border px-1 font-mono text-[11px] font-medium',
        className,
      )}
      {...props}
    />
  )
}
