'use client'

import { arrangeElement, removeElement, updateElement } from '@aim/template-core'
import { ELEMENT_META, expandSlots, getLayout } from '@aim/template-schema'
import { Button, Empty, Hint, cn } from '@aim/ui'
import { stripTags, truncate } from '@aim/utils'
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, LockIcon, Trash2Icon } from 'lucide-react'
import { useEditor } from '../store'

export function LayersPanel() {
  const doc = useEditor((s) => s.doc)
  const selectedId = useEditor((s) => s.selectedId)
  const report = useEditor((s) => s.report)
  const { select, update } = useEditor.getState()
  if (!doc) return null
  const page = doc.pages[0]!
  const free = page.mode === 'absolute'
  const layout = getLayout(doc.layoutId)
  const slotLabels = new Map((layout ? expandSlots(layout, doc.settings) : []).map((s) => [s.key, s.label]))
  const issues = new Set((report?.issues ?? []).filter((i) => i.level === 'error').map((i) => i.elementId))
  const list = [...page.elements].sort((a, b) => (free ? (b.z ?? 0) - (a.z ?? 0) : a.y - b.y || a.x - b.x))
  if (!list.length) return <Empty size="sm" title="画布为空" description="从「元素」面板添加" />
  return (
    <ul className="space-y-0.5 p-2">
      {list.map((el) => {
        const text = el.type === 'text' || el.type === 'button' ? truncate(stripTags((el.props as { text: string }).text), 14) : ''
        return (
          <li key={el.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => select(el.id)}
              onKeyDown={(e) => e.key === 'Enter' && select(el.id)}
              className={cn(
                'group flex h-10 items-center gap-2 rounded-md px-2 text-sm transition',
                selectedId === el.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                el.visible === false && 'opacity-50',
              )}
            >
              <span className={cn('size-1.5 shrink-0 rounded-full', issues.has(el.id) ? 'bg-destructive' : 'bg-transparent')} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px]">{(el.slot && slotLabels.get(el.slot)) ?? ELEMENT_META[el.type].label}</div>
                {text && <div className="truncate text-[11px] text-muted-foreground">{text}</div>}
              </div>
              {el.locked && <LockIcon className="size-3.5 text-muted-foreground" />}
              <div className="hidden items-center group-hover:flex">
                <Hint content={el.visible === false ? '显示' : '隐藏'}>
                  <Button size="icon-xs" variant="ghost" aria-label="切换显示" onClick={(e) => (e.stopPropagation(), update((d) => updateElement(d, el.id, { visible: el.visible === false })))}>
                    {el.visible === false ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </Hint>
                {free && (
                  <>
                    <Button size="icon-xs" variant="ghost" aria-label="上移一层" onClick={(e) => (e.stopPropagation(), update((d) => arrangeElement(d, el.id, 'forward')))}>
                      <ArrowUpIcon />
                    </Button>
                    <Button size="icon-xs" variant="ghost" aria-label="下移一层" onClick={(e) => (e.stopPropagation(), update((d) => arrangeElement(d, el.id, 'backward')))}>
                      <ArrowDownIcon />
                    </Button>
                  </>
                )}
                {(free || !el.slot) && (
                  <Button size="icon-xs" variant="ghost" aria-label="删除" onClick={(e) => (e.stopPropagation(), update((d) => removeElement(d, el.id)), select(null))}>
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
