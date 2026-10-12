'use client'

import * as React from 'react'
import { Drawer } from 'vaul'
import { cn } from '../lib/utils'

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

/** 底部抽屉（支持手势下拉关闭），用于移动端表单、选择器、发送流程 */
export function BottomSheet({ open, onOpenChange, title, description, footer, className, children }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-screen-sm flex-col rounded-t-2xl bg-card outline-none',
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
          {(title || description) && (
            <div className="px-4 pt-3 pb-2 text-center">
              {title ? (
                <Drawer.Title className="text-base font-semibold">{title}</Drawer.Title>
              ) : (
                <Drawer.Title className="sr-only">面板</Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="mt-1 text-xs text-muted-foreground">{description}</Drawer.Description>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer && <div className="border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export interface ActionSheetAction {
  key: string
  label: React.ReactNode
  description?: React.ReactNode
  destructive?: boolean
  disabled?: boolean
}

/** 动作面板：一组互斥操作 + 取消 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  actions,
  onSelect,
  cancelText = '取消',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  actions: readonly ActionSheetAction[]
  onSelect: (key: string) => void
  cancelText?: string
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-screen-sm overflow-hidden rounded-t-2xl bg-muted outline-none">
          <Drawer.Title className={title ? 'bg-card px-4 py-3 text-center text-xs text-muted-foreground' : 'sr-only'}>
            {title ?? '操作'}
          </Drawer.Title>
          <div className="divide-y bg-card">
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                disabled={a.disabled}
                onClick={() => {
                  onSelect(a.key)
                  onOpenChange(false)
                }}
                className={cn(
                  'flex w-full flex-col items-center justify-center py-3.5 text-base active:bg-muted disabled:opacity-40',
                  a.destructive && 'text-destructive',
                )}
              >
                {a.label}
                {a.description && <span className="mt-0.5 text-xs text-muted-foreground">{a.description}</span>}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-2 w-full bg-card py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] text-base active:bg-muted"
          >
            {cancelText}
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
