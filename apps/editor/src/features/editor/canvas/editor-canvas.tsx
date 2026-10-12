'use client'

import { updateElement } from '@aim/template-core'
import { TemplatePreview, type EditorBridge } from '@aim/template-preview'
import { VENDORS, getLayout, type AnyElement } from '@aim/template-schema'
import { Button, Hint, Segmented, cn } from '@aim/ui'
import { MinusIcon, PlusIcon, Redo2Icon, Undo2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { useStore } from 'zustand'
import { redo, undo, useEditor } from '../store'
import { FreeHandles } from './free-handles'

const BASE_WIDTH = 400

export function EditorCanvas() {
  const doc = useEditor((s) => s.doc)
  const vendor = useEditor((s) => s.vendor)
  const zoom = useEditor((s) => s.zoom)
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
          .filter((i) => i.elementId && i.level !== 'info')
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
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div className="bg-card/95 shadow-panel absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border p-1 backdrop-blur">
        <div className="flex items-center gap-0.5 px-1" role="radiogroup" aria-label="预览厂商">
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
        </div>
        <div className="bg-border mx-1 h-5 w-px" />
        <Segmented
          size="sm"
          value={paramDisplay}
          onValueChange={(v) => set({ paramDisplay: v })}
          options={[
            { value: 'token', label: '参数名' },
            { value: 'example', label: '示例值' },
          ]}
          aria-label="参数显示"
        />
        <div className="bg-border mx-1 h-5 w-px" />
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="缩小"
          disabled={zoom <= 0.7}
          onClick={() => set({ zoom: Math.round((zoom - 0.1) * 10) / 10 })}
        >
          <MinusIcon />
        </Button>
        <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="放大"
          disabled={zoom >= 1.4}
          onClick={() => set({ zoom: Math.round((zoom + 0.1) * 10) / 10 })}
        >
          <PlusIcon />
        </Button>
        <div className="bg-border mx-1 h-5 w-px" />
        <Hint content="撤销 Ctrl+Z">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="撤销"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2Icon />
          </Button>
        </Hint>
        <Hint content="重做 Ctrl+Shift+Z">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="重做"
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2Icon />
          </Button>
        </Hint>
      </div>

      {doc.meta.status === 'reviewing' && (
        <div className="border-info/30 bg-info/10 text-info absolute top-14 left-1/2 z-10 -translate-x-1/2 rounded-lg border px-3 py-1.5 text-xs">
          模板审核中，当前为只读预览；审核完成后可继续编辑。
        </div>
      )}
      <div
        className="canvas-grid flex min-h-0 flex-1 items-start justify-center overflow-auto px-10 pt-16 pb-10"
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
            chatbotName={doc.name || '企业服务号'}
          />
          <p className="text-muted-foreground text-xs">
            {free ? '拖拽移动 · 拖动手柄缩放 · 方向键微调' : '单击选中 · 双击文本直接编辑'} · Ctrl+K
            打开命令面板
          </p>
        </div>
      </div>
    </div>
  )
}
