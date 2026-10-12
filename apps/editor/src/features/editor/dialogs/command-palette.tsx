'use client'

import { addElement } from '@aim/template-core'
import { ELEMENT_META, ELEMENT_TYPES, VENDORS } from '@aim/template-schema'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Dialog, DialogContent, DialogTitle, Kbd } from '@aim/ui'
import { BookOpenIcon, EyeIcon, LayoutGridIcon, PlusIcon, Redo2Icon, SaveIcon, SendIcon, SmartphoneIcon, Undo2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { env } from '@/lib/api'
import { redo, undo, useEditor } from '../store'

export function CommandPalette({ saveNow, onSwitchLayout }: { saveNow: () => Promise<boolean>; onSwitchLayout: () => void }) {
  const open = useEditor((s) => s.paletteOpen)
  const doc = useEditor((s) => s.doc)
  const set = useEditor((s) => s.set)
  const router = useRouter()
  const run = (fn: () => void) => () => {
    set({ paletteOpen: false })
    fn()
  }
  return (
    <Dialog open={open} onOpenChange={(o) => set({ paletteOpen: o })}>
      <DialogContent size="md" showCloseButton={false} className="overflow-hidden p-0">
        <DialogTitle className="sr-only">命令面板</DialogTitle>
        <Command>
          <CommandInput placeholder="输入命令或搜索元素、厂商…" />
          <CommandList className="max-h-96">
            <CommandEmpty>没有匹配的命令</CommandEmpty>
            <CommandGroup heading="常用">
              <CommandItem onSelect={run(() => void saveNow())}>
                <SaveIcon />
                立即保存
                <Kbd className="ml-auto">Ctrl S</Kbd>
              </CommandItem>
              <CommandItem onSelect={run(() => set({ previewOpen: true }))}>
                <EyeIcon />
                多厂商预览
                <Kbd className="ml-auto">Ctrl P</Kbd>
              </CommandItem>
              <CommandItem onSelect={run(() => set({ reviewOpen: true }))}>
                <SendIcon />
                检查并提交审核
              </CommandItem>
              <CommandItem onSelect={run(undo)}>
                <Undo2Icon />
                撤销
                <Kbd className="ml-auto">Ctrl Z</Kbd>
              </CommandItem>
              <CommandItem onSelect={run(redo)}>
                <Redo2Icon />
                重做
              </CommandItem>
              <CommandItem onSelect={run(onSwitchLayout)}>
                <LayoutGridIcon />
                更换版式
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="添加元素">
              {ELEMENT_TYPES.map((t) => (
                <CommandItem
                  key={t}
                  value={`添加 ${ELEMENT_META[t].label} ${t}`}
                  onSelect={run(() => {
                    let id: string | undefined
                    useEditor.getState().update((d) => {
                      const r = addElement(d, t)
                      id = r.element.id
                      return r.doc
                    })
                    if (id) useEditor.getState().select(id)
                  })}
                >
                  <PlusIcon />
                  添加{ELEMENT_META[t].label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="切换预览厂商">
              {(doc?.vendors ?? []).map((v) => (
                <CommandItem key={v} value={`厂商 ${VENDORS[v].name} ${v}`} onSelect={run(() => set({ vendor: v }))}>
                  <SmartphoneIcon />
                  {VENDORS[v].name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="导航">
              <CommandItem onSelect={run(() => router.push('/templates'))}>
                <LayoutGridIcon />
                返回模板列表
              </CommandItem>
              <CommandItem onSelect={run(() => window.open(env.docsUrl, '_blank'))}>
                <BookOpenIcon />
                打开帮助文档
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
