'use client'

import { duplicateElement, removeElement, updateElement } from '@aim/template-core'
import { ELEMENT_META, expandSlots, getLayout, type ActionEvent } from '@aim/template-schema'
import { Alert, Button, Hint, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from '@aim/ui'
import { CopyIcon, Settings2Icon, Trash2Icon, XIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useEditor, useSelectedElement } from '../store'
import { AutoForm, setIn, type Path } from './auto-form'
import { EventEditor } from './event-editor'
import { StyleEditor } from './style-editor'
import { TemplateSettings } from './template-settings'

export function Inspector() {
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
  const issues = el ? (report?.issues ?? []).filter((i) => i.elementId === el.id && i.level !== 'info') : []

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l bg-card">
      {el ? (
        <>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{slot?.label ?? ELEMENT_META[el.type].label}</div>
              <div className="text-[11px] text-muted-foreground">
                {ELEMENT_META[el.type].label}
                {slot?.maxLength ? ` · 最多 ${slot.maxLength} 字` : ''}
              </div>
            </div>
            {(free || !el.slot) && (
              <>
                <Hint content="复制 Ctrl+D">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="复制元素"
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
                <Hint content="删除 Delete">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="删除元素"
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
            <Button size="icon-sm" variant="ghost" aria-label="关闭" onClick={() => select(null)}>
              <XIcon />
            </Button>
          </header>
          {issues.length > 0 && (
            <div className="space-y-1.5 border-b p-3">
              {issues.map((i, idx) => (
                <Alert key={idx} variant={i.level === 'error' ? 'destructive' : 'warning'} className="py-2 text-xs">
                  {i.message}
                </Alert>
              ))}
            </div>
          )}
          <Tabs defaultValue="content" className="min-h-0 flex-1 gap-0" key={el.id}>
            <TabsList variant="line" className="w-full justify-start gap-5 px-4">
              <TabsTrigger value="content">内容</TabsTrigger>
              <TabsTrigger value="style">样式</TabsTrigger>
              {ELEMENT_META[el.type].clickable && <TabsTrigger value="event">交互</TabsTrigger>}
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
                      mutateElement(el.id, (draft) => setIn(draft.props as Record<string, unknown>, path, value)),
                  }}
                />
              </TabsContent>
              <TabsContent value="style" className="p-4">
                <StyleEditor
                  el={el}
                  free={free}
                  onStyle={(patch) => update((d) => updateElement(d, el.id, { style: patch as Record<string, unknown> }))}
                  onPatch={(patch) => update((d) => updateElement(d, el.id, patch as never))}
                />
              </TabsContent>
              <TabsContent value="event" className="p-4">
                <EventEditor
                  value={el.event}
                  elementType={el.type}
                  optional={el.type !== 'button'}
                  onChange={(event: ActionEvent | undefined) => mutateElement(el.id, (draft) => void (draft.event = event))}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </>
      ) : (
        <>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <Settings2Icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">模板设置</span>
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
