import { cva, type VariantProps } from 'class-variance-authority'
import { Slot as SlotPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '../lib/utils'

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
          'border bg-card shadow-xs hover:border-primary/40 hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        soft: 'bg-accent text-accent-foreground hover:bg-accent/80',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 gap-1 rounded-md px-3 text-[13px]',
        xs: 'h-7 gap-1 rounded-sm px-2 text-xs',
        lg: 'h-10 rounded-md px-6',
        xl: 'h-12 rounded-lg px-8 text-base',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': 'size-7 rounded-sm',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  /** 以子元素作为渲染节点（如 Next.js Link） */
  asChild?: boolean
  /** 加载中：禁用并显示转圈 */
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          )}
          {children}
        </>
      )}
    </Comp>
  )
}
