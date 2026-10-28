'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'
import { appPath } from '@/lib/platform'

import { addElement } from '@aim/template-core'
import { ELEMENT_META, ELEMENT_TYPES, VENDORS } from '@aim/template-schema'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogTitle,
  Kbd,
} from '@aim/ui'
import {
  BookOpenIcon,
  EyeIcon,
  LayoutGridIcon,
  PlusIcon,
  Redo2Icon,
  SaveIcon,
  SendIcon,
  SmartphoneIcon,
  Undo2Icon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { env } from '@/lib/api'
import { redo, undo, useEditor } from '../store'

export function CommandPalette({
  saveNow,
  onSwitchLayout,
}: {
  saveNow: () => Promise<boolean>
  onSwitchLayout: () => void
}) {
  const ec = useEditorCopy()

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
        <DialogTitle className="sr-only">{ec('e4b495d8b87')}</DialogTitle>
        <Command>
          <CommandInput placeholder={ec('e04e303aa3b')} />
          <CommandList className="max-h-96">
            <CommandEmpty>{ec('e5565137439')}</CommandEmpty>
            <CommandGroup heading={ec('e4563c57b51')}>
              <CommandItem onSelect={run(() => void saveNow())}>
                <SaveIcon />
                {ec('ea92349e52e')}
                <Kbd className="ml-auto">Ctrl S</Kbd>
              </CommandItem>
              <CommandItem onSelect={run(() => set({ previewOpen: true }))}>
                <EyeIcon />
                {ec('e2a2ec432b6')}
                <Kbd className="ml-auto">Ctrl P</Kbd>
              </CommandItem>
              <CommandItem onSelect={run(() => set({ reviewOpen: true }))}>
                <SendIcon />
                {ec('e6feb185adf')}
              </CommandItem>
              <CommandItem onSelect={run(undo)}>
                <Undo2Icon />
                {ec('e926a50b98e')}
                <Kbd className="ml-auto">Ctrl Z</Kbd>
              </CommandItem>
              <CommandItem onSelect={run(redo)}>
                <Redo2Icon />
                {ec('e03717b6f10')}
              </CommandItem>
              <CommandItem onSelect={run(onSwitchLayout)}>
                <LayoutGridIcon />
                {ec('eaf730b7418')}
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading={ec('eb318f54acc')}>
              {ELEMENT_TYPES.map((t) => (
                <CommandItem
                  key={t}
                  value={`添加 ${ec(ELEMENT_META[t].label)} ${t}`}
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
                  {ec('e7a8a11ead5')}
                  {ec(ELEMENT_META[t].label)}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={ec('e89454632fb')}>
              {(doc?.vendors ?? []).map((v) => (
                <CommandItem
                  key={v}
                  value={`厂商 ${VENDORS[v].name} ${v}`}
                  onSelect={run(() => set({ vendor: v }))}
                >
                  <SmartphoneIcon />
                  {VENDORS[v].name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={ec('ee72622fe47')}>
              <CommandItem onSelect={run(() => router.push(appPath('templates')))}>
                <LayoutGridIcon />
                {ec('e4c45339799')}
              </CommandItem>
              <CommandItem onSelect={run(() => window.open(env.docsUrl, '_blank'))}>
                <BookOpenIcon />
                {ec('efc00880b5a')}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
