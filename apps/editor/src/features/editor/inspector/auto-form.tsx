'use client'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Material } from '@aim/api-client'
import {
  RATIO_OPTIONS,
  type ActionEvent,
  type AnyElement,
  type SlotDefinition,
} from '@aim/template-schema'
import { Button, Field, Input, SimpleSelect, Switch } from '@aim/ui'
import { deepClone, formatDate } from '@aim/utils'
import { ChevronDownIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useId, useState } from 'react'
import {
  ELEMENT_ENUMS,
  ENUM_OPTIONS,
  FIELD_LABELS,
  LONG_TEXT_FIELDS,
  MEDIA_FIELDS,
} from '../lib/labels'
import { EventEditor } from './event-editor'
import { MediaInput } from './media-input'
import { TextInput } from './text-input'

export type Path = (string | number)[]

export interface AutoFormContext {
  el: AnyElement
  slot?: SlotDefinition
  onSet: (path: Path, value: unknown) => void
}

const HIDDEN = new Set(['rich', 'activeIndex', 'role'])
const THEME_NAMES = ['活力橙', '经典红', '清新绿', '湖水蓝', '尊享紫', '高级黑']

/** 'cards', 0, 'title' → cards[].title（与 SlotDefinition.limits 对齐） */
export function limitKey(path: Path): string {
  return path.reduce<string>(
    (acc, p) => (typeof p === 'number' ? `${acc}[]` : acc ? `${acc}.${p}` : String(p)),
    '',
  )
}

export function setIn(target: Record<string, unknown>, path: Path, value: unknown) {
  let cur: Record<string | number, unknown> = target
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i]!
    if (cur[k] == null || typeof cur[k] !== 'object')
      cur[k] = typeof path[i + 1] === 'number' ? [] : {}
    cur = cur[k] as Record<string | number, unknown>
  }
  const last = path[path.length - 1]!
  if (value === undefined) delete cur[last]
  else cur[last] = value
}

function aiKind(key: string, el: AnyElement): 'title' | 'description' | 'button' | undefined {
  if (key === 'title' || key === 'name') return 'title'
  if (key === 'description' || key === 'content') return 'description'
  if (key === 'text')
    return el.type === 'button' || el.type === 'submitButton'
      ? 'button'
      : el.slot === 'description'
        ? 'description'
        : 'title'
  return undefined
}

export function AutoForm({
  value,
  path,
  ctx,
}: {
  value: Record<string, unknown>
  path: Path
  ctx: AutoFormContext
}) {
  const keys = Object.keys(value).filter((k) => !HIDDEN.has(k))
  keys.sort((a, b) => (a === 'event' ? 1 : b === 'event' ? -1 : 0))
  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <AutoField key={k} k={k} value={value[k]} path={[...path, k]} ctx={ctx} parent={value} />
      ))}
    </div>
  )
}

