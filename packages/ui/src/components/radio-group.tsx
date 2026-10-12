'use client'

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '../lib/utils'

export function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-2.5', className)}
      {...props}
    />
  )
}

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-input bg-card focus-visible:ring-ring data-[state=checked]:border-primary aspect-square size-4 shrink-0 rounded-full border shadow-xs transition outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="bg-primary size-2 rounded-full" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

/** 带文字的单选组 */
export function RadioOptions<T extends string>({
  value,
  onValueChange,
  options,
  className,
  orientation = 'horizontal',
}: {
  value: T
  onValueChange: (v: T) => void
  options: readonly { value: T; label: React.ReactNode; disabled?: boolean }[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
}) {
  const id = React.useId()
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      className={cn(
        orientation === 'horizontal' ? 'flex flex-wrap gap-x-5 gap-y-2' : 'grid',
        className,
      )}
    >
      {options.map((o) => (
        <label
          key={o.value}
          htmlFor={`${id}-${o.value}`}
          className="flex cursor-pointer items-center gap-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
        >
          <RadioGroupItem id={`${id}-${o.value}`} value={o.value} disabled={o.disabled} />
          {o.label}
        </label>
      ))}
    </RadioGroup>
  )
}
