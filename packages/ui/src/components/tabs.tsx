'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '../lib/utils'

export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props} />
}

export function TabsList({
  className,
  variant = 'pill',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: 'pill' | 'line' }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        'group/tabs inline-flex w-fit items-center text-muted-foreground',
        variant === 'pill' && 'h-9 rounded-lg bg-muted p-[3px]',
        variant === 'line' && 'h-10 gap-4 border-b',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=pill]/tabs:rounded-md group-data-[variant=pill]/tabs:data-[state=active]:bg-card group-data-[variant=pill]/tabs:data-[state=active]:text-foreground group-data-[variant=pill]/tabs:data-[state=active]:shadow-sm',
        'group-data-[variant=line]/tabs:-mb-px group-data-[variant=line]/tabs:border-b-2 group-data-[variant=line]/tabs:border-transparent group-data-[variant=line]/tabs:px-0.5 group-data-[variant=line]/tabs:data-[state=active]:border-primary group-data-[variant=line]/tabs:data-[state=active]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />
}
