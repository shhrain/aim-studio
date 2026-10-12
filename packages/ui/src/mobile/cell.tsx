import { ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'

export function CellGroup({
  title,
  inset = true,
  className,
  children,
}: {
  title?: React.ReactNode
  inset?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn(inset && 'mx-3', className)}>
      {title && <h3 className="px-1 pt-4 pb-2 text-xs text-muted-foreground">{title}</h3>}
      <div className={cn('divide-y overflow-hidden bg-card', inset && 'rounded-xl')}>{children}</div>
    </section>
  )
}

export interface CellProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title: React.ReactNode
  label?: React.ReactNode
  value?: React.ReactNode
  icon?: React.ReactNode
  arrow?: boolean
  onClick?: () => void
}

/** 列表单元格：标题 + 描述 + 右侧值 + 箭头 */
export function Cell({ title, label, value, icon, arrow, onClick, className, ...props }: CellProps) {
  const interactive = Boolean(onClick)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => interactive && (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      className={cn(
        'flex min-h-12 items-center gap-3 px-4 py-3 text-[15px]',
        interactive && 'cursor-pointer active:bg-muted',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-muted-foreground [&_svg]:size-5">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate">{title}</div>
        {label && <div className="mt-0.5 truncate text-xs text-muted-foreground">{label}</div>}
      </div>
      {value != null && <div className="shrink-0 text-sm text-muted-foreground">{value}</div>}
      {arrow && <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/70" />}
    </div>
  )
}
