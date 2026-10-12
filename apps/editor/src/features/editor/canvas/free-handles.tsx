'use client'

import { updateElement } from '@aim/template-core'
import { CANVAS_WIDTH, type AnyElement } from '@aim/template-schema'
import { useRef, useState } from 'react'
import { useEditor } from '../store'

type Mode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const HANDLES: { mode: Mode; cls: string; cursor: string }[] = [
  { mode: 'nw', cls: '-top-1 -left-1', cursor: 'nwse-resize' },
  { mode: 'n', cls: '-top-1 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { mode: 'ne', cls: '-top-1 -right-1', cursor: 'nesw-resize' },
  { mode: 'e', cls: 'top-1/2 -right-1 -translate-y-1/2', cursor: 'ew-resize' },
  { mode: 'se', cls: '-right-1 -bottom-1', cursor: 'nwse-resize' },
  { mode: 's', cls: '-bottom-1 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { mode: 'sw', cls: '-bottom-1 -left-1', cursor: 'nesw-resize' },
  { mode: 'w', cls: 'top-1/2 -left-1 -translate-y-1/2', cursor: 'ew-resize' },
]
const SNAP = 4
const MIN = 8

function snap(value: number, targets: number[]): number {
  let best = value
  let dist = SNAP + 1
  for (const t of targets) {
    const d = Math.abs(value - t)
    if (d < dist) {
      dist = d
      best = t
    }
  }
  return dist <= SNAP ? best : Math.round(value)
}

/** 移动吸附：起边 / 终边 / 中线 中距离目标最近者 */
function snapBox(start: number, size: number, targets: number[]): number {
  let best = { d: SNAP + 1, v: Math.round(start) }
  for (const off of [0, size, size / 2]) {
    for (const t of targets) {
      const d = Math.abs(start + off - t)
      if (d < best.d) best = { d, v: t - off }
    }
  }
  return best.d <= SNAP ? best.v : Math.round(start)
}

/** 自由版式：拖拽移动 / 八向缩放 / 边缘与中线吸附 */
export function FreeHandles({ el }: { el: AnyElement }) {
  const start = useRef<{ px: number; py: number; box: { x: number; y: number; w: number; h: number }; mode: Mode; scale: number } | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const onDown = (mode: Mode) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const card = e.currentTarget.closest('.aim-card')
    const scale = (card?.getBoundingClientRect().width ?? CANVAS_WIDTH) / CANVAS_WIDTH
    start.current = { px: e.clientX, py: e.clientY, box: { x: el.x, y: el.y, w: el.w, h: el.h }, mode, scale }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* 合成事件无有效 pointerId */
    }
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = start.current
    if (!s) return
    const dx = (e.clientX - s.px) / s.scale
    const dy = (e.clientY - s.py) / s.scale
    const { doc } = useEditor.getState()
    const page = doc?.pages[0]
    if (!page) return
    const others = page.elements.filter((o) => o.id !== el.id && o.visible)
    const xs = [0, CANVAS_WIDTH, CANVAS_WIDTH / 2, ...others.flatMap((o) => [o.x, o.x + o.w, o.x + o.w / 2])]
    const ys = [0, page.style.height, ...others.flatMap((o) => [o.y, o.y + o.h, o.y + o.h / 2])]
    let { x, y, w, h } = s.box
    if (s.mode === 'move') {
      x = snapBox(s.box.x + dx, w, xs)
      y = snapBox(s.box.y + dy, h, ys)
    } else {
      if (s.mode.includes('e')) w = Math.max(MIN, snap(s.box.x + s.box.w + dx, xs) - s.box.x)
      if (s.mode.includes('s')) h = Math.max(MIN, snap(s.box.y + s.box.h + dy, ys) - s.box.y)
      if (s.mode.includes('w')) {
        const nx = Math.min(s.box.x + s.box.w - MIN, snap(s.box.x + dx, xs))
        w = s.box.x + s.box.w - nx
        x = nx
      }
      if (s.mode.includes('n')) {
        const ny = Math.min(s.box.y + s.box.h - MIN, snap(s.box.y + dy, ys))
        h = s.box.y + s.box.h - ny
        y = ny
      }
    }
    setHint(s.mode === 'move' ? `${Math.round(x)}, ${Math.round(y)}` : `${Math.round(w)} × ${Math.round(h)}`)
    useEditor.getState().update((d) => {
      let next = updateElement(d, el.id, { x, y, w, h })
      const bottom = y + h + 12
      if (bottom > page.style.height) next = { ...next, pages: next.pages.map((p, i) => (i === 0 ? { ...p, style: { ...p.style, height: Math.ceil(bottom) } } : p)) }
      return next
    })
  }

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    start.current = null
    setHint(null)
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className="absolute inset-0 z-10 cursor-move touch-none"
      onPointerDown={onDown('move')}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        if (el.type === 'text') {
          e.stopPropagation()
          useEditor.getState().setEditing(el.id)
        }
      }}
    >
      {HANDLES.map((hd) => (
        <div
          key={hd.mode}
          className={`absolute size-2 rounded-[2px] border border-primary bg-white shadow-sm ${hd.cls}`}
          style={{ cursor: hd.cursor }}
          onPointerDown={onDown(hd.mode)}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
      ))}
      {hint && (
        <div className="pointer-events-none absolute -top-7 left-0 rounded bg-foreground px-1.5 py-0.5 text-[11px] whitespace-nowrap text-background tabular-nums">
          {hint}
        </div>
      )}
    </div>
  )
}
