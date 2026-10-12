'use client'

import type { PrecheckIssue } from '@aim/template-core'
import { Button, Hint, ScrollArea, cn, toast } from '@aim/ui'
import {
  BracesIcon,
  ImagesIcon,
  LayersIcon,
  LayoutTemplateIcon,
  MessageSquareIcon,
  ShapesIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { EditorCanvas } from './canvas/editor-canvas'
import { CommandPalette } from './dialogs/command-palette'
import { FeedbackDialog } from './dialogs/feedback-dialog'
import { PreviewDialog } from './dialogs/preview-dialog'
import { ReviewSheet } from './dialogs/review-sheet'
import { Inspector } from './inspector/inspector'
import { LayoutGallery } from './layout-gallery'
import { switchLayout } from './lib/switch-layout'
import { useAutosave } from './lib/use-autosave'
import { useHotkeys } from './lib/use-hotkeys'
import { ElementsPanel } from './panels/elements-panel'
import { LayersPanel } from './panels/layers-panel'
import { LayoutsPanel } from './panels/layouts-panel'
import { MaterialsPanel } from './panels/materials-panel'
import { ParamsPanel } from './panels/params-panel'
import { useEditor, type RailPanel } from './store'
import { TopBar } from './topbar'
import { Tour } from './tour'

const RAIL: { key: RailPanel; label: string; icon: LucideIcon }[] = [
  { key: 'layouts', label: '版式', icon: LayoutTemplateIcon },
  { key: 'elements', label: '元素', icon: ShapesIcon },
  { key: 'materials', label: '素材', icon: ImagesIcon },
  { key: 'params', label: '参数', icon: BracesIcon },
  { key: 'layers', label: '图层', icon: LayersIcon },
]

export function EditorWorkspace() {
  const panel = useEditor((s) => s.panel)
  const paramCount = useEditor((s) => s.doc?.params.length ?? 0)
  const layoutId = useEditor((s) => s.doc?.layoutId)
  const set = useEditor((s) => s.set)
  const [gallery, setGallery] = useState(false)
  const [feedback, setFeedback] = useState(false)
  const saveNow = useAutosave()
  useHotkeys(saveNow)

  const locate = (i: PrecheckIssue) => {
    if (!i.elementId) return
    useEditor.getState().select(i.elementId)
    set({ reviewOpen: false })
  }

  if (gallery) {
    return (
      <LayoutGallery
        current={layoutId}
        onClose={() => setGallery(false)}
        onPick={(layout) => {
          useEditor.getState().update((d) => switchLayout(d, layout.id))
          useEditor.getState().select(null)
          setGallery(false)
          toast.success(`已切换为「${layout.name}」，同名槽位内容已迁移`)
        }}
      />
    )
  }

  const title = RAIL.find((r) => r.key === panel)?.label
  return (
    <div className="flex h-dvh flex-col">
      <TopBar saveNow={saveNow} />
      <div className="flex min-h-0 flex-1">
        <nav
          className="bg-sidebar flex w-16 shrink-0 flex-col items-center gap-1 border-r py-3"
          aria-label="工具栏"
        >
          {RAIL.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ panel: panel === key ? null : key })}
              aria-pressed={panel === key}
              className={cn(
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground relative flex size-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] transition',
                panel === key && 'bg-accent text-accent-foreground',
              )}
            >
              <Icon className="size-5" />
              {label}
              {key === 'params' && paramCount > 0 && (
                <span className="bg-primary text-primary-foreground absolute top-1 right-1.5 min-w-4 rounded-full px-1 text-[10px] leading-4">
                  {paramCount}
                </span>
              )}
            </button>
          ))}
          <div className="mt-auto">
            <Hint content="意见反馈" side="right">
              <button
                type="button"
                onClick={() => setFeedback(true)}
                className="text-muted-foreground hover:bg-accent flex size-12 items-center justify-center rounded-lg"
                aria-label="意见反馈"
              >
                <MessageSquareIcon className="size-5" />
              </button>
            </Hint>
          </div>
        </nav>
        {panel && (
          <aside className="bg-card flex w-[300px] shrink-0 flex-col border-r">
            <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
              <span className="text-sm font-semibold">{title}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="收起面板"
                onClick={() => set({ panel: null })}
              >
                <XIcon />
              </Button>
            </header>
            <ScrollArea className="min-h-0 flex-1">
              {panel === 'layouts' && <LayoutsPanel onSwitch={() => setGallery(true)} />}
              {panel === 'elements' && <ElementsPanel />}
              {panel === 'materials' && <MaterialsPanel />}
              {panel === 'params' && <ParamsPanel />}
              {panel === 'layers' && <LayersPanel />}
            </ScrollArea>
          </aside>
        )}
        <div className="relative flex min-w-0 flex-1">
          <EditorCanvas />
          <Tour />
        </div>
        <Inspector />
      </div>
      <PreviewDialog />
      <ReviewSheet saveNow={saveNow} onLocate={locate} />
      <CommandPalette saveNow={saveNow} onSwitchLayout={() => setGallery(true)} />
      <FeedbackDialog open={feedback} onOpenChange={setFeedback} />
    </div>
  )
}
