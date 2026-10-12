'use client'

import type { AnyElement, ElementStyle } from '@aim/template-schema'
import { Field, FieldGroup, Input, Switch, ToggleGroup, ToggleGroupItem } from '@aim/ui'
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon } from 'lucide-react'

const TEXT_TYPES = new Set(['text', 'button', 'submitButton', 'tel', 'audio'])

function ColorInput({
  value,
  onChange,
  placeholder = '默认',
}: {
  value?: string
  onChange: (v: string | undefined) => void
  placeholder?: string
}) {
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'
  return (
    <div className="flex items-center gap-1.5">
      <label
        className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border"
        style={{ background: value || 'transparent' }}
      >
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8"
      />
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value?: number
  onChange: (v: number | undefined) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <Input
      type="number"
      className="h-8"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      suffix={suffix}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  )
}

export function StyleEditor({
  el,
  free,
  onStyle,
  onPatch,
}: {
  el: AnyElement
  free: boolean
  onStyle: (patch: Partial<ElementStyle>) => void
  onPatch: (patch: Partial<AnyElement>) => void
}) {
  const s = el.style ?? {}
  const text = TEXT_TYPES.has(el.type)
  return (
    <div className="space-y-6">
      {free && (
        <FieldGroup title="位置与尺寸">
          <div className="grid grid-cols-2 gap-2">
            {(['x', 'y', 'w', 'h'] as const).map((k) => (
              <Field key={k} label={{ x: 'X', y: 'Y', w: '宽', h: '高' }[k]} orientation="vertical">
                <NumberInput
                  value={Math.round(el[k])}
                  onChange={(v) => onPatch({ [k]: v ?? 0 })}
                  min={k === 'w' || k === 'h' ? 1 : undefined}
                />
              </Field>
            ))}
            <Field label="旋转">
              <NumberInput
                value={el.angle ?? 0}
                onChange={(v) => onPatch({ angle: v ?? 0 })}
                min={-180}
                max={180}
                suffix="°"
              />
            </Field>
            <Field label="层级">
              <NumberInput value={el.z ?? 0} onChange={(v) => onPatch({ z: v ?? 0 })} />
            </Field>
          </div>
        </FieldGroup>
      )}
      {text && (
        <FieldGroup title="文字">
          <div className="grid grid-cols-2 gap-2">
            <Field label="字号">
              <NumberInput
                value={s.fontSize}
                onChange={(v) => onStyle({ fontSize: v })}
                min={10}
                max={48}
                suffix="px"
              />
            </Field>
            <Field label="行高">
              <NumberInput
                value={s.lineHeight}
                onChange={(v) => onStyle({ lineHeight: v })}
                min={1}
                max={3}
                step={0.1}
              />
            </Field>
          </div>
          <Field label="颜色">
            <ColorInput value={s.color} onChange={(v) => onStyle({ color: v })} />
          </Field>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={s.textAlign ?? ''}
              onValueChange={(v) =>
                onStyle({ textAlign: (v || undefined) as ElementStyle['textAlign'] })
              }
            >
              <ToggleGroupItem value="left" aria-label="左对齐">
                <AlignLeftIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="居中">
                <AlignCenterIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="右对齐">
                <AlignRightIcon />
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type="single"
              value={Number(s.fontWeight) >= 600 || s.fontWeight === 'bold' ? 'bold' : ''}
              onValueChange={(v) => onStyle({ fontWeight: v ? 600 : 400 })}
            >
              <ToggleGroupItem value="bold" aria-label="加粗">
                <BoldIcon />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {el.type === 'text' && (
            <Field label="最多显示行数" description="超出部分显示省略号；0 表示不限制">
              <NumberInput
                value={s.lineClamp ?? 0}
                onChange={(v) => onStyle({ lineClamp: v || undefined })}
                min={0}
                max={20}
              />
            </Field>
          )}
        </FieldGroup>
      )}
      <FieldGroup title="外观">
        <Field label="背景色">
          <ColorInput
            value={s.backgroundColor}
            onChange={(v) => onStyle({ backgroundColor: v })}
            placeholder="透明 / 主题默认"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="圆角">
            <NumberInput
              value={s.borderRadius}
              onChange={(v) => onStyle({ borderRadius: v })}
              min={0}
              max={200}
              suffix="px"
            />
          </Field>
          <Field label="不透明度">
            <NumberInput
              value={s.opacity != null ? Math.round(s.opacity * 100) : 100}
              onChange={(v) =>
                onStyle({ opacity: v == null ? undefined : Math.min(1, Math.max(0, v / 100)) })
              }
              min={0}
              max={100}
              suffix="%"
            />
          </Field>
        </div>
        {!['button', 'submitButton'].includes(el.type) && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="内边距">
              <NumberInput
                value={s.padding}
                onChange={(v) => onStyle({ padding: v })}
                min={0}
                max={40}
                suffix="px"
              />
            </Field>
            <Field label="边框">
              <NumberInput
                value={s.borderWidth}
                onChange={(v) => onStyle({ borderWidth: v, borderStyle: v ? 'solid' : 'none' })}
                min={0}
                max={8}
                suffix="px"
              />
            </Field>
          </div>
        )}
      </FieldGroup>
      <FieldGroup title="状态">
        <label className="flex items-center justify-between text-[13px] font-medium">
          显示
          <Switch checked={el.visible !== false} onCheckedChange={(v) => onPatch({ visible: v })} />
        </label>
        {free && (
          <label className="flex items-center justify-between text-[13px] font-medium">
            锁定位置
            <Switch checked={Boolean(el.locked)} onCheckedChange={(v) => onPatch({ locked: v })} />
          </label>
        )}
      </FieldGroup>
    </div>
  )
}
