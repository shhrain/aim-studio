import { InboxIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'

export interface EmptyProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  size?: 'sm' | 'default'
}

/** 空状态：说明原因 + 给出下一步操作 */
export function Empty({
  icon,
  title = '暂无数据',
  description,
  action,
  size = 'default',
  className,
  ...props
}: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        size === 'sm' ? 'py-6' : 'py-14',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'bg-muted text-muted-foreground flex items-center justify-center rounded-full',
          size === 'sm' ? 'size-10' : 'size-14',
        )}
      >
        {icon ?? <InboxIcon className={size === 'sm' ? 'size-5' : 'size-6'} />}
      </div>
      <h3 className="mt-1 text-sm font-medium">{title}</h3>
      {description && <div className="text-muted-foreground max-w-sm text-xs">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
