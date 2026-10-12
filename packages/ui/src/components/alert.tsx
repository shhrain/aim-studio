import { cva, type VariantProps } from 'class-variance-authority'
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XCircleIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'

const alertVariants = cva('relative flex w-full gap-2.5 rounded-lg border px-3.5 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0', {
  variants: {
    variant: {
      info: 'border-info/25 bg-info/8 [&>svg]:text-info',
      success: 'border-success/25 bg-success/8 [&>svg]:text-success',
      warning: 'border-warning/40 bg-warning/10 [&>svg]:text-warning',
      destructive: 'border-destructive/25 bg-destructive/8 [&>svg]:text-destructive',
      neutral: 'bg-muted/60 [&>svg]:text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
})

const icons = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  destructive: XCircleIcon,
  neutral: InfoIcon,
}

export interface AlertProps extends Omit<React.ComponentProps<'div'>, 'title'>, VariantProps<typeof alertVariants> {
  title?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode | false
}

export function Alert({ className, variant = 'info', title, action, icon, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'info']
  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon === false ? null : (icon ?? <Icon />)}
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}
