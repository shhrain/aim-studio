import { CheckIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'

export interface StepsProps {
  current: number
  items: readonly { title: React.ReactNode; description?: React.ReactNode }[]
  onStepClick?: (index: number) => void
  className?: string
}

/** 横向步骤条（编辑器：选择模板 → 编辑模板 → 提交审核） */
export function Steps({ current, items, onStepClick, className }: StepsProps) {
  return (
    <ol className={cn('flex items-center gap-2', className)}>
      {items.map((item, index) => {
        const status = index < current ? 'done' : index === current ? 'active' : 'todo'
        const clickable = onStepClick && index <= current
        return (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span
                className={cn(
                  'bg-border h-px w-10 transition-colors',
                  index <= current && 'bg-primary/60',
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(index)}
              aria-current={status === 'active' ? 'step' : undefined}
              className={cn(
                'group flex items-center gap-2 text-sm whitespace-nowrap',
                clickable && 'cursor-pointer',
              )}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border text-xs font-medium transition',
                  status === 'done' && 'border-primary bg-primary/10 text-primary',
                  status === 'active' && 'border-primary bg-primary text-primary-foreground',
                  status === 'todo' && 'text-muted-foreground',
                )}
              >
                {status === 'done' ? <CheckIcon className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  status === 'todo' ? 'text-muted-foreground' : 'text-foreground font-medium',
                  clickable && 'group-hover:text-primary',
                )}
              >
                {item.title}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
