'use client'
import { useEditorCopy, usePrecheckText } from '@/features/editor/lib/copy'

import { duplicateElement, removeElement, updateElement } from '@aim/template-core'
import { ELEMENT_META, expandSlots, getLayout, type ActionEvent } from '@aim/template-schema'
import { Alert, Button, Hint, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from '@aim/ui'
import { CopyIcon, Settings2Icon, Trash2Icon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PrecheckIssue } from '@aim/template-core'
import { useEditor, useSelectedElement } from '../store'
import { AutoForm, setIn, type Path } from './auto-form'
import { EventEditor } from './event-editor'
import { StyleEditor } from './style-editor'
import { TemplateSettings } from './template-settings'

const ISSUE_PREVIEW = 2

/** 选中元素的检测问题：默认显示前两条，其余折叠，避免挤占表单空间 */
function IssueList({ issues }: { issues: PrecheckIssue[] }) {
  const ec = useEditorCopy()
  const issueText = usePrecheckText()

  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? issues : issues.slice(0, ISSUE_PREVIEW)
  return (
    <div className="max-h-[40%] shrink-0 space-y-1.5 overflow-y-auto border-b p-3">
      {shown.map((i, idx) => (
        <Alert
          key={idx}
          variant={i.level === 'error' ? 'destructive' : 'warning'}
          className="py-2 text-xs"
        >
          {issueText(i)}
        </Alert>
      ))}
      {issues.length > ISSUE_PREVIEW && (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground w-full text-center text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? ec('eafd4b78353') : `还有 ${issues.length - ISSUE_PREVIEW} 个问题，展开查看`}
        </button>
      )}
    </div>
  )
}

export function Inspector() {
  const ec = useEditorCopy()

  const el = useSelectedElement()
  const doc = useEditor((s) => s.doc)
  const report = useEditor((s) => s.report)
  const { select, update, mutateElement } = useEditor.getState()

  const slot = useMemo(() => {
    if (!doc || !el?.slot) return undefined
    const layout = getLayout(doc.layoutId)
    return layout ? expandSlots(layout, doc.settings).find((s) => s.key === el.slot) : undefined
  }, [doc, el?.slot])

  if (!doc) return null
  const free = doc.pages[0]?.mode === 'absolute'
  const issues = el
    ? (report?.issues ?? []).filter((i) => i.elementId === el.id && i.level !== 'info')
    : []

  return (
    <aside className="bg-card flex w-[340px] shrink-0 flex-col border-l">
      {el ? (
        <>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {slot?.label ?? ELEMENT_META[el.type].label}
              </div>
              <div className="text-muted-foreground text-[11px]">
                {ELEMENT_META[el.type].label}
                {slot?.maxLength ? ` · 最多 ${slot.maxLength} 字` : ''}
              </div>
            </div>
            {(free || !el.slot) && (
              <>
                <Hint content={ec('e1c86b9f610')}>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={ec('ea74d262fbf')}
                    onClick={() => {
                      let id: string | undefined
                      update((d) => {
                        const r = duplicateElement(d, el.id)
                        id = r.element?.id
                        return r.doc
                      })
                      if (id) select(id)
                    }}
                  >
                    <CopyIcon />
                  </Button>
                </Hint>
                <Hint content={ec('ea8305c940c')}>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={ec('e2c98462c11')}
                    onClick={() => {
                      update((d) => removeElement(d, el.id))
                      select(null)
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </Hint>
              </>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={ec('e3fd47edce4')}
              onClick={() => select(null)}
            >
              <XIcon />
            </Button>
          </header>
          {issues.length > 0 && <IssueList key={`issues-${el.id}`} issues={issues} />}
          <Tabs defaultValue="content" className="min-h-0 flex-1 gap-0" key={`tabs-${el.id}`}>
            <TabsList variant="line" className="w-full justify-start gap-5 px-4">
              <TabsTrigger value="content">{ec('e7a68830642')}</TabsTrigger>
              <TabsTrigger value="style">{ec('ec8ffbdf157')}</TabsTrigger>
              {ELEMENT_META[el.type].clickable && (
                <TabsTrigger value="event">{ec('e99f1b08f64')}</TabsTrigger>
              )}
            </TabsList>
            <ScrollArea className="min-h-0 flex-1">
              <TabsContent value="content" className="p-4">
                <AutoForm
                  value={el.props as Record<string, unknown>}
                  path={[]}
                  ctx={{
                    el,
                    slot,
                    onSet: (path: Path, value: unknown) =>
                      mutateElement(el.id, (draft) =>
                        setIn(draft.props as Record<string, unknown>, path, value),
                      ),
                  }}
                />
              </TabsContent>
              <TabsContent value="style" className="p-4">
                <StyleEditor
                  el={el}
                  free={free}
                  onStyle={(patch) =>
                    update((d) =>
                      updateElement(d, el.id, { style: patch as Record<string, unknown> }),
                    )
                  }
                  onPatch={(patch) => update((d) => updateElement(d, el.id, patch as never))}
                />
              </TabsContent>
              <TabsContent value="event" className="p-4">
                <EventEditor
                  value={el.event}
                  elementType={el.type}
                  optional={el.type !== 'button'}
                  onChange={(event: ActionEvent | undefined) =>
                    mutateElement(el.id, (draft) => void (draft.event = event))
                  }
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </>
      ) : (
        <>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <Settings2Icon className="text-muted-foreground size-4" />
            <span className="text-sm font-semibold">{ec('e5274b79ad6')}</span>
          </header>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4">
              <TemplateSettings />
            </div>
          </ScrollArea>
        </>
      )}
    </aside>
  )
}
