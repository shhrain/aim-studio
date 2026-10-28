'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

import { updateElement } from '@aim/template-core'
import { TemplatePreview, type EditorBridge } from '@aim/template-preview'
import { VENDORS, getLayout, type AnyElement } from '@aim/template-schema'
import { Button, Hint, ScrollRow, Segmented, cn } from '@aim/ui'
import { MinusIcon, PlusIcon, Redo2Icon, ScanIcon, Undo2Icon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { redo, undo, useEditor } from '../store'
import { FreeHandles } from './free-handles'

const BASE_WIDTH = 400
/** 手机外壳宽高比（与 @aim/template-preview 的 .aim-phone 一致） */
const PHONE_RATIO = 620 / 300
/** 画布滚动区上下留白 + 底部提示 */
const CANVAS_CHROME = 20 + 40 + 28
const MIN_ZOOM = 0.6
const MAX_ZOOM = 1.4

/** 按可视高度计算适应缩放比例 */
function useFitZoom(ready: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const h = entry!.contentRect.height
      const z = (h - CANVAS_CHROME) / (BASE_WIDTH * PHONE_RATIO)
      setFit(Math.min(1, Math.max(MIN_ZOOM, Math.floor(z * 100) / 100)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])
  return [ref, fit] as const
}

export function EditorCanvas() {
  const ec = useEditorCopy()

  const doc = useEditor((s) => s.doc)
  const vendor = useEditor((s) => s.vendor)
  const zoomSetting = useEditor((s) => s.zoom)
  const [scrollerRef, fitZoom] = useFitZoom(Boolean(doc))
  const zoom = zoomSetting === 'fit' ? fitZoom : zoomSetting
  const step = (d: number) =>
    useEditor.getState().set({
      zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom + d) * 10) / 10)),
    })
  const paramDisplay = useEditor((s) => s.paramDisplay)
  const selectedId = useEditor((s) => s.selectedId)
  const editingId = useEditor((s) => s.editingId)
  const report = useEditor((s) => s.report)
  const { select, setEditing, update, set } = useEditor.getState()
  const canUndo = useStore(useEditor.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useEditor.temporal, (s) => s.futureStates.length > 0)

  const layout = doc ? getLayout(doc.layoutId) : undefined
  const free = doc?.pages[0]?.mode === 'absolute'
  const issueIds = useMemo(
    () =>
      new Set(
        (report?.issues ?? [])
          .filter((i) => i.elementId && i.level === 'error')
          .map((i) => i.elementId!),
      ),
    [report],
  )

  const bridge: EditorBridge = useMemo(
    () => ({
      selectedId,
      editingId,
      issueIds,
      onSelect: (id) => select(id),
      onEditStart: (id) => setEditing(id),
      onTextCommit: (id, text) => {
        update((d) => updateElement(d, id, { props: { text } }))
        setEditing(null)
      },
      renderOverlay: free
        ? (el: AnyElement) =>
            el.id === selectedId && !el.locked && el.id !== editingId ? (
              <FreeHandles el={el} />
            ) : null
        : undefined,
    }),
    [selectedId, editingId, issueIds, free, select, setEditing, update],
  )

  if (!doc) return null
  const vendors = layout?.vendors ?? doc.vendors

  return (
    <div className="canvas-grid @container/canvas relative flex min-w-0 flex-1 flex-col">
      <div className="bg-card/95 shadow-panel z-10 mx-3 mt-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-center gap-1 self-center rounded-xl border p-1 backdrop-blur *:shrink-0">
        <ScrollRow
          wrapperClassName="min-w-28 max-w-full !shrink"
          className="items-center gap-0.5 px-1"
          role="radiogroup"
          aria-label={ec('eace871053c')}
        >
          {vendors.map((v) => (
            <Hint
              key={v}
              content={
                doc.vendors.includes(v)
                  ? `${VENDORS[v].name}皮肤`
                  : `${VENDORS[v].name}（未勾选下发）`
              }
            >
              <button
                type="button"
                role="radio"
                aria-checked={vendor === v}
                onClick={() => set({ vendor: v })}
                className={cn(
                  'h-7 shrink-0 rounded-md px-2 text-xs whitespace-nowrap transition',
                  vendor === v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                  !doc.vendors.includes(v) && vendor !== v && 'opacity-50',
                )}
              >
                {VENDORS[v].name}
              </button>
            </Hint>
          ))}
        </ScrollRow>
        <div className="bg-border mx-1 h-5 w-px @max-[34rem]/canvas:hidden" />
        <Segmented
          size="sm"
          value={paramDisplay}
          onValueChange={(v) => set({ paramDisplay: v })}
          options={[
            { value: 'token', label: ec('eaa066c5382') },
            { value: 'example', label: ec('eda48f98ba9') },
          ]}
          aria-label={ec('edcb3f6660c')}
        />
        <div className="bg-border mx-1 h-5 w-px @max-[34rem]/canvas:hidden" />
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={ec('e290f680305')}
          disabled={zoom <= MIN_ZOOM}
          onClick={() => step(-0.1)}
        >
          <MinusIcon />
        </Button>
        <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={ec('e80f8fbcfa0')}
          disabled={zoom >= MAX_ZOOM}
          onClick={() => step(0.1)}
        >
          <PlusIcon />
        </Button>
        <Hint content={ec('ef8d01c881e')}>
          <Button
            size="icon-xs"
            variant={zoomSetting === 'fit' ? 'secondary' : 'ghost'}
            aria-label={ec('ef8d01c881e')}
            aria-pressed={zoomSetting === 'fit'}
            onClick={() => set({ zoom: 'fit' })}
          >
            <ScanIcon />
          </Button>
        </Hint>
        <div className="bg-border mx-1 h-5 w-px @max-[34rem]/canvas:hidden" />
        <Hint content={ec('eb3d5fe5c6e')}>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={ec('e926a50b98e')}
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2Icon />
          </Button>
        </Hint>
        <Hint content={ec('ee65a00b78e')}>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={ec('e03717b6f10')}
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2Icon />
          </Button>
        </Hint>
      </div>

      {doc.meta.status === 'reviewing' && (
        <div className="border-info/30 bg-info/10 text-info mx-3 mt-2 self-center rounded-lg border px-3 py-1.5 text-xs">
          {ec('e9833f5e11e')}
        </div>
      )}
      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-6 pt-5 pb-10"
        onClick={() => select(null)}
      >
        <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <TemplatePreview
            document={doc}
            vendor={vendor}
            mode="phone"
            width={BASE_WIDTH * zoom}
            paramDisplay={paramDisplay}
            interactive="none"
            editor={doc.meta.status === 'reviewing' ? undefined : bridge}
            ignoreVendorSupport
            chatbotName={doc.name || ec('e0c02319c56')}
          />
          <p className="text-muted-foreground text-xs">
            {free ? ec('ec4d10cc2b0') : ec('e940575ae82')} {ec('ed0c142f93a')}
          </p>
        </div>
      </div>
    </div>
  )
}
