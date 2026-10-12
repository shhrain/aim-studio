'use client'

import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '../lib/utils'

export function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('inline-flex flex-wrap items-center gap-1.5', className)}
      {...props}
    />
  )
}

export function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-card px-2.5 text-sm transition outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}