function AutoField({
  k,
  value,
  path,
  ctx,
  parent,
}: {
  k: string
  value: unknown
  path: Path
  ctx: AutoFormContext
  parent: Record<string, unknown>
}) {
  const id = useId()
  const label = FIELD_LABELS[k] ?? k
  const lk = limitKey(path)
  const max =
    ctx.slot?.limits?.[lk] ??
    (path.length === 1 && (k === 'text' || k === 'title') ? ctx.slot?.maxLength : undefined)
  const set = (v: unknown) => ctx.onSet(path, v)
  const enums = ELEMENT_ENUMS[ctx.el.type]?.[k] ?? ENUM_OPTIONS[k]

  if (k === 'event') {
    return (
      <Collapsible title="点击事件" defaultOpen={Boolean(value)}>
        <EventEditor
          value={value as ActionEvent | undefined}
          onChange={set}
          elementType={ctx.el.type}
        />
      </Collapsible>
    )
  }

  if (typeof value === 'string' || (value === undefined && MEDIA_FIELDS.has(k))) {
    const str = (value as string | undefined) ?? ''
    if (MEDIA_FIELDS.has(k)) {
      const isVideo =
        (ctx.el.type === 'video' && k === 'src') ||
        (ctx.el.type === 'swiper' &&
          k === 'src' &&
          (ctx.el.props as { resourceType?: string }).resourceType === 'video') ||
        (path.includes('video') && k === 'src')
      return (
        <Field label={label}>
          <MediaInput
            value={str}
            type={isVideo ? 'video' : 'image'}
            onChange={set}
            onPickMaterial={
              isVideo
                ? (m: Material) => {
                    const base = path.slice(0, -1)
                    ctx.onSet([...base, 'src'], m.url)
                    if (m.cover) ctx.onSet([...base, 'cover'], m.cover)
                    if (m.duration && 'duration' in parent)
                      ctx.onSet([...base, 'duration'], m.duration)
                  }
                : undefined
            }
          />
        </Field>
      )
    }
    if (enums) {
      return (
        <Field label={label}>
          <SimpleSelect value={str} onValueChange={set} options={enums} />
        </Field>
      )
    }
    if (k === 'url') {
      return (
        <Field label={label} htmlFor={id}>
          <Input id={id} value={str} placeholder="https://" onChange={(e) => set(e.target.value)} />
        </Field>
      )
    }
    return (
      <Field
        label={label}
        htmlFor={id}
        required={path.length === 1 && ctx.slot?.required && (k === 'text' || k === 'title')}
      >
        <TextInput
          id={id}
          value={str}
          onChange={set}
          maxLength={max}
          multiline={LONG_TEXT_FIELDS.has(k) && (max ?? 40) > 24}
          ai={aiKind(k, ctx.el)}
        />
      </Field>
    )
  }

  if (typeof value === 'number') {
    if (k === 'endTime')
      return (
        <Field label={label}>
          <Input
            type="datetime-local"
            value={formatDate(value, 'YYYY-MM-DDTHH:mm')}
            onChange={(e) => set(new Date(e.target.value).getTime() || value)}
          />
        </Field>
      )
    if (k === 'themeColor')
      return (
        <Field label={label}>
          <SimpleSelect
            value={String(value)}
            onValueChange={(v) => set(Number(v))}
            options={THEME_NAMES.map((n, i) => ({ value: String(i), label: n }))}
          />
        </Field>
      )
    return (
      <Field label={label} htmlFor={id}>
        <Input
          id={id}
          type="number"
          step="any"
          value={value}
          onChange={(e) => set(e.target.value === '' ? 0 : Number(e.target.value))}
        />
      </Field>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center justify-between gap-3 text-[13px] font-medium">
        {label}
        <Switch checked={value} onCheckedChange={set} />
      </label>
    )
  }

  if (Array.isArray(value)) {
    if (k === 'ratio' && value.length === 2 && value.every((n) => typeof n === 'number')) {
      const current = `${value[0]}:${value[1]}`
      const opts = RATIO_OPTIONS.some((r) => r.value === current)
        ? RATIO_OPTIONS
        : [{ value: current, label: current, ratio: value as [number, number] }, ...RATIO_OPTIONS]
      return (
        <Field label={label}>
          <SimpleSelect
            value={current}
            onValueChange={(v) => set(opts.find((o) => o.value === v)!.ratio)}
            options={opts}
          />
        </Field>
      )
    }
    if (k === 'dateRange') {
      const [s = '', e = ''] = value as string[]
      return (
        <Field label={label}>
          <div className="flex items-center gap-1.5">
            <Input type="date" value={s} onChange={(ev) => set([ev.target.value, e])} />
            <span className="text-muted-foreground">~</span>
            <Input type="date" value={e} onChange={(ev) => set([s, ev.target.value])} />
          </div>
        </Field>
      )
    }
    if (value.every((v) => typeof v === 'string'))
      return <StringList label={label} value={value as string[]} onChange={set} />
    const count = ctx.slot?.count && ctx.slot.count.path === lk ? ctx.slot.count : undefined
    return (
      <ListEditor
        label={label}
        items={value as Record<string, unknown>[]}
        path={path}
        ctx={ctx}
        min={count?.min ?? 0}
        max={count?.max ?? 10}
      />
    )
  }

  if (value && typeof value === 'object') {
    return (
      <Collapsible title={label} defaultOpen>
        <AutoForm value={value as Record<string, unknown>} path={path} ctx={ctx} />
      </Collapsible>
    )
  }
  return null
}

function Collapsible({
  title,
  defaultOpen,
  children,
  extra,
}: {
  title: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  return (
    <section className="bg-card rounded-lg border">
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-1.5 text-left text-[13px] font-medium"
        >
          <ChevronDownIcon
            className={`text-muted-foreground size-4 transition ${open ? '' : '-rotate-90'}`}
          />
          {title}
        </button>
        {extra}
      </div>
      {open && <div className="border-t px-3 py-3">{children}</div>}
    </section>
  )
}

function StringList({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <Field label={label}>
      <div className="space-y-1.5">
        {value.map((s, i) => (
          <div key={i} className="flex gap-1.5">
            <Input
              value={s}
              onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="删除"
              disabled={value.length <= 1}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        <Button
          size="xs"
          variant="ghost"
          onClick={() => onChange([...value, `选项${value.length + 1}`])}
          disabled={value.length >= 10}
        >
          <PlusIcon />
          添加
        </Button>
      </div>
    </Field>
  )
}

function ListEditor({
  label,
  items,
  path,
  ctx,
  min,
  max,
}: {
  label: string
  items: Record<string, unknown>[]
  path: Path
  ctx: AutoFormContext
  min: number
  max: number
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const ids = items.map((_, i) => `${limitKey(path)}-${i}`)
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    ctx.onSet(
      path,
      arrayMove(items, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))),
    )
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium">
          {label}{' '}
          <span className="text-muted-foreground text-xs font-normal">
            （{items.length}/{max}）
          </span>
        </span>
        <Button
          size="xs"
          variant="soft"
          disabled={items.length >= max}
          onClick={() => ctx.onSet(path, [...items, deepClone(items[items.length - 1] ?? {})])}
        >
          <PlusIcon />
          添加
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((item, i) => (
            <SortableItem
              key={ids[i]}
              id={ids[i]!}
              index={i}
              canRemove={items.length > min}
              onRemove={() =>
                ctx.onSet(
                  path,
                  items.filter((_, j) => j !== i),
                )
              }
            >
              <AutoForm value={item} path={[...path, i]} ctx={ctx} />
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableItem({
  id,
  index,
  canRemove,
  onRemove,
  children,
}: {
  id: string
  index: number
  canRemove: boolean
  onRemove: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const [open, setOpen] = useState(index === 0)
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="bg-card rounded-lg border shadow-xs"
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          className="text-muted-foreground cursor-grab active:cursor-grabbing"
          aria-label="拖动排序"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-1 text-left text-[13px]"
        >
          第 {index + 1} 项
          <ChevronDownIcon
            className={`text-muted-foreground size-3.5 transition ${open ? '' : '-rotate-90'}`}
          />
        </button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="删除此项"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
      {open && <div className="border-t px-3 py-3">{children}</div>}
    </div>
  )
}
