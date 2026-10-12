'use client'

import { CANVAS_WIDTH, type AnyElement, type TemplatePage } from '@aim/template-schema'
import type { CSSProperties, ReactNode } from 'react'
import { usePreview } from './context'
import { getPreviewElement, ElementContent } from './elements/registry'
import { u } from './hooks'

interface FlowRow {
  y: number
  bottom: number
  items: AnyElement[]
  overlays: AnyElement[]
}

/**
 * flow 排版：按 y 分行（与当前行纵向重叠过半即并入），行内水平重叠的元素作为叠加层绝对定位，
 * 行间距与左右边距由蓝图坐标还原。
 */
export function buildFlowRows(elements: AnyElement[]): FlowRow[] {
  const sorted = elements.filter((e) => e.visible !== false).sort((a, b) => a.y - b.y || a.x - b.x)
  const rows: FlowRow[] = []
  for (const el of sorted) {
    const row = rows[rows.length - 1]
    if (row) {
      const overlapsH = row.items.some((i) => el.x < i.x + i.w - 1 && el.x + el.w > i.x + 1)
      const insideV = el.y >= row.y && el.y + el.h <= row.bottom + 1
      const inRow = el.y < row.y + Math.max(8, (row.bottom - row.y) * 0.5)
      if (overlapsH && (insideV || inRow)) {
        row.overlays.push(el)
        row.bottom = Math.max(row.bottom, el.y + el.h)
        continue
      }
      if (inRow) {
        row.items.push(el)
        row.bottom = Math.max(row.bottom, el.y + el.h)
        continue
      }
    }
    rows.push({ y: el.y, bottom: el.y + el.h, items: [el], overlays: [] })
  }
  for (const r of rows) r.items.sort((a, b) => a.x - b.x)
  return rows
}

function ElementShell({
  el,
  style,
  children,
}: {
  el: AnyElement
  style: CSSProperties
  children: ReactNode
}) {
  const { editor } = usePreview()
  const selectable = Boolean(editor?.onSelect)
  return (
    <div
      className="aim-el"
      data-type={el.type}
      data-slot={el.slot}
      data-selectable={selectable || undefined}
      data-selected={editor?.selectedId === el.id || undefined}
      data-issue={editor?.issueIds?.has(el.id) || undefined}
      data-clickable={!selectable && Boolean(el.event) ? true : undefined}
      style={style}
      onClick={
        selectable
          ? (e) => {
              e.stopPropagation()
              editor!.onSelect!(el.id, e)
            }
          : undefined
      }
      onDoubleClick={
        selectable && el.type === 'text' && !el.locked
          ? (e) => {
              e.stopPropagation()
              editor?.onEditStart?.(el.id)
            }
          : undefined
      }
    >
      {children}
      {editor?.renderOverlay?.(el)}
    </div>
  )
}

export interface CardCanvasProps {
  page: TemplatePage
  className?: string
  /** 卡片下方额外内容（如时间） */
  footer?: ReactNode
}

/** 渲染单页卡片（自动适配容器宽度） */
export function CardCanvas({ page, className, footer }: CardCanvasProps) {
  const { editor } = usePreview()
  const transparent = page.style.backgroundColor === 'transparent'
  const cardStyle = {
    '--aim-page-bg': transparent ? undefined : page.style.backgroundColor,
    '--aim-page-radius': page.style.borderRadius,
  } as CSSProperties

  let body: ReactNode
  if (page.mode === 'absolute') {
    body = (
      <div style={{ position: 'relative', height: u(page.style.height) }}>
        {page.elements
          .filter((e) => e.visible !== false)
          .map((el) => (
            <ElementShell
              key={el.id}
              el={el}
              style={{
                left: u(el.x),
                top: u(el.y),
                width: u(el.w),
                height: u(el.h),
                zIndex: (el.z ?? 0) + 1,
                transform: el.angle ? `rotate(${el.angle}deg)` : undefined,
              }}
            >
              <ElementContent el={el} />
            </ElementShell>
          ))}
      </div>
    )
  } else {
    const rows = buildFlowRows(page.elements)
    let prevBottom = 0
    const last = rows.reduce((m, r) => Math.max(m, r.bottom), 0)
    body = (
      <>
        {rows.map((row, i) => {
          const marginTop = Math.max(0, row.y - prevBottom)
          prevBottom = row.bottom
          let cursor = 0
          return (
            <div key={i} className="aim-flow-row" style={{ marginTop: u(marginTop) }}>
              {row.items.map((el) => {
                const auto = getPreviewElement(el.type)?.autoHeight
                const ml = Math.max(0, el.x - cursor)
                cursor = el.x + el.w
                return (
                  <ElementShell
                    key={el.id}
                    el={el}
                    style={{
                      marginLeft: u(ml),
                      width: u(Math.min(el.w, CANVAS_WIDTH)),
                      height: auto ? 'auto' : u(el.h),
                      minHeight:
                        auto && el.type === 'text'
                          ? undefined
                          : auto
                            ? u(Math.min(el.h, 24))
                            : undefined,
                      zIndex: (el.z ?? 0) + 1,
                    }}
                  >
                    <ElementContent el={el} />
                  </ElementShell>
                )
              })}
              {row.overlays.map((el) => (
                <ElementShell
                  key={el.id}
                  el={el}
                  style={{
                    position: 'absolute',
                    left: u(el.x),
                    top: u(el.y - row.y),
                    width: u(el.w),
                    height: getPreviewElement(el.type)?.autoHeight ? 'auto' : u(el.h),
                    zIndex: (el.z ?? 0) + 2,
                  }}
                >
                  <ElementContent el={el} />
                </ElementShell>
              ))}
            </div>
          )
        })}
        <div style={{ height: u(Math.max(0, page.style.height - last)) }} />
      </>
    )
  }

  return (
    <div className={`aim-scope ${className ?? ''}`}>
      <div
        className={editor ? 'aim-card aim-editing' : 'aim-card'}
        data-mode={page.mode}
        data-transparent={transparent || undefined}
        style={cardStyle}
      >
        {page.style.backgroundImage && (
          <div
            className="aim-card-bgimg"
            style={{
              backgroundImage: `url("${page.style.backgroundImage}")`,
              opacity: page.style.backgroundOpacity ?? 1,
            }}
          />
        )}
        {body}
      </div>
      {footer}
    </div>
  )
}
