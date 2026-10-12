import * as React from 'react'
import { cn } from '../lib/utils'

export interface FieldProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  label?: React.ReactNode
  /** 必填星号 */
  required?: boolean
  /** 标签右侧的辅助内容（如：帮助图标、计数） */
  extra?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  htmlFor?: string
  orientation?: 'vertical' | 'horizontal'
}

/** 表单字段容器：统一 标签 / 描述 / 错误 的排版 */
export function Field({
  label,
  required,
  extra,
  description,
  error,
  htmlFor,
  orientation = 'vertical',
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div
      data-slot="field"
      data-invalid={error ? true : undefined}
      className={cn(
        orientation === 'vertical' ? 'flex flex-col gap-1.5' : 'grid grid-cols-[96px_1fr] items-center gap-3',
        className,
      )}
      {...props}
    >
      {(label || extra) && (
        <div className="flex min-h-5 items-center justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground/90">
              {required && <span className="mr-0.5 text-destructive">*</span>}
              {label}
            </label>
          )}
          {extra && <div className="text-xs text-muted-foreground">{extra}</div>}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1.5">
        {children}
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  )
}

/** 字段分组：带标题的属性面板区块 */
export function FieldGroup({
  title,
  extra,
  className,
  children,
}: {
  title?: React.ReactNode
  extra?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('flex flex-col gap-3.5', className)}>
      {(title || extra) && (
        <header className="flex items-center justify-between">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</h4>
          {extra}
        </header>
      )}
      {children}
    </section>
  )
}
